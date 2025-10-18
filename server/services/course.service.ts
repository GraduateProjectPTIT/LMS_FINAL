import { Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import CourseModel from "../models/course.model";
import CategoryModel from "../models/category.model";
import cloudinary from "cloudinary";
import mongoose from "mongoose";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notification.model";
import userModel from "../models/user.model";
import EnrolledCourseModel from "../models/enrolledCourse.model";
import { ECourseLevel } from "../constants/course-level.enum";
import { normalizeLevel, formatTime } from "../utils/course.helpers";

import ErrorHandler from "../utils/ErrorHandler";

/**
 * Tạo khóa học mới.
 * - Chỉ dành cho vai trò: admin, tutor
 * - Xử lý upload thumbnail (nếu có) lên Cloudinary
 * - Validate mảng categories và ánh xạ sang ObjectId
 * @param data Thông tin khóa học gửi từ client (bao gồm creatorId)
 * @param res Express Response
 * @param next Express NextFunction
 * @returns 201 { success, course } (đã populate creatorId, categories)
 */
export const createCourse = async (
  data: any,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!data.name) {
      console.log("Course name is missing");
      return next(new ErrorHandler("Course name is required", 400));
    }

    if (!data.description) {
      console.log("Course description is missing");
      return next(new ErrorHandler("Course description is required", 400));
    }

    if (!data.overview) {
      console.log("Course overview is missing");
      return next(new ErrorHandler("Course overview is required", 400));
    }

    if (!data.price) {
      console.log("Course price is missing");
      return next(new ErrorHandler("Course price is required", 400));
    }

    if (!data.creatorId) {
      return next(new ErrorHandler("Creator ID is required", 400));
    }

    if (!data.level) {
      return next(new ErrorHandler("Course level is required", 400));
    }
    const levelStr = String(data.level).trim().toLowerCase();
    const mapLevel = (val: string) => {
      if (val === ECourseLevel.Beginner.toLowerCase())
        return ECourseLevel.Beginner;
      if (val === ECourseLevel.Intermediate.toLowerCase())
        return ECourseLevel.Intermediate;
      if (val === ECourseLevel.Advanced.toLowerCase())
        return ECourseLevel.Advanced;
      if (val === ECourseLevel.Professional.toLowerCase())
        return ECourseLevel.Professional;
      return null;
    };
    const enumLevel = mapLevel(levelStr);
    if (!enumLevel) {
      return next(new ErrorHandler("Invalid course level", 400));
    }
    data.level = enumLevel;

    if (!data.videoDemo || !data.videoDemo.public_id || !data.videoDemo.url) {
      return next(
        new ErrorHandler(
          "videoDemo is required and must include public_id and url (upload via client with signature)",
          400
        )
      );
    }

    if (Array.isArray(data.courseData)) {
      for (const section of data.courseData) {
        if (!Array.isArray(section.sectionContents)) continue;
        for (const lecture of section.sectionContents) {
          if (!lecture?.video?.public_id || !lecture?.video?.url) {
            return next(
              new ErrorHandler(
                "Each lecture must include video { public_id, url } (upload via client with signature)",
                400
              )
            );
          }
        }
      }
    }

    if (
      data.thumbnail &&
      typeof data.thumbnail === "string" &&
      (data.thumbnail.startsWith("data:") || data.thumbnail.startsWith("http"))
    ) {
      try {
        const myCloud = await cloudinary.v2.uploader.upload(data.thumbnail, {
          folder: "courses",
          width: 750,
          height: 422,
          crop: "fill",
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      } catch (uploadError: any) {
        return next(
          new ErrorHandler(
            "Error uploading thumbnail: " + uploadError.message,
            500
          )
        );
      }
    }

    if (typeof data.level !== "undefined") {
      const levelStr = String(data.level).trim().toLowerCase();
      const mapLevel = (val: string) => {
        if (val === ECourseLevel.Beginner.toLowerCase())
          return ECourseLevel.Beginner;
        if (val === ECourseLevel.Intermediate.toLowerCase())
          return ECourseLevel.Intermediate;
        if (val === ECourseLevel.Advanced.toLowerCase())
          return ECourseLevel.Advanced;
        if (val === ECourseLevel.Professional.toLowerCase())
          return ECourseLevel.Professional;
        return null;
      };
      const enumLevel = mapLevel(levelStr);
      if (!enumLevel) {
        return next(new ErrorHandler("Invalid course level", 400));
      }
      data.level = enumLevel;
    }

    if (data.categories) {
      if (!Array.isArray(data.categories) || data.categories.length === 0) {
        return next(
          new ErrorHandler(
            "categories must be a non-empty array of Category ids",
            400
          )
        );
      }
      const ids: string[] = data.categories;
      if (
        !ids.every(
          (id) => typeof id === "string" && mongoose.Types.ObjectId.isValid(id)
        )
      ) {
        return next(
          new ErrorHandler("One or more category ids are invalid", 400)
        );
      }
      const found = await CategoryModel.find({ _id: { $in: ids } }).select(
        "_id"
      );
      if (found.length !== ids.length) {
        return next(
          new ErrorHandler("One or more categories do not exist", 400)
        );
      }
      data.categories = ids.map((id) => new mongoose.Types.ObjectId(id));
    }

    if (Array.isArray(data.benefits)) {
      data.benefits = data.benefits.map((b: any) => ({
        ...(b && b._id ? { _id: b._id } : {}),
        title: b?.title,
      }));
    }

    if (Array.isArray(data.prerequisites)) {
      data.prerequisites = data.prerequisites.map((p: any) => ({
        ...(p && p._id ? { _id: p._id } : {}),
        title: p?.title,
      }));
    }

    if (Array.isArray(data.courseData)) {
      data.courseData = data.courseData.map((section: any) => ({
        ...(section && section._id ? { _id: section._id } : {}),
        sectionTitle: section?.sectionTitle,
        sectionContents: Array.isArray(section?.sectionContents)
          ? section.sectionContents.map((lecture: any) => ({
              ...(lecture && lecture._id ? { _id: lecture._id } : {}),
              videoTitle: lecture?.videoTitle,
              videoDescription: lecture?.videoDescription,
              video: lecture?.video,
              videoLength: lecture?.videoLength,
              videoLinks: Array.isArray(lecture?.videoLinks)
                ? lecture.videoLinks.map((vl: any) => ({
                    ...(vl && vl._id ? { _id: vl._id } : {}),
                    title: vl?.title,
                    url: vl?.url,
                  }))
                : [],
            }))
          : [],
      }));
    }

    if (Array.isArray(data.benefits)) {
      data.benefits = data.benefits.map((b: any) => ({
        ...(b && b._id ? { _id: b._id } : {}),
        title: b?.title,
      }));
    }

    if (Array.isArray(data.prerequisites)) {
      data.prerequisites = data.prerequisites.map((p: any) => ({
        ...(p && p._id ? { _id: p._id } : {}),
        title: p?.title,
      }));
    }

    if (Array.isArray(data.courseData)) {
      data.courseData = data.courseData.map((section: any) => ({
        ...(section && section._id ? { _id: section._id } : {}),
        sectionTitle: section?.sectionTitle,
        sectionContents: Array.isArray(section?.sectionContents)
          ? section.sectionContents.map((lecture: any) => ({
              ...(lecture && lecture._id ? { _id: lecture._id } : {}),
              videoTitle: lecture?.videoTitle,
              videoDescription: lecture?.videoDescription,
              video: lecture?.video,
              videoLength: lecture?.videoLength,
              videoLinks: Array.isArray(lecture?.videoLinks)
                ? lecture.videoLinks.map((vl: any) => ({
                    ...(vl && vl._id ? { _id: vl._id } : {}),
                    title: vl?.title,
                    url: vl?.url,
                  }))
                : [],
            }))
          : [],
      }));
    }

    if (Array.isArray(data.benefits)) {
      data.benefits = data.benefits.map((b: any) => ({
        ...(b && b._id ? { _id: b._id } : {}),
        title: b?.title,
      }));
    }

    if (Array.isArray(data.prerequisites)) {
      data.prerequisites = data.prerequisites.map((p: any) => ({
        ...(p && p._id ? { _id: p._id } : {}),
        title: p?.title,
      }));
    }

    if (Array.isArray(data.courseData)) {
      data.courseData = data.courseData.map((section: any) => ({
        ...(section && section._id ? { _id: section._id } : {}),
        sectionTitle: section?.sectionTitle,
        sectionContents: Array.isArray(section?.sectionContents)
          ? section.sectionContents.map((lecture: any) => ({
              ...(lecture && lecture._id ? { _id: lecture._id } : {}),
              videoTitle: lecture?.videoTitle,
              videoDescription: lecture?.videoDescription,
              video: lecture?.video,
              videoLength: lecture?.videoLength,
              videoLinks: Array.isArray(lecture?.videoLinks)
                ? lecture.videoLinks.map((vl: any) => ({
                    ...(vl && vl._id ? { _id: vl._id } : {}),
                    title: vl?.title,
                    url: vl?.url,
                  }))
                : [],
            }))
          : [],
      }));
    }

    if (Array.isArray(data.benefits)) {
      data.benefits = data.benefits.map((b: any) => ({
        ...(b && b._id ? { _id: b._id } : {}),
        title: b?.title,
      }));
    }

    if (Array.isArray(data.prerequisites)) {
      data.prerequisites = data.prerequisites.map((p: any) => ({
        ...(p && p._id ? { _id: p._id } : {}),
        title: p?.title,
      }));
    }

    if (Array.isArray(data.courseData)) {
      data.courseData = data.courseData.map((section: any) => ({
        ...(section && section._id ? { _id: section._id } : {}),
        sectionTitle: section?.sectionTitle,
        sectionContents: Array.isArray(section?.sectionContents)
          ? section.sectionContents.map((lecture: any) => ({
              ...(lecture && lecture._id ? { _id: lecture._id } : {}),
              videoTitle: lecture?.videoTitle,
              videoDescription: lecture?.videoDescription,
              video: lecture?.video,
              videoLength: lecture?.videoLength,
              videoLinks: Array.isArray(lecture?.videoLinks)
                ? lecture.videoLinks.map((vl: any) => ({
                    ...(vl && vl._id ? { _id: vl._id } : {}),
                    title: vl?.title,
                    url: vl?.url,
                  }))
                : [],
            }))
          : [],
      }));
    }

    const course = await CourseModel.create(data);

    const populated = await CourseModel.findById(course._id)
      .populate("creatorId", "name avatar email")
      .populate("categories", "title");

    console.log("Course created successfully:", course._id);
    res.status(201).json({
      success: true,
      course: populated ?? course,
    });
  } catch (error: any) {
    console.error("Create course error:", error);
    return next(new ErrorHandler(error.message, 500));
  }
};

/**
 * Lấy danh sách khóa học do một giảng viên (tutor) tạo, có phân trang.
 * - Chỉ dành cho vai trò: tutor (được phép admin đi kèm tại route nếu muốn xem hộ)
 * @param user Thông tin user từ middleware isAuthenticated
 * @param query { page, limit }
 * @param res Express Response
 * @param next Express NextFunction
 * @returns 200 { success, courses, pagination }
 */
export const getTutorCoursesService = async (
  user: any,
  query: any,
  res: Response,
  next: NextFunction
) => {
  try {
    if (user?.role !== "tutor") {
      return next(new ErrorHandler("Forbidden", 403));
    }

    let page = Number.parseInt(String(query?.page), 10);
    if (Number.isNaN(page) || page < 1) page = 1;
    let limit = Number.parseInt(String(query?.limit), 10);
    if (Number.isNaN(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100;
    const skip = (page - 1) * limit;

    const filter: any = { creatorId: user._id };

    const [courses, totalItems] = await Promise.all([
      CourseModel.find(filter)
        .select(
          "_id name description overview categories price estimatedPrice thumbnail tags level ratings purchased createdAt updatedAt creatorId"
        )
        .populate("creatorId", "name avatar email")
        .populate("categories", "title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      CourseModel.countDocuments(filter),
    ]);

    const data = courses.map((c: any) => ({
      ...c.toObject(),
      level: normalizeLevel(c.level),
    }));

    const totalPages = Math.ceil(totalItems / limit) || 0;

    return res.status(200).json({
      success: true,
      paginatedResult: {
        data,
        meta: {
          totalItems,
          totalPages,
          currentPage: page,
          pageSize: limit,
        },
      },
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// List top purchased courses
export const getTopPurchasedCoursesService = async (
  query: any,
  res: Response,
  next: NextFunction
) => {
  try {
    let limit = Number.parseInt(String(query?.limit ?? "10"), 10);
    if (Number.isNaN(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100;

    const courses = await CourseModel.find({})
      .select(
        "_id name description overview categories price estimatedPrice thumbnail tags level ratings purchased createdAt updatedAt creatorId"
      )
      .populate("creatorId", "name avatar email")
      .populate("categories", "title")
      .sort({ purchased: -1, createdAt: -1 })
      .limit(limit);

    const mapped = courses.map((c: any) => ({
      ...c.toObject(),
      level: normalizeLevel(c.level),
      thumbnail: c.thumbnail?.url ? { url: c.thumbnail.url } : c.thumbnail,
      videoDemo: c.videoDemo?.url ? { url: c.videoDemo.url } : c.videoDemo,
    }));

    return res.status(200).json({ success: true, courses: mapped });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// List top rated courses
export const getTopRatedCoursesService = async (
  query: any,
  res: Response,
  next: NextFunction
) => {
  try {
    let limit = Number.parseInt(String(query?.limit ?? "10"), 10);
    if (Number.isNaN(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100;

    const courses = await CourseModel.find({})
      .select(
        "_id name description overview categories price estimatedPrice thumbnail tags level ratings purchased createdAt updatedAt creatorId"
      )
      .populate("creatorId", "name avatar email")
      .populate("categories", "title")
      .sort({ ratings: -1, purchased: -1, createdAt: -1 })
      .limit(limit);

    const mapped = courses.map((c: any) => ({
      ...c.toObject(),
      level: normalizeLevel(c.level),
      thumbnail: c.thumbnail?.url ? { url: c.thumbnail.url } : c.thumbnail,
      videoDemo: c.videoDemo?.url ? { url: c.videoDemo.url } : c.videoDemo,
    }));

    return res.status(200).json({ success: true, courses: mapped });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// Check if user has purchased a course
export const checkUserPurchasedCourseService = async (
  user: any,
  courseId: string,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!user?._id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return next(new ErrorHandler("Invalid course id", 400));
    }

    const enrollment = await EnrolledCourseModel.findOne({
      userId: user._id,
      courseId: new mongoose.Types.ObjectId(courseId),
    }).select("_id");

    const hasPurchased = Boolean(enrollment);
    return res.status(200).json({ success: true, hasPurchased });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

/**
 * Lấy dữ liệu khóa học phục vụ màn hình chỉnh sửa (edit) cho tutor/admin.
 * - Bao gồm: thông tin khóa học và các lecture cần thiết để chỉnh sửa
 * - Loại bỏ: lectureQuestions, reviews
 */
export const getOwnerSingleCourseService = async (
  courseId: string,
  res: Response,
  next: NextFunction
) => {
  try {
    const course = await CourseModel.findById(courseId)
      .populate("creatorId", "name avatar email")
      .populate("categories", "title");

    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }

    const sections = (course as any).courseData.map((section: any) => ({
      _id: section._id,
      sectionTitle: section.sectionTitle,
      sectionContents: (section.sectionContents || []).map((lecture: any) => ({
        _id: lecture._id,
        videoTitle: lecture.videoTitle,
        videoDescription: lecture.videoDescription,
        video: lecture.video,
        videoLength: lecture.videoLength,
        videoLinks: (lecture.videoLinks || []).map((vl: any) => ({
          _id: vl._id,
          title: vl.title,
          url: vl.url,
        })),
      })),
    }));

    const data = {
      _id: (course as any)._id,
      name: (course as any).name,
      description: (course as any).description,
      overview: (course as any).overview,
      categories: (course as any).categories,
      price: (course as any).price,
      estimatedPrice: (course as any).estimatedPrice,
      thumbnail: (course as any).thumbnail,
      tags: (course as any).tags,
      level: (course as any).level,
      videoDemo: (course as any).videoDemo,
      benefits: (course as any).benefits,
      prerequisites: (course as any).prerequisites,
      courseData: sections,
      ratings: (course as any).ratings,
      purchased: (course as any).purchased,
      creatorId: (course as any).creatorId,
      createdAt: (course as any).createdAt,
      updatedAt: (course as any).updatedAt,
    };

    return res.status(200).json({ success: true, course: data });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

/**
 * Lấy danh sách khóa học mà học viên đã ghi danh (enrolled), có phân trang.
 * - Chỉ dành cho vai trò: user (không phải admin)
 * - Tự động loại bỏ enrollment trỏ tới khóa học đã bị xóa
 * @param user Thông tin user từ middleware isAuthenticated
 * @param query { page, limit }
 * @param res Express Response
 * @param next Express NextFunction
 * @returns 200 { success, courses: [{ course, progress, completed, enrolledAt }], pagination }
 */
export const getStudentEnrolledCoursesService = async (
  user: any,
  query: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const pageParam = query?.page;
    const limitParam = query?.limit;
    let page = Number.parseInt(String(pageParam), 10);
    if (Number.isNaN(page) || page < 1) page = 1;
    let limit = Number.parseInt(String(limitParam), 10);
    if (Number.isNaN(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100;
    const skip = (page - 1) * limit;

    if (!user?._id || user?.role === "admin") {
      return next(new ErrorHandler("Forbidden", 403));
    }

    const [enrollments, totalAgg] = await Promise.all([
      EnrolledCourseModel.find({ userId: user._id })
        .select("courseId progress completed enrolledAt")
        .populate({
          path: "courseId",
          select:
            "_id name description overview categories price estimatedPrice thumbnail tags level ratings purchased createdAt updatedAt creatorId",
          populate: [
            { path: "creatorId", select: "name avatar email" },
            { path: "categories", select: "title" },
          ],
        })
        .sort({ enrolledAt: -1 })
        .skip(skip)
        .limit(limit),
      EnrolledCourseModel.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(String(user._id)) } },
        {
          $lookup: {
            from: "courses",
            localField: "courseId",
            foreignField: "_id",
            as: "course",
          },
        },
        { $unwind: "$course" },
        { $count: "count" },
      ]),
    ]);

    const validEnrollments = enrollments.filter((en: any) =>
      Boolean(en.courseId)
    );

    const total =
      Array.isArray(totalAgg) && totalAgg.length > 0 ? totalAgg[0].count : 0;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const courses = validEnrollments.map((en) => {
      const courseDoc = (en as any).courseId as any;
      const courseObj = courseDoc?.toObject ? courseDoc.toObject() : courseDoc;
      if (courseObj) {
        courseObj.level = normalizeLevel(courseObj.level);
      }
      return {
        course: courseObj,
        progress: (en as any).progress ?? 0,
        completed: (en as any).completed ?? false,
        enrolledAt: (en as any).enrolledAt,
      };
    });

    return res.status(200).json({
      success: true,
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: totalPages > 0 && page < totalPages,
        hasPrevPage: totalPages > 0 && page > 1,
      },
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

/**
 * Cập nhật thông tin khóa học theo id.
 * - Chỉ dành cho vai trò: admin, tutor (và phải sở hữu khóa học nếu là tutor)
 * - Hỗ trợ thay đổi thumbnail, cập nhật danh mục, các trường khác
 * @param courseId Id khóa học cần cập nhật
 * @param data Dữ liệu cập nhật
 * @param res Express Response
 * @param next Express NextFunction
 * @returns 201 { success, course } (đã populate creatorId, categories)
 */
export const editCourseService = async (
  courseId: string,
  data: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const findCourse = await CourseModel.findById(courseId);

    if (!findCourse) {
      return next(new ErrorHandler("Course not found", 404));
    }

    const availableCourseThumbnail = findCourse?.thumbnail;

    if (data.thumbnail) {
      if (typeof data.thumbnail === "string") {
        if (
          availableCourseThumbnail?.url &&
          data.thumbnail.startsWith("http") &&
          data.thumbnail === availableCourseThumbnail.url
        ) {
          data.thumbnail = availableCourseThumbnail;
        } else {
          if (availableCourseThumbnail?.public_id) {
            await cloudinary.v2.uploader.destroy(
              availableCourseThumbnail.public_id
            );
          }

          const myCloud = await cloudinary.v2.uploader.upload(data.thumbnail, {
            folder: "courses",
            width: 750,
            height: 422,
            crop: "fill",
          });

          data.thumbnail = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        }
      } else if (typeof data.thumbnail === "object" && data.thumbnail.url) {
        data.thumbnail = availableCourseThumbnail;
      }
    } else {
      data.thumbnail = availableCourseThumbnail;
    }

    if (data.videoDemo) {
      const existingDemo = (findCourse as any).videoDemo as
        | { public_id?: string; url?: string }
        | undefined;
      if (
        typeof data.videoDemo === "object" &&
        data.videoDemo?.public_id &&
        data.videoDemo?.url
      ) {
        if (
          existingDemo?.public_id &&
          existingDemo.public_id !== data.videoDemo.public_id
        ) {
          try {
            await cloudinary.v2.uploader.destroy(existingDemo.public_id, {
              resource_type: "video",
            });
          } catch {}
        }
      } else {
        return next(
          new ErrorHandler(
            "videoDemo must be an object with public_id and url (upload via client with signature)",
            400
          )
        );
      }
    }

    if (data.categories) {
      if (!Array.isArray(data.categories) || data.categories.length === 0) {
        return next(
          new ErrorHandler(
            "categories must be a non-empty array of Category ids",
            400
          )
        );
      }
      const ids: string[] = data.categories;
      if (
        !ids.every(
          (id) => typeof id === "string" && mongoose.Types.ObjectId.isValid(id)
        )
      ) {
        return next(
          new ErrorHandler("One or more category ids are invalid", 400)
        );
      }
      const found = await CategoryModel.find({ _id: { $in: ids } }).select(
        "_id"
      );
      if (found.length !== ids.length) {
        return next(
          new ErrorHandler("One or more categories do not exist", 400)
        );
      }
      data.categories = ids.map((id) => new mongoose.Types.ObjectId(id));
    }

    if (Array.isArray(data.benefits)) {
      data.benefits = data.benefits.map((b: any) => ({
        ...(b && b._id ? { _id: b._id } : {}),
        title: b?.title,
      }));
    }

    if (Array.isArray(data.prerequisites)) {
      data.prerequisites = data.prerequisites.map((p: any) => ({
        ...(p && p._id ? { _id: p._id } : {}),
        title: p?.title,
      }));
    }

    if (Array.isArray(data.courseData)) {
      data.courseData = data.courseData.map((section: any) => ({
        ...(section && section._id ? { _id: section._id } : {}),
        sectionTitle: section?.sectionTitle,
        sectionContents: Array.isArray(section?.sectionContents)
          ? section.sectionContents.map((lecture: any) => ({
              ...(lecture && lecture._id ? { _id: lecture._id } : {}),
              videoTitle: lecture?.videoTitle,
              videoDescription: lecture?.videoDescription,
              video: lecture?.video,
              videoLength: lecture?.videoLength,
              videoLinks: Array.isArray(lecture?.videoLinks)
                ? lecture.videoLinks.map((vl: any) => ({
                    ...(vl && vl._id ? { _id: vl._id } : {}),
                    title: vl?.title,
                    url: vl?.url,
                  }))
                : [],
            }))
          : [],
      }));
    }

    const course = await CourseModel.findByIdAndUpdate(
      courseId,
      { $set: data },
      { new: true }
    );

    if (course) {
      await (course as any).populate("creatorId", "name avatar email");
      await (course as any).populate("categories", "title");
    }

    res.status(201).json({
      success: true,
      course,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

/**
 * Lấy thông tin tổng quan khóa học (không cần mua) theo id.
 * - Dùng để hiển thị overview: mô tả, mục lục (courseData), đánh giá, v.v.
 * - Populate: categories, creatorId, reviews và user trong hỏi đáp
 * @param courseId Id khóa học
 * @param res Express Response
 * @param next Express NextFunction
 * @returns 200 { success, course } theo schema tổng quan đã chuẩn hóa
 */
export const getCourseOverviewService = async (
  courseId: string,
  res: Response,
  next: NextFunction
) => {
  try {
    const course = await CourseModel.findById(courseId)
      .populate("reviews.userId", "name avatar")
      .populate("reviews.replies.userId", "name avatar")
      .populate("categories", "title")
      .populate("creatorId", "name avatar email");

    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }

    const totalSections = course.courseData.length;
    let totalLectures = 0;
    let totalTimeMinutes = 0;

    const sections = course.courseData.map((section: any) => {
      const lectures = section.sectionContents.map((lecture: any) => ({
        _id: lecture._id,
        videoTitle: lecture.videoTitle,
        videoDescription: lecture.videoDescription,
        videoLength: lecture.videoLength,
      }));

      const sectionTotalLectures = lectures.length;
      const sectionTotalTime = lectures.reduce(
        (acc: number, curr: any) => acc + (curr.videoLength || 0),
        0
      );

      totalLectures += sectionTotalLectures;
      totalTimeMinutes += sectionTotalTime;

      return {
        _id: section._id,
        sectionTitle: section.sectionTitle,
        sectionContents: lectures,
      };
    });

    const formatTime = (minutes: number) => {
      if (minutes < 60) {
        return `${minutes}m`;
      }
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
    };

    const courseData = {
      _id: course._id,
      name: course.name,
      description: course.description,
      overview: (course as any).overview,
      categories: course.categories,
      price: course.price,
      estimatedPrice: course.estimatedPrice,
      thumbnail: { url: (course as any).thumbnail?.url },
      tags: course.tags,
      level: normalizeLevel((course as any).level),
      videoDemo: { url: (course as any).videoDemo?.url },
      benefits: course.benefits,
      prerequisites: course.prerequisites,
      totalSections,
      totalLectures,
      totalTime: formatTime(totalTimeMinutes),
      reviews: course.reviews.map((review: any) => ({
        _id: review._id,
        userId: {
          _id: review.userId._id,
          name: review.userId.name,
          avatar: review.userId.avatar,
        },
        rating: review.rating,
        comment: review.comment,
        replies: review.replies.map((reply: any) => ({
          _id: reply._id,
          userId: {
            _id: reply.userId._id,
            name: reply.userId.name,
            avatar: reply.userId.avatar,
          },
          answer: reply.answer,
          createdAt: reply.createdAt,
          updatedAt: reply.updatedAt,
        })),
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      })),
      courseData: sections,
      ratings: course.ratings,
      purchased: course.purchased,
      creatorId: course.creatorId,
      createdAt: (course as any).createdAt,
      updatedAt: (course as any).updatedAt,
    };

    res.status(200).json({
      success: true,
      course: courseData,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

/**
 * Lấy toàn bộ nội dung chi tiết của khóa học cho người đủ điều kiện truy cập.
 * - Điều kiện: đã mua/ghi danh, là creator hoặc admin
 * - Populate đầy đủ dữ liệu để học (Q&A, reviews, creator, categories)
 * @param courseId Id khóa học
 * @param userId Thông tin user từ middleware isAuthenticated
 * @param res Express Response
 * @param next Express NextFunction
 * @returns 200 { success, course }
 */
export const enrollCourseService = async (
  courseId: string,
  userId: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const [enrollment, courseDoc] = await Promise.all([
      EnrolledCourseModel.findOne({ userId: userId?._id, courseId }),
      CourseModel.findById(courseId).select("creatorId"),
    ]);

    const isEnrolled = Boolean(enrollment);
    const isCreator =
      courseDoc &&
      courseDoc.creatorId &&
      courseDoc.creatorId.toString() === String(userId?._id);

    if (!isEnrolled && !isCreator && userId?.role !== "admin") {
      return next(
        new ErrorHandler("You are not eligible to access this course", 403)
      );
    }

    const course = await CourseModel.findById(courseId)
      .populate(
        "courseData.sectionContents.lectureQuestions.userId",
        "name avatar"
      )
      .populate(
        "courseData.sectionContents.lectureQuestions.replies.userId",
        "name avatar"
      )
      .populate("reviews.userId", "name avatar")
      .populate("reviews.replies.userId", "name avatar")
      .populate("creatorId", "name avatar email")
      .populate("categories", "title");

    const userEnrollment = await EnrolledCourseModel.findOne({
      userId: userId?._id,
      courseId,
    }).select("completedLectures");

    const levelRaw = String((course as any)?.level || "").toLowerCase();
    const levelEnumValue =
      levelRaw === ECourseLevel.Beginner.toLowerCase()
        ? ECourseLevel.Beginner
        : levelRaw === ECourseLevel.Intermediate.toLowerCase()
        ? ECourseLevel.Intermediate
        : levelRaw === ECourseLevel.Advanced.toLowerCase()
        ? ECourseLevel.Advanced
        : levelRaw === ECourseLevel.Professional.toLowerCase()
        ? ECourseLevel.Professional
        : null;

    if (course) {
      (course as any).level = levelEnumValue;
    }

    const shouldSanitize = !isCreator && userId?.role !== "admin";
    let payloadCourse: any = course;
    if (shouldSanitize && course) {
      const courseObj = (course as any).toObject();
      if (courseObj.thumbnail) {
        courseObj.thumbnail = { url: courseObj.thumbnail?.url };
      }
      if (courseObj.videoDemo) {
        courseObj.videoDemo = { url: courseObj.videoDemo?.url };
      }
      if (courseObj.creatorId?.avatar) {
        courseObj.creatorId.avatar = { url: courseObj.creatorId.avatar?.url };
      }
      if (Array.isArray(courseObj.courseData)) {
        courseObj.courseData = courseObj.courseData.map((section: any) => ({
          ...section,
          sectionContents: Array.isArray(section.sectionContents)
            ? section.sectionContents.map((lecture: any) => ({
                ...lecture,
                video: lecture?.video
                  ? { url: lecture.video?.url }
                  : lecture?.video,
              }))
            : [],
        }));
      }
      payloadCourse = courseObj;
    }

    res.status(200).json({
      success: true,
      course: payloadCourse,
      completedLectures: userEnrollment?.completedLectures || [],
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

/**
 * Tìm kiếm khóa học theo nhiều tiêu chí: từ khóa, categories, level, price, sort.
 * - Không cần đăng nhập
 * - Kết quả đã populate categories, creatorId (thông tin cơ bản)
 * @param query { query, category, level, priceMin, priceMax, sort }
 * @param res Express Response
 * @param next Express NextFunction
 * @returns 200 { success, courses }
 */
export const searchCoursesService = async (
  query: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category, level, priceMin, priceMax, sort } = query;
    const searchQuery = (query as any)?.query ?? (query as any)?.keyword;

    const filter: any = {};

    if (typeof searchQuery !== "undefined") {
      const keyword = String(searchQuery ?? "").trim();

      if (keyword.length >= 2) {
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regexPattern = new RegExp(escaped, "i");

        const searchConditions: any[] = [
          { name: { $regex: regexPattern } },
          { tags: { $regex: regexPattern } },
        ];

        const matchingCategories = await CategoryModel.find({
          title: { $regex: regexPattern },
        }).select("_id");

        if (matchingCategories.length > 0) {
          const categoryIds = matchingCategories.map((cat) => cat._id);
          searchConditions.push({ categories: { $in: categoryIds } });
        }

        if (mongoose.Types.ObjectId.isValid(keyword)) {
          searchConditions.push({ _id: keyword });
        }

        filter.$or = searchConditions;
      } else if (keyword.length > 0 && keyword.length < 2) {
        return res.status(200).json({
          success: true,
          courses: [],
          message: "Keyword must be at least 2 characters long",
        });
      }
    }

    if (category) {
      const keyword = Array.isArray(category)
        ? category.join(",")
        : String(category);
      const ids = keyword
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const areValid = ids.every((id) => mongoose.Types.ObjectId.isValid(id));
      if (!areValid) {
        return next(new ErrorHandler("Invalid category id in filter", 400));
      }
      filter.categories = { $in: ids };
    }

    if (level) {
      const lv = String(level).trim();
      if (lv.length > 0 && lv.toLowerCase() !== "all levels") {
        const escapedLv = lv.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        filter.level = new RegExp(`^${escapedLv}$`, "i");
      }
    }

    if (priceMin || priceMax) {
      filter.price = {};
      if (priceMin) filter.price.$gte = Number(priceMin);
      if (priceMax) filter.price.$lte = Number(priceMax);
    }

    let sortOption = {};
    if (sort) {
      switch (sort) {
        case "price_asc":
          sortOption = { price: 1 };
          break;
        case "price_desc":
          sortOption = { price: -1 };
          break;
        case "newest":
          sortOption = { createdAt: -1 };
          break;
        case "oldest":
          sortOption = { createdAt: 1 };
          break;
        case "popular":
          sortOption = { purchased: -1 };
          break;
        case "rating":
          sortOption = { ratings: -1 };
          break;
        default:
          sortOption = { createdAt: -1 };
      }
    } else {
      sortOption = { createdAt: -1 };
    }

    const courses = await CourseModel.find(filter)
      .select(
        "_id name description overview categories price estimatedPrice thumbnail tags level videoDemo ratings purchased createdAt"
      )
      .populate("creatorId", "name avatar email")
      .populate("categories", "title")
      .sort(sortOption);

    const mapped = courses.map((c: any) => {
      const obj = c.toObject();
      if (obj.thumbnail) obj.thumbnail = { url: obj.thumbnail?.url };
      if (obj.videoDemo) obj.videoDemo = { url: obj.videoDemo?.url };
      if (obj.creatorId?.avatar) {
        obj.creatorId.avatar = { url: obj.creatorId.avatar?.url };
      }
      obj.level = normalizeLevel(obj.level);
      return obj;
    });

    res.status(200).json({
      success: true,
      courses: mapped,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

/**
 * Thêm câu hỏi vào một bài giảng trong khóa học.
 * - Điều kiện: đã ghi danh, là creator hoặc admin
 * @param questionData { question, courseId, contentId }
 * @param userId Thông tin user từ middleware isAuthenticated
 * @param res Express Response
 * @param next Express NextFunction
 * @returns 200 { success, message }
 */
export const addQuestionService = async (
  questionData: any,
  userId: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { question, courseId, contentId } = questionData;
    const course = await CourseModel.findById(courseId);

    if (!course) return next(new ErrorHandler("Course not found", 404));

    const enrollmentForQuestion = await EnrolledCourseModel.findOne({
      userId: userId?._id,
      courseId,
    });
    const isEnrolled = Boolean(enrollmentForQuestion);
    const isCreator =
      course?.creatorId && course.creatorId.toString() === String(userId?._id);

    if (!isEnrolled && !isCreator && userId?.role !== "admin") {
      return next(
        new ErrorHandler(
          "You must be enrolled in this course to ask questions",
          403
        )
      );
    }

    const section = course?.courseData.find((sec: any) =>
      sec.sectionContents.some((cont: any) => cont._id.equals(contentId))
    );

    const content = section?.sectionContents.find((cont: any) =>
      cont._id.equals(contentId)
    );

    if (!content) return next(new ErrorHandler("Content not found", 404));

    const newQuestion: any = {
      userId: userId?._id,
      question,
      replies: [],
    };

    content.lectureQuestions.push(newQuestion);

    await NotificationModel.create({
      userId: userId?._id,
      title: "New Question",
      message: `You have a new question in section: ${section?.sectionTitle}`,
    });

    await course?.save();

    res.status(200).json({
      success: true,
      message: "Ask question successfully",
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

/**
 * Thêm câu trả lời cho một câu hỏi trong bài giảng.
 * - Điều kiện: đã ghi danh, là creator hoặc admin
 * @param answerData { answer, courseId, contentId, questionId }
 * @param userId Thông tin user từ middleware isAuthenticated
 * @param res Express Response
 * @param next Express NextFunction
 * @returns 200 { success, message }
 */
export const addAnswerService = async (
  answerData: any,
  userId: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { answer, courseId, contentId, questionId } = answerData;
    const course = await CourseModel.findById(courseId);

    if (!course) return next(new ErrorHandler("Course not found", 404));

    const enrollmentForAnswer = await EnrolledCourseModel.findOne({
      userId: userId?._id,
      courseId,
    });
    const isEnrolled = Boolean(enrollmentForAnswer);
    const isCreator =
      course?.creatorId && course.creatorId.toString() === String(userId?._id);

    if (!isEnrolled && !isCreator && userId?.role !== "admin") {
      return next(
        new ErrorHandler(
          "You must be enrolled in this course to answer questions",
          403
        )
      );
    }

    const section = course?.courseData.find((sec: any) =>
      sec.sectionContents.some((cont: any) => cont._id.equals(contentId))
    );

    const content = section?.sectionContents.find((cont: any) =>
      cont._id.equals(contentId)
    );

    if (!content) return next(new ErrorHandler("Content not found", 404));

    const question = content?.lectureQuestions.find((q: any) =>
      q._id.equals(questionId)
    );

    if (!question) return next(new ErrorHandler("Question not found", 404));

    const askedUser = await userModel.findById(question.userId);

    if (!askedUser || !askedUser.email) {
      return next(new ErrorHandler("User email not found", 404));
    }

    const reply: any = {
      userId: userId?._id,
      answer,
    };

    question.replies?.push(reply);

    await course?.save();

    const data = {
      name: askedUser.name,
      title: section?.sectionTitle,
    };

    const html = await ejs.renderFile(
      path.join(__dirname, "../mails/question-reply.ejs"),
      data
    );

    try {
      await sendMail({
        email: askedUser.email,
        subject: "Question Reply",
        template: "question-reply.ejs",
        data,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }

    res.status(200).json({
      success: true,
      message: "Reply question successfully",
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

/**
 * Thêm đánh giá (review) cho khóa học.
 * - Điều kiện: đã ghi danh, là creator hoặc admin
 * - Tự động cập nhật điểm trung bình ratings
 * @param courseId Id khóa học
 * @param reviewData { review, rating }
 * @param userId Thông tin user từ middleware isAuthenticated
 * @param res Express Response
 * @param next Express NextFunction
 * @returns 200 { success, course }
 */
export const addReviewService = async (
  courseId: string,
  reviewData: any,
  userId: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { review, rating } = reviewData;
    const [enrollmentForReview, course] = await Promise.all([
      EnrolledCourseModel.findOne({ userId: userId?._id, courseId }),
      CourseModel.findById(courseId),
    ]);
    const isEnrolled = Boolean(enrollmentForReview);
    const isCreator =
      course?.creatorId && course.creatorId.toString() === String(userId?._id);

    if (!isEnrolled && !isCreator && userId?.role !== "admin") {
      return next(
        new ErrorHandler("You are not eligible to review this course", 403)
      );
    }

    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }

    const reviewDataObj: any = {
      userId: userId?._id,
      rating,
      comment: review,
      replies: [],
    };

    course?.reviews.push(reviewDataObj);

    let avg = 0;
    course?.reviews.forEach((rev: any) => {
      avg += rev.rating;
    });
    if (course) {
      course.ratings = avg / course.reviews.length;
    }

    await course?.save();

    await NotificationModel.create({
      userId: userId?._id,
      title: "New Review Received",
      message: `${userId?.name} has given a review in ${course?.name}`,
    });

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

/**
 * Thêm phản hồi (reply) cho một review của khóa học.
 * - Điều kiện: đã ghi danh, là creator hoặc admin
 * @param replyData { comment, courseId, reviewId }
 * @param userId Thông tin user từ middleware isAuthenticated
 * @param res Express Response
 * @param next Express NextFunction
 * @returns 200 { success, course }
 */
export const addReplyToReviewService = async (
  replyData: any,
  userId: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { comment, courseId, reviewId } = replyData;

    const course = await CourseModel.findById(courseId);

    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }

    const enrollmentForReviewReply = await EnrolledCourseModel.findOne({
      userId: userId?._id,
      courseId,
    });
    const isEnrolled = Boolean(enrollmentForReviewReply);
    const isCreator =
      course?.creatorId && course.creatorId.toString() === String(userId?._id);

    if (!isEnrolled && !isCreator && userId?.role !== "admin") {
      return next(
        new ErrorHandler(
          "You must be enrolled in this course to reply to reviews",
          403
        )
      );
    }

    const review = course?.reviews?.find(
      (rev: any) => rev._id.toString() === reviewId
    );

    if (!review) {
      return next(new ErrorHandler("Review of the course not found", 404));
    }

    const replyDataObj: any = {
      userId: userId?._id,
      answer: comment,
    };

    review.replies?.push(replyDataObj);

    await course?.save();

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

/**
 * Xóa khóa học theo id.
 * - Chỉ dành cho vai trò: admin, tutor (và phải sở hữu nếu là tutor)
 * @param courseId Id khóa học
 * @param res Express Response
 * @param next Express NextFunction
 * @returns 200 { success, message }
 */
export const deleteCourseService = async (
  courseId: string,
  res: Response,
  next: NextFunction
) => {
  try {
    const course = await CourseModel.findById(courseId);

    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }

    await CourseModel.findByIdAndDelete(courseId);

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

/**
 * Lấy danh sách tất cả khóa học cho Admin, có phân trang.
 * - Chỉ dành cho vai trò: admin
 * - Populate reviews.userId, creatorId, categories
 * @param query { page, limit }
 * @param res Express Response
 * @returns 200 { success, courses, pagination }
 */
export const getAdminCoursesService = async (query: any, res: Response) => {
  let page = Number.parseInt(String(query?.page), 10);
  if (Number.isNaN(page) || page < 1) page = 1;
  let limit = Number.parseInt(String(query?.limit), 10);
  if (Number.isNaN(limit) || limit < 1) limit = 10;
  if (limit > 100) limit = 100;
  const skip = (page - 1) * limit;

  const keyword =
    typeof query?.keyword !== "undefined" ? String(query.keyword).trim() : "";
  const filter: any = {};
  if (keyword.length >= 2) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    filter.$or = [{ name: { $regex: regex } }, { tags: { $regex: regex } }];
  }

  const [courses, totalItems] = await Promise.all([
    CourseModel.find(filter)
      .populate("reviews.userId", "name avatar")
      .populate("creatorId", "name avatar email")
      .populate("categories", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    CourseModel.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalItems / limit) || 0;

  res.status(200).json({
    success: true,
    paginatedResult: {
      data: courses,
      meta: {
        totalItems,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
    },
  });
};

/**
 * Lấy danh sách học viên đã ghi danh vào một khóa học (chỉ dành cho admin/tutor sở hữu).
 * @param courseId Id khóa học
 * @param res Express Response
 * @param next Express NextFunction
 * @returns 200 { success, students }
 */
export const getCourseStudentsService = async (
  courseId: string,
  res: Response,
  next: NextFunction
) => {
  try {
    const query: any = (res as any).locals?.query || {};
    let page = Number.parseInt(String(query?.page), 10);
    if (Number.isNaN(page) || page < 1) page = 1;
    let limit = Number.parseInt(String(query?.limit), 10);
    if (Number.isNaN(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100;
    const skip = (page - 1) * limit;

    const keyword =
      typeof query?.keyword !== "undefined" ? String(query.keyword).trim() : "";

    const matchStage: any = { courseId: new mongoose.Types.ObjectId(courseId) };

    const pipeline: any[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
    ];

    if (keyword && keyword.length >= 2) {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      pipeline.push({
        $match: {
          $or: [
            { "user.name": { $regex: regex } },
            { "user.email": { $regex: regex } },
          ],
        },
      });
    }

    const countPipeline = [...pipeline, { $count: "count" }];
    const dataPipeline = [
      ...pipeline,
      { $sort: { enrolledAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          userId: {
            _id: "$user._id",
            name: "$user.name",
            email: "$user.email",
            avatar: "$user.avatar",
          },
          progress: 1,
          completed: 1,
          enrolledAt: 1,
        },
      },
    ];

    const [data, countRes] = await Promise.all([
      EnrolledCourseModel.aggregate(dataPipeline),
      EnrolledCourseModel.aggregate(countPipeline),
    ]);

    const totalItems =
      Array.isArray(countRes) && countRes.length > 0 ? countRes[0].count : 0;
    const totalPages = Math.ceil(totalItems / limit) || 0;

    res.status(200).json({
      success: true,
      paginatedResult: {
        data,
        meta: {
          totalItems,
          totalPages,
          currentPage: page,
          pageSize: limit,
        },
      },
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

/**
 * Lấy danh sách tất cả category (phục vụ filter trên client).
 * @param res Express Response
 * @param next Express NextFunction
 * @returns 200 { success, categories: [{ _id, title }] }
 */
export const getAllCategoriesService = async (
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await CategoryModel.find()
      .sort({ createdAt: -1 })
      .select("_id title");
    res.status(200).json({ success: true, categories });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

/**
 * Lấy danh sách tất cả level (distinct theo trường level của Course).
 * @param res Express Response
 * @param next Express NextFunction
 * @returns 200 { success, levels: string[] }
 */
export const getAllLevelsService = async (
  res: Response,
  next: NextFunction
) => {
  try {
    const levels = Object.values(ECourseLevel);
    res.status(200).json({ success: true, levels });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

/**
 * Sinh chữ ký upload video lên Cloudinary (client-side upload).
 * - Chỉ dành cho admin, tutor (được bảo vệ tại route)
 * @param res Express Response
 * @returns 200 { success, cloudName, apiKey, timestamp, folder, signature }
 */
export const generateUploadSignatureService = async (res: Response) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = process.env.CLOUDINARY_FOLDER || "videos_lms";

  const cloudName = process.env.CLOUD_NAME as string;
  const apiKey = process.env.CLOUD_API_KEY as string;
  const apiSecret = process.env.CLOUD_SECRET_KEY as string;

  const paramsToSign: Record<string, any> = {
    folder,
    timestamp,
  };

  const signature = cloudinary.v2.utils.api_sign_request(
    paramsToSign,
    apiSecret
  );

  res.status(200).json({
    success: true,
    cloudName,
    apiKey,
    timestamp,
    folder,
    signature,
  });
};

/**
 * Cập nhật video cho một bài giảng cụ thể trong khóa học.
 * - Chỉ dành cho admin hoặc tutor là chủ sở hữu khóa học (route đã checkOwnership, ở đây double-check)
 * @param user Thông tin user
 * @param data { courseId, lectureId, video: { public_id, url }, videoLength? }
 * @returns 200 { success, lecture }
 */
export const updateLectureVideoService = async (
  user: any,
  data: {
    courseId: string;
    lectureId: string;
    video: { public_id: string; url: string };
    videoLength?: number;
  },
  res: Response,
  next: NextFunction
) => {
  try {
    const { courseId, lectureId, video, videoLength } = data || ({} as any);

    if (
      !courseId ||
      !lectureId ||
      !video ||
      !video.public_id ||
      !video.url ||
      !mongoose.Types.ObjectId.isValid(courseId) ||
      !mongoose.Types.ObjectId.isValid(lectureId)
    ) {
      return next(
        new ErrorHandler(
          "Invalid payload: require valid courseId, lectureId and video { public_id, url }",
          400
        )
      );
    }

    const course = await CourseModel.findById(courseId).select(
      "creatorId courseData.sectionContents._id courseData.sectionContents.video courseData.sectionContents.videoLength"
    );

    if (!course) return next(new ErrorHandler("Course not found", 404));

    const isOwner =
      course.creatorId && course.creatorId.toString() === String(user?._id);
    if (user?.role !== "admin" && !isOwner) {
      return next(new ErrorHandler("Forbidden", 403));
    }

    let targetLecture: any | null = null;
    for (const section of (course as any).courseData || []) {
      const found = (section.sectionContents || []).find(
        (lec: any) => lec._id && lec._id.equals(lectureId)
      );
      if (found) {
        targetLecture = found;
        break;
      }
    }

    if (!targetLecture) {
      return next(new ErrorHandler("Lecture not found", 404));
    }

    const prevVid = targetLecture.video as
      | { public_id?: string; url?: string }
      | undefined;
    if (prevVid?.public_id && prevVid.public_id !== video.public_id) {
      try {
        await cloudinary.v2.uploader.destroy(prevVid.public_id, {
          resource_type: "video",
        });
      } catch (e) {}
    }

    targetLecture.video = { public_id: video.public_id, url: video.url };
    if (typeof videoLength === "number") {
      targetLecture.videoLength = videoLength;
    }

    await course.save();

    res.status(200).json({ success: true, lecture: targetLecture });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

/**
 * Đánh dấu hoàn thành một bài giảng trong khóa học của học viên.
 * - Tính toán và cập nhật progress (%) và trạng thái completed của khóa học
 * - Admin có thể upsert record để demo/kiểm thử
 * @param user Thông tin user
 * @param data { courseId, lectureId }
 * @param res Express Response
 * @param next Express NextFunction
 * @returns 200 { success, progress, completed, completedLectures, totalLectures }
 */
export const markLectureCompletedService = async (
  user: any,
  data: { courseId: string; lectureId: string },
  res: Response,
  next: NextFunction
) => {
  try {
    const { courseId, lectureId } = data;

    if (
      !mongoose.Types.ObjectId.isValid(courseId) ||
      !mongoose.Types.ObjectId.isValid(lectureId)
    ) {
      return next(new ErrorHandler("Invalid courseId or lectureId", 400));
    }

    const [isEnrolledByUserDoc, course] = await Promise.all([
      EnrolledCourseModel.findOne({
        userId: user?._id,
        courseId,
      }),
      CourseModel.findById(courseId).select(
        "courseData.sectionContents._id creatorId"
      ),
    ]);

    if (!course) return next(new ErrorHandler("Course not found", 404));

    const isEnrolled = Boolean(isEnrolledByUserDoc);
    const isCreator =
      course.creatorId && course.creatorId.toString() === String(user?._id);

    if (!isEnrolled && !isCreator && user?.role !== "admin") {
      return next(new ErrorHandler("You are not enrolled in this course", 403));
    }

    const totalLectures = (course.courseData || []).reduce(
      (acc: number, section: any) => {
        return (
          acc + (section.sectionContents ? section.sectionContents.length : 0)
        );
      },
      0
    );

    if (totalLectures === 0) {
      return next(new ErrorHandler("Course has no lectures", 400));
    }

    const updated = await EnrolledCourseModel.findOneAndUpdate(
      { userId: user?._id, courseId },
      {
        $addToSet: {
          completedLectures: new mongoose.Types.ObjectId(lectureId),
        },
      },
      { new: true, upsert: user?.role === "admin" || isCreator ? true : false }
    );

    if (!updated) {
      return next(new ErrorHandler("Enrollment record not found", 404));
    }

    const completedCount = (updated.completedLectures || []).length;
    const progress = Math.min(
      100,
      Math.round((completedCount / totalLectures) * 100)
    );
    const completed = progress >= 100;

    if (progress !== updated.progress || completed !== updated.completed) {
      updated.progress = progress;
      updated.completed = completed;
      await updated.save();
    }

    res.status(200).json({
      success: true,
      progress,
      completed,
      completedLectures: updated.completedLectures,
      totalLectures,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

export const getStudentDetailsInCourseService = async (
  courseId: string,
  studentId: string,
  tutorId: string
) => {
  // --- Bước 1: Xây dựng Aggregation Pipeline ---
  const pipeline = [
    // Giai đoạn 1: Lọc chính xác bản ghi đăng ký cần tìm
    {
      $match: {
        courseId: new mongoose.Types.ObjectId(courseId),
        userId: new mongoose.Types.ObjectId(studentId),
      },
    },

    // Giai đoạn 2: JOIN với collection 'courses' ĐỂ XÁC THỰC QUYỀN 🛡️
    // Đây là bước "thần kỳ", nó sẽ chỉ trả về kết quả nếu tutorId là người tạo khóa học
    {
      $lookup: {
        from: "courses", // Tên collection của CourseModel
        let: { cId: "$courseId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$_id", "$$cId"] },
                  { $eq: ["$creatorId", new mongoose.Types.ObjectId(tutorId)] },
                ],
              },
            },
          },
          { $project: { courseData: 1 } }, // Chỉ lấy trường cần thiết để tính toán
        ],
        as: "courseDetails",
      },
    },

    // Giai đoạn 3: "Mở" mảng courseDetails và lọc bỏ nếu không có quyền
    // Nếu lookup ở trên không tìm thấy (do sai tutorId), $unwind sẽ loại bỏ bản ghi này
    {
      $unwind: "$courseDetails",
    },

    // Giai đoạn 4: JOIN với collection 'users' để lấy thông tin học viên
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "studentInfo",
      },
    },

    // Giai đoạn 5: Mở mảng thông tin học viên
    {
      $unwind: "$studentInfo",
    },

    // Giai đoạn 6: Định dạng lại toàn bộ kết quả đầu ra 🚀
    {
      $project: {
        _id: "$studentInfo._id", // Lấy ID của học viên
        name: "$studentInfo.name",
        email: "$studentInfo.email",
        avatar: {
          url: { $ifNull: ["$studentInfo.avatar.url", ""] }, // Xử lý nếu avatar null
        },
        enrollmentDetails: {
          _id: "$_id", // ID của bản ghi enrollment
          enrolledAt: "$enrolledAt",
          progress: "$progress",
          // Đếm số bài giảng đã hoàn thành
          completedLectures: { $size: "$completedLectures" },
          // Tính tổng số bài giảng trong khóa học
          totalLecturesInCourse: {
            $sum: {
              $map: {
                input: "$courseDetails.courseData",
                as: "section",
                in: { $size: "$$section.sectionContents" },
              },
            },
          },
          isCompleted: "$completed",
        },
      },
    },
  ];

  // --- Bước 2: Thực thi pipeline ---
  const result = await EnrolledCourseModel.aggregate(pipeline);

  // --- Bước 3: Kiểm tra kết quả ---
  // Nếu mảng rỗng, nghĩa là không tìm thấy hoặc không có quyền
  if (result.length === 0) {
    throw new ErrorHandler(
      "Student not found in this course or access denied",
      404
    );
  }

  // Trả về phần tử duy nhất trong mảng kết quả
  return result[0];
};
