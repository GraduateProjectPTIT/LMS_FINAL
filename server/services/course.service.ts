import { Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import CourseModel from "../models/course.model";
import CategoryModel from "../models/category.model";
import cloudinary from "cloudinary";
import mongoose from "mongoose";
import type { PipelineStage } from "mongoose";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notification.model";
import userModel from "../models/user.model";
import EnrolledCourseModel from "../models/enrolledCourse.model";
import { ECourseLevel } from "../constants/course-level.enum";
import { getInclusiveDateRange } from "../utils/date.helpers";
import { normalizeLevel } from "../utils/course.helpers";
import CartModel from "../models/cart.model";
import { redis } from "../utils/redis";

import { makeCaseInsensitiveRegex } from "../utils/search.utils";
import { parsePaging, buildSort } from "../utils/paging.utils";
import {
  parseCourseLevel,
  normalizeTitleArray,
  normalizeCourseSections,
  assertSectionVideosHavePublicIdUrl,
  validateAndMaterializeCategoryIds,
  summarizeCourseData,
  sanitizeCourseMedia,
} from "../utils/course.utils";
import { upsertCourseThumbnail } from "../utils/media.utils";
import { countTotalLectures, recomputeEnrollmentsProgressForCourse } from "../utils/enrollment.utils";

import ErrorHandler from "../utils/ErrorHandler";
import { createAndSendNotification } from "./notification.service";
const isAdmin = (u: any) => String(u?.role) === "admin";
const isOwner = (course: any, u: any) =>
  course?.creatorId && String(course.creatorId) === String(u?._id);

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
    try {
      data.level = parseCourseLevel(data.level);
    } catch {
      return next(new ErrorHandler("Invalid course level", 400));
    }

    if (!data.videoDemo || !data.videoDemo.public_id || !data.videoDemo.url) {
      return next(
        new ErrorHandler(
          "videoDemo is required and must include public_id and url (upload via client with signature)",
          400
        )
      );
    }

    try {
      assertSectionVideosHavePublicIdUrl(data.courseData);
    } catch (e: any) {
      return next(
        new ErrorHandler(
          e?.message || "Invalid courseData videos",
          e?.statusCode || 400
        )
      );
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
      try {
        data.level = parseCourseLevel(data.level);
      } catch {
        return next(new ErrorHandler("Invalid course level", 400));
      }
    }

    if (data.categories) {
      try {
        data.categories = await validateAndMaterializeCategoryIds(
          data.categories
        );
      } catch (e: any) {
        return next(
          new ErrorHandler(
            e?.message || "Invalid categories",
            e?.statusCode || 400
          )
        );
      }
    }

    data.benefits = normalizeTitleArray(data.benefits);
    data.prerequisites = normalizeTitleArray(data.prerequisites);
    data.courseData = normalizeCourseSections(data.courseData);

    data.benefits = normalizeTitleArray(data.benefits);
    data.prerequisites = normalizeTitleArray(data.prerequisites);

    data.courseData = normalizeCourseSections(data.courseData);

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

// Get latest reviews across all courses
export const getLatestReviewsService = async (
  query: any,
  res: Response,
  next: NextFunction
) => {
  try {
    let limit = parseInt(String(query?.limit ?? "20"), 10);
    if (Number.isNaN(limit) || limit < 1) limit = 20;
    if (limit > 50) limit = 50;

    const cacheKey = `course:latestReviews:${limit}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const reviews = JSON.parse(cached);
        return res.status(200).json({ success: true, reviews, cached: true });
      }
    } catch {}

    const pipeline: any[] = [
      { $match: { status: "published" } },
      { $unwind: "$reviews" },
      { $sort: { "reviews.createdAt": -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "reviews.userId",
          foreignField: "_id",
          as: "reviewUser",
        },
      },
      { $unwind: { path: "$reviewUser", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          course: {
            _id: "$_id",
            name: "$name",
            thumbnail: "$thumbnail",
          },
          review: {
            _id: "$reviews._id",
            rating: "$reviews.rating",
            comment: "$reviews.comment",
            createdAt: "$reviews.createdAt",
            repliesCount: { $size: { $ifNull: ["$reviews.replies", []] } },
          },
          user: {
            _id: "$reviewUser._id",
            name: "$reviewUser.name",
            email: "$reviewUser.email",
            avatar: "$reviewUser.avatar",
          },
        },
      },
    ];

    const reviews = await (CourseModel as any).aggregate(pipeline);

    try {
      await redis.set(cacheKey, JSON.stringify(reviews), "EX", 60);
    } catch {}

    return res.status(200).json({ success: true, reviews });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// Get related courses by categories or a base courseId
export const getRelatedCoursesService = async (
  query: any,
  res: Response,
  next: NextFunction
) => {
  try {
    let limit = parseInt(String(query?.limit ?? "10"), 10);
    if (Number.isNaN(limit) || limit < 1) limit = 10;
    if (limit > 50) limit = 50;

    const courseIdRaw =
      typeof query?.courseId !== "undefined"
        ? String(query.courseId).trim()
        : "";

    let categoryIds: string[] = [];
    if (typeof query?.categoryIds !== "undefined") {
      if (Array.isArray(query.categoryIds)) {
        categoryIds = query.categoryIds as string[];
      } else if (typeof query.categoryIds === "string") {
        categoryIds = String(query.categoryIds)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    let excludeId: mongoose.Types.ObjectId | null = null;
    if (courseIdRaw && mongoose.Types.ObjectId.isValid(courseIdRaw)) {
      excludeId = new mongoose.Types.ObjectId(courseIdRaw);
      if (categoryIds.length === 0) {
        const baseCourse = await CourseModel.findById(excludeId).select(
          "categories"
        );
        if (!baseCourse) {
          return next(new ErrorHandler("Base course not found", 404));
        }
        categoryIds = (baseCourse.categories || []).map((id: any) =>
          String(id)
        );
      }
    }

    const validCategoryIds = categoryIds
      .map((id) => String(id))
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const filter: any = { status: "published" };
    if (validCategoryIds.length > 0) {
      filter.categories = { $in: validCategoryIds };
    }
    if (excludeId) {
      filter._id = { ...(filter._id || {}), $ne: excludeId };
    }

    if (!filter.categories) {
      const baseFilter: any = { status: "published" };
      if (excludeId) {
        baseFilter._id = { $ne: excludeId };
      }
      const fallback = await CourseModel.find(baseFilter)
        .select(
          "name price estimatedPrice thumbnail purchased courseData.sectionContents.videoLength"
        )
        .sort({ purchased: -1, ratings: -1, createdAt: -1 })
        .limit(limit)
        .lean();

      const related = fallback.map((c: any) => {
        const sum = summarizeCourseData((c as any).courseData);
        return {
          _id: c._id,
          thumbnail: { url: c.thumbnail?.url },
          name: c.name,
          price: c.price,
          estimatedPrice: c.estimatedPrice,
          enrolledCounts: c.purchased,
          totalLectures: sum.totalLectures,
          totalDuration: sum.totalDuration,
        };
      });
      return res.status(200).json({ success: true, courses: related });
    }

    const courses = await CourseModel.find(filter)
      .select(
        "name price estimatedPrice thumbnail purchased courseData.sectionContents.videoLength"
      )
      .sort({ purchased: -1, ratings: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    const related = courses.map((c: any) => {
      const sum = summarizeCourseData((c as any).courseData);
      return {
        _id: c._id,
        thumbnail: { url: c.thumbnail?.url },
        name: c.name,
        price: c.price,
        estimatedPrice: c.estimatedPrice,
        enrolledCounts: c.purchased,
        totalLectures: sum.totalLectures,
        totalDuration: sum.totalDuration,
      };
    });

    return res.status(200).json({ success: true, courses: related });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

/**
 * Lấy danh sách review của một khóa học (có phân trang), kèm user của review và replies.
 * - Không yêu cầu đăng nhập
 * @param courseId Id khóa học
 * @param query { page, limit, sortOrder }
 */
export const getCourseReviewsService = async (
  courseId: string,
  query: any,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return next(new ErrorHandler("Invalid course id", 400));
    }

    let page = parseInt(String(query?.page ?? "1"), 10);
    let limit = parseInt(String(query?.limit ?? "10"), 10);
    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100;
    const skip = (page - 1) * limit;
    const sortOrder = String(query?.sortOrder) === "asc" ? 1 : -1;

    const agg: PipelineStage[] = [
      { $match: { _id: new mongoose.Types.ObjectId(courseId) } },
      { $project: { reviews: 1 } },
      { $unwind: "$reviews" },
      { $sort: { "reviews.createdAt": sortOrder } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            // lookup review user
            {
              $lookup: {
                from: "users",
                localField: "reviews.userId",
                foreignField: "_id",
                as: "reviewUser",
              },
            },
            {
              $addFields: { reviewUser: { $arrayElemAt: ["$reviewUser", 0] } },
            },
            // lookup all reply users by ids array
            {
              $lookup: {
                from: "users",
                localField: "reviews.replies.userId",
                foreignField: "_id",
                as: "replyUsers",
              },
            },
            // materialize replies with user object
            {
              $addFields: {
                review: {
                  _id: "$reviews._id",
                  rating: "$reviews.rating",
                  comment: "$reviews.comment",
                  createdAt: "$reviews.createdAt",
                  updatedAt: "$reviews.updatedAt",
                  userId: {
                    _id: "$reviewUser._id",
                    name: "$reviewUser.name",
                    avatar: "$reviewUser.avatar",
                  },
                  replies: {
                    $map: {
                      input: { $ifNull: ["$reviews.replies", []] },
                      as: "r",
                      in: {
                        _id: "$$r._id",
                        answer: "$$r.answer",
                        createdAt: "$$r.createdAt",
                        updatedAt: "$$r.updatedAt",
                        userId: {
                          $let: {
                            vars: {
                              u: {
                                $arrayElemAt: [
                                  {
                                    $filter: {
                                      input: "$replyUsers",
                                      as: "u",
                                      cond: { $eq: ["$$u._id", "$$r.userId"] },
                                    },
                                  },
                                  0,
                                ],
                              },
                            },
                            in: {
                              _id: "$$u._id",
                              name: "$$u.name",
                              avatar: "$$u.avatar",
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            { $replaceRoot: { newRoot: "$review" } },
          ],
          total: [{ $count: "count" }],
        },
      },
    ];

    const result = await CourseModel.aggregate(agg);
    const bucket =
      Array.isArray(result) && result.length > 0
        ? result[0]
        : { data: [], total: [] };
    const data = bucket.data ?? [];
    const totalItems =
      (bucket.total && bucket.total[0] && bucket.total[0].count) || 0;

    res.status(200).json({
      success: true,
      paginatedResult: {
        data,
        meta: {
          totalItems,
          totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / limit),
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
    const { page, limit, skip } = parsePaging(query, 100, 10);
    const keyword =
      typeof query?.keyword !== "undefined" ? String(query.keyword).trim() : "";
    const filter: any = { creatorId: user._id };

    if (query?.status) {
      const statusValue = String(query.status).trim();
      if (statusValue) {
        filter.status = statusValue;
      }
    }

    if (keyword.length >= 2) {
      const regex = makeCaseInsensitiveRegex(keyword);
      filter.$or = [{ name: { $regex: regex } }, { tags: { $regex: regex } }];
    }

    const allowedSortFields = ["createdAt", "name"] as const;
    const sort = buildSort(query, allowedSortFields, "createdAt");

    const [courses, totalItems] = await Promise.all([
      CourseModel.find(filter)
        .select(
          "_id name description overview categories price estimatedPrice thumbnail tags level ratings purchased createdAt updatedAt creatorId status"
        )
        .populate("creatorId", "name avatar email")
        .populate("categories", "title")
        .sort(sort)
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

    const cacheKey = `course:topPurchased:${limit}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const courses = JSON.parse(cached);
        return res.status(200).json({ success: true, courses, cached: true });
      }
    } catch {}

    const courses = await CourseModel.find({
      purchased: { $gt: 0 },
      status: "published",
    })
      .select(
        "name price estimatedPrice thumbnail purchased courseData.sectionContents.videoLength"
      )
      .sort({ purchased: -1, createdAt: -1 })
      .limit(limit);

    const mapped = courses.map((c: any) => {
      const sum = summarizeCourseData(c.courseData);
      return {
        _id: c._id,
        thumbnail: { url: c.thumbnail?.url },
        name: c.name,
        price: c.price,
        estimatedPrice: c.estimatedPrice,
        enrolledCounts: c.purchased,
        totalLectures: sum.totalLectures,
        totalDuration: sum.totalDuration,
      };
    });

    try {
      await redis.set(cacheKey, JSON.stringify(mapped), "EX", 300);
    } catch {}

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

    const cacheKey = `course:topRated:${limit}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const courses = JSON.parse(cached);
        return res.status(200).json({ success: true, courses, cached: true });
      }
    } catch {}

    const courses = await CourseModel.find({
      status: "published",
      ratings: { $gt: 0 },
    })
      .select(
        "name price estimatedPrice thumbnail purchased ratings courseData.sectionContents.videoLength"
      )
      .sort({ ratings: -1, purchased: -1, createdAt: -1 })
      .limit(limit);

    const mapped = courses.map((c: any) => {
      const sum = summarizeCourseData(c.courseData);
      return {
        _id: c._id,
        thumbnail: { url: c.thumbnail?.url },
        name: c.name,
        price: c.price,
        estimatedPrice: c.estimatedPrice,
        enrolledCounts: c.purchased,
        totalLectures: sum.totalLectures,
        totalDuration: sum.totalDuration,
      };
    });

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

    // Admins are considered as having access
    if (String(user.role) === "admin") {
      return res.status(200).json({ success: true, hasPurchased: true });
    }

    // Check course existence and ownership
    const courseDoc = await CourseModel.findById(courseId).select("creatorId");
    if (!courseDoc) {
      return next(new ErrorHandler("Course not found", 404));
    }

    // Course creator is considered as having access
    if (String((courseDoc as any).creatorId) === String(user._id)) {
      return res.status(200).json({ success: true, hasPurchased: true });
    }

    const cacheKey = `course:userHasPurchased:${user._id}:${courseId}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        return res
          .status(200)
          .json({ success: true, hasPurchased: !!parsed.hasPurchased, cached: true });
      }
    } catch {}

    // Regular user: check enrollment
    const enrollment = await EnrolledCourseModel.findOne({
      userId: user._id,
      courseId: new mongoose.Types.ObjectId(courseId),
    }).select("_id");

    const hasPurchased = Boolean(enrollment);

    try {
      await redis.set(cacheKey, JSON.stringify({ hasPurchased }), "EX", 180);
    } catch {}

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
      status: (course as any).status,
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
    const { page, limit, skip } = parsePaging(query, 100, 10);
    if (!user?._id || user?.role === "admin") {
      return next(new ErrorHandler("Forbidden", 403));
    }

    const keyword =
      typeof query?.keyword !== "undefined" ? String(query.keyword).trim() : "";
    let categoryIds: string[] = [];
    if (typeof query?.categoryIds !== "undefined") {
      if (Array.isArray(query.categoryIds))
        categoryIds = query.categoryIds as string[];
      else if (typeof query.categoryIds === "string") {
        categoryIds = String(query.categoryIds)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      categoryIds = categoryIds.filter((id) =>
        mongoose.Types.ObjectId.isValid(id)
      );
    }

    const levelStr =
      typeof query?.level !== "undefined"
        ? String(query.level).trim().toLowerCase()
        : "";
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
    const enumLevel = levelStr ? mapLevel(levelStr) : null;

    const completedParam =
      typeof query?.completed !== "undefined"
        ? String(query.completed).toLowerCase()
        : "";
    const completedFilter =
      completedParam === "true"
        ? true
        : completedParam === "false"
        ? false
        : undefined;

    const minProgress =
      query?.minProgress !== undefined
        ? Math.max(0, Number(query.minProgress))
        : undefined;
    const maxProgress =
      query?.maxProgress !== undefined
        ? Math.min(100, Number(query.maxProgress))
        : undefined;

    const from = query?.from ? new Date(String(query.from)) : undefined;
    const to = query?.to ? new Date(String(query.to)) : undefined;

    const allowedSortBy = [
      "enrolledAt",
      "name",
      "createdAt",
      "ratings",
    ] as const;
    const sortBy = allowedSortBy.includes(String(query?.sortBy) as any)
      ? String(query.sortBy)
      : "enrolledAt";
    const sortOrder = String(query?.sortOrder) === "asc" ? 1 : -1;

    const enrollmentMatch: any = {
      userId: new mongoose.Types.ObjectId(String(user._id)),
    };
    if (typeof completedFilter !== "undefined")
      enrollmentMatch.completed = completedFilter;
    if (typeof minProgress === "number" || typeof maxProgress === "number") {
      enrollmentMatch.progress = {} as any;
      if (typeof minProgress === "number")
        (enrollmentMatch.progress as any).$gte = minProgress;
      if (typeof maxProgress === "number")
        (enrollmentMatch.progress as any).$lte = maxProgress;
    }
    if (from || to) {
      enrollmentMatch.enrolledAt = {} as any;
      if (from) (enrollmentMatch.enrolledAt as any).$gte = from;
      if (to) (enrollmentMatch.enrolledAt as any).$lte = to;
    }

    const courseMatch: any = {};
    if (keyword.length >= 2) {
      const regex = makeCaseInsensitiveRegex(keyword);
      courseMatch.$or = [
        { "course.name": { $regex: regex } },
        { "course.tags": { $regex: regex } },
      ];
    }
    if (categoryIds.length > 0) {
      courseMatch["course.categories"] = {
        $in: categoryIds.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }
    if (enumLevel) courseMatch["course.level"] = enumLevel;

    const sort: any = {};
    if (sortBy === "enrolledAt") sort.enrolledAt = sortOrder;
    if (sortBy === "name") sort["course.name"] = sortOrder;
    if (sortBy === "createdAt") sort["course.createdAt"] = sortOrder;
    if (sortBy === "ratings") sort["course.ratings"] = sortOrder;

    const aggPipeline: any[] = [
      { $match: enrollmentMatch },
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
      {
        $project: {
          course: {
            _id: 1,
            name: 1,
            description: 1,
            overview: 1,
            categories: 1,
            price: 1,
            estimatedPrice: 1,
            thumbnail: 1,
            tags: 1,
            level: 1,
            ratings: 1,
            purchased: 1,
            createdAt: 1,
            updatedAt: 1,
            creatorId: 1,
            status: 1, // ✅ thêm status
          },
          progress: 1,
          completed: 1,
          enrolledAt: 1,
        },
      },
    ];

    if (Object.keys(courseMatch).length > 0) {
      aggPipeline.push({ $match: courseMatch });
    }

    if (Object.keys(sort).length > 0) aggPipeline.push({ $sort: sort });
    else aggPipeline.push({ $sort: { enrolledAt: -1 } });

    aggPipeline.push({
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        total: [{ $count: "count" }],
      },
    });

    const aggResult = await EnrolledCourseModel.aggregate(aggPipeline);
    const dataArr =
      Array.isArray(aggResult) && aggResult.length > 0 ? aggResult[0].data : [];
    const totalAgg =
      Array.isArray(aggResult) && aggResult.length > 0
        ? aggResult[0].total
        : [];
    const total =
      Array.isArray(totalAgg) && totalAgg.length > 0 ? totalAgg[0].count : 0;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    const courseIds = dataArr.map((d: any) => d.course._id);
    const coursesDocs = await CourseModel.find({ _id: { $in: courseIds } })
      .select(
        "_id name description overview categories price estimatedPrice thumbnail tags level ratings purchased createdAt updatedAt creatorId status"
      )
      .populate("creatorId", "name avatar email")
      .populate("categories", "title")
      .lean();

    const courseMap = new Map<string, any>();
    coursesDocs.forEach((c: any) => {
      c.level = normalizeLevel(c.level);
      courseMap.set(String(c._id), c);
    });

    const courses = dataArr.map((en: any) => ({
      course: courseMap.get(String(en.course._id)) ?? en.course,
      progress: en.progress ?? 0,
      completed: en.completed ?? false,
      enrolledAt: en.enrolledAt,
    }));

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

    const oldTotalLectures = countTotalLectures(findCourse);

    {
      const payloadStatus =
        typeof (data as any)?.status !== "undefined"
          ? String((data as any).status)
          : typeof (data as any)?.$set?.status !== "undefined"
          ? String((data as any).$set.status)
          : undefined;
      if (typeof payloadStatus !== "undefined") {
        const nextStatus = payloadStatus.trim().toLowerCase();
        if (nextStatus === "draft") {
          const enrolledCount = await EnrolledCourseModel.countDocuments({
            courseId: new mongoose.Types.ObjectId(String(courseId)),
          });
          if (enrolledCount > 0) {
            return next(
              new ErrorHandler(
                "Cannot change status to draft: course has enrolled students",
                400
              )
            );
          }
        }
      }
    }

    const availableCourseThumbnail = findCourse?.thumbnail;
    data.thumbnail = await upsertCourseThumbnail(
      data.thumbnail,
      availableCourseThumbnail
    );

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
      try {
        data.categories = await validateAndMaterializeCategoryIds(
          data.categories
        );
      } catch (e: any) {
        return next(
          new ErrorHandler(
            e?.message || "Invalid categories",
            e?.statusCode || 400
          )
        );
      }
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

    try {
      if (course) {
        const newTotalLectures = countTotalLectures(course);
        if (newTotalLectures !== oldTotalLectures) {
          await recomputeEnrollmentsProgressForCourse(
            (course as any)._id,
            newTotalLectures
          );

          const delta = newTotalLectures - oldTotalLectures;
          if (delta > 0) {
            const enrolledStudents = await EnrolledCourseModel.find({
              courseId: new mongoose.Types.ObjectId(String((course as any)._id)),
            })
              .select("userId")
              .lean();

            await Promise.all(
              enrolledStudents.map((en) =>
                createAndSendNotification({
                  userId: en.userId.toString(),
                  title: "Course Updated",
                  message: `New lecture(s) added to "${(course as any).name}". Your progress has been recalculated.`,
                })
              )
            ).catch(() => null);
          }
        }
      }
    } catch (recalcErr) {
      console.error("Recompute/notify failed:", recalcErr);
    }

    try {
      await redis.del(`course:overview:${courseId}`);
    } catch {}

    res.status(201).json({
      success: true,
      course,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
}

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
    const cacheKey = `course:overview:${courseId}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const courseData = JSON.parse(cached);
        return res
          .status(200)
          .json({ success: true, course: courseData, cached: true });
      }
    } catch {}

    const course = await CourseModel.findById(courseId)
      .populate("reviews.userId", "name avatar")
      .populate("reviews.replies.userId", "name avatar")
      .populate("categories", "title")
      .populate("creatorId", "name avatar email bio");

    if (!course) return next(new ErrorHandler("Course not found", 404));
    if (course.status === "retired")
      return next(new ErrorHandler("Course has been retired", 410));
    if (course.status === "draft")
      return next(new ErrorHandler("Course not found", 404));

    const totalSections = course.courseData.length;
    const sections = course.courseData.map((section: any) => ({
      _id: section._id,
      sectionTitle: section.sectionTitle,
      sectionContents: section.sectionContents.map((lecture: any) => ({
        _id: lecture._id,
        videoTitle: lecture.videoTitle,
        videoDescription: lecture.videoDescription,
        videoLength: lecture.videoLength,
      })),
    }));

    const summary = summarizeCourseData(course.courseData);

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
      totalLectures: summary.totalLectures,
      totalTime: summary.totalDuration,
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
      status: (course as any).status,
    };

    try {
      await redis.set(cacheKey, JSON.stringify(courseData), "EX", 300);
    } catch {}

    res.status(200).json({ success: true, course: courseData });
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
      CourseModel.findById(courseId).select("creatorId status"),
    ]);

    if (!courseDoc) return next(new ErrorHandler("Course not found", 404));

    const owner = isOwner(courseDoc, userId);
    const isEnrolled = Boolean(enrollment);

    if (
      courseDoc.status === "retired" &&
      !isAdmin(userId) &&
      !owner &&
      !isEnrolled
    ) {
      return next(new ErrorHandler("Course has been retired", 410));
    }
    if (!isEnrolled && !owner && !isAdmin(userId)) {
      return next(
        new ErrorHandler("You are not eligible to access this course", 403)
      );
    }
    if (courseDoc.status === "draft" && !isAdmin(userId) && !owner) {
      return next(
        new ErrorHandler("You are not eligible to access this course", 403)
      );
    }

    const course = await CourseModel.findById(courseId)
      .populate(
        "courseData.sectionContents.lectureComments.userId",
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

    if (course) (course as any).level = levelEnumValue;

    const shouldSanitize = !owner && !isAdmin(userId);
    let payloadCourse: any = course;
    if (shouldSanitize && course) payloadCourse = sanitizeCourseMedia(course);

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
 * Lấy danh sách comment của một lecture trong khóa học, có phân trang.
 * - Điều kiện: đã mua/ghi danh, là creator hoặc admin
 * - Trả về comment theo dạng cây: comment gốc + replies
 */
export const getLectureCommentsService = async (
  courseId: string,
  contentId: string,
  query: any,
  userId: any,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return next(new ErrorHandler("Invalid course id", 400));
    }
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return next(new ErrorHandler("Invalid content id", 400));
    }

    const [enrollment, courseDoc] = await Promise.all([
      EnrolledCourseModel.findOne({ userId: userId?._id, courseId }),
      CourseModel.findById(courseId).select("creatorId status"),
    ]);
    if (!courseDoc) return next(new ErrorHandler("Course not found", 404));

    const owner = isOwner(courseDoc, userId);
    if (
      courseDoc.status === "retired" &&
      !isAdmin(userId) &&
      !owner &&
      !enrollment
    ) {
      return next(new ErrorHandler("Course has been retired", 410));
    }
    if (!enrollment && !owner && !isAdmin(userId)) {
      return next(
        new ErrorHandler("You are not eligible to access this course", 403)
      );
    }

    let page = parseInt(String(query?.page ?? "1"), 10);
    let limit = parseInt(String(query?.limit ?? "10"), 10);
    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100;
    const sortOrder = String(query?.sortOrder) === "asc" ? 1 : -1;

    const agg: PipelineStage[] = [
      { $match: { _id: new mongoose.Types.ObjectId(courseId) } },
      { $project: { courseData: 1 } },
      { $unwind: "$courseData" },
      { $unwind: "$courseData.sectionContents" },
      {
        $match: {
          "courseData.sectionContents._id": new mongoose.Types.ObjectId(
            contentId
          ),
        },
      },
      { $project: { content: "$courseData.sectionContents" } },
      {
        $addFields: {
          allUserIds: {
            $setUnion: [
              {
                $map: {
                  input: { $ifNull: ["$content.lectureComments", []] },
                  as: "c",
                  in: "$$c.userId",
                },
              },
              [],
            ],
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "allUserIds",
          foreignField: "_id",
          as: "users",
        },
      },
      {
        $addFields: {
          comments: {
            $map: {
              input: { $ifNull: ["$content.lectureComments", []] },
              as: "c",
              in: {
                _id: "$$c._id",
                content: "$$c.content",
                parentId: "$$c.parentId",
                createdAt: "$$c.createdAt",
                updatedAt: "$$c.updatedAt",
                userId: {
                  $let: {
                    vars: {
                      u: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$users",
                              as: "u",
                              cond: { $eq: ["$$u._id", "$$c.userId"] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: {
                      _id: "$$u._id",
                      name: "$$u.name",
                      avatar: "$$u.avatar",
                    },
                  },
                },
              },
            },
          },
        },
      },
      { $project: { comments: 1, _id: 0 } },
    ];

    const result = await CourseModel.aggregate(agg);
    if (!Array.isArray(result) || result.length === 0) {
      return next(new ErrorHandler("Lecture not found", 404));
    }

    const allComments: any[] = result[0]?.comments ?? [];
    const topLevel = allComments
      .filter((c: any) => !c.parentId)
      .sort((a: any, b: any) =>
        sortOrder === 1
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    const totalItems = topLevel.length;
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const pagedTop = topLevel.slice(start, end);

    const data = pagedTop.map((t) => {
      const replies = allComments
        .filter((c: any) => String(c.parentId) === String(t._id))
        .sort(
          (a: any, b: any) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      return { ...t, replies };
    });

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

    const filter: any = { status: "published" };

    if (typeof searchQuery !== "undefined") {
      const keyword = String(searchQuery ?? "").trim();

      if (keyword.length >= 2) {
        const regexPattern = makeCaseInsensitiveRegex(keyword);

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

    const sortKey = typeof sort === "string" ? sort : "";

    const cacheKeyBase = JSON.stringify({
      searchQuery,
      category,
      level,
      priceMin,
      priceMax,
      sort: sortKey,
    });
    const cacheKey = `course:search:${Buffer.from(cacheKeyBase).toString(
      "base64"
    )}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const courses = JSON.parse(cached);
        return res.status(200).json({ success: true, courses, cached: true });
      }
    } catch {}

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

    try {
      await redis.set(cacheKey, JSON.stringify(mapped), "EX", 60);
    } catch {}

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
export const addCommentService = async (
  commentData: any,
  userId: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { comment, courseId, contentId } = commentData;
    const course = await CourseModel.findById(courseId).select(
      "creatorId status courseData"
    );
    if (!course) return next(new ErrorHandler("Course not found", 404));
    if (
      course.status === "retired" &&
      !isAdmin(userId) &&
      !isOwner(course, userId) &&
      !(await EnrolledCourseModel.findOne({ userId: userId?._id, courseId }))
    ) {
      return next(new ErrorHandler("Course has been retired", 410));
    }

    const enrollmentForQuestion = await EnrolledCourseModel.findOne({
      userId: userId?._id,
      courseId,
    });
    const owner = isOwner(course, userId);
    if (!enrollmentForQuestion && !owner && !isAdmin(userId)) {
      return next(
        new ErrorHandler(
          "You must be enrolled in this course to ask questions",
          403
        )
      );
    }

    const section = (course as any)?.courseData.find((sec: any) =>
      sec.sectionContents.some((cont: any) => cont._id.equals(contentId))
    );
    const content = section?.sectionContents.find((cont: any) =>
      cont._id.equals(contentId)
    );
    if (!content) return next(new ErrorHandler("Content not found", 404));

    const newComment: any = {
      userId: userId?._id,
      content: comment,
      parentId: null,
    };
    content.lectureComments.push(newComment);

    const creatorId = (course as any)?.creatorId;
    const commenterId = String(userId?._id); // Người viết comment

    // 2. Chỉ gửi nếu người viết comment không phải là giảng viên
    if (creatorId && String(creatorId) !== commenterId) {
      // 3. Lấy cài đặt của Giảng viên
      const creatorUser = await userModel
        .findById(creatorId)
        .select("notificationSettings");

      // 4. Kiểm tra cài đặt
      if (creatorUser && creatorUser.notificationSettings.on_reply_comment) {
        await createAndSendNotification({
          userId: String(creatorId),
          title: "New Comment",
          message: `${userId?.name} has a new comment in section: ${section?.sectionTitle}`,
          link: `/course-enroll/${courseId}?focusLecture=${contentId}&focusQuestion=${newComment._id}`,
        });
      }
    }

    await (course as any).save();
    res
      .status(200)
      .json({ success: true, message: "Add comment successfully" });
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
export const addReplyService = async (
  replyData: any,
  userId: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reply, courseId, contentId, commentId } = replyData;
    const course = await CourseModel.findById(courseId);
    if (!course) return next(new ErrorHandler("Course not found", 404));
    if (
      course.status === "retired" &&
      !isAdmin(userId) &&
      !isOwner(course, userId) &&
      !(await EnrolledCourseModel.findOne({ userId: userId?._id, courseId }))
    ) {
      return next(new ErrorHandler("Course has been retired", 410));
    }

    const enrollmentForAnswer = await EnrolledCourseModel.findOne({
      userId: userId?._id,
      courseId,
    });
    const owner = isOwner(course, userId);
    if (!enrollmentForAnswer && !owner && userId?.role !== "admin") {
      return next(
        new ErrorHandler(
          "You must be enrolled in this course to answer questions",
          403
        )
      );
    }

    const section = (course as any)?.courseData.find((sec: any) =>
      sec.sectionContents.some((cont: any) => cont._id.equals(contentId))
    );
    const content = section?.sectionContents.find((cont: any) =>
      cont._id.equals(contentId)
    );
    if (!content) return next(new ErrorHandler("Content not found", 404));

    const comment = content?.lectureComments.find((c: any) =>
      c._id.equals(commentId)
    );
    if (!comment) return next(new ErrorHandler("Comment not found", 404));

    const askedUser = await userModel.findById(comment.userId);
    if (!askedUser || !askedUser.email)
      return next(new ErrorHandler("User email not found", 404));

    const replyComment: any = {
      userId: userId?._id,
      content: reply,
      parentId: comment._id,
    };
    content.lectureComments.push(replyComment);

    await (course as any).save();

    const data = { name: askedUser.name, title: section?.sectionTitle };
    await ejs.renderFile(
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

    res.status(200).json({ success: true, message: "Reply successfully" });
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
    if (!course) return next(new ErrorHandler("Course not found", 404));
    if (
      course.status === "retired" &&
      !isAdmin(userId) &&
      !isOwner(course, userId) &&
      !enrollmentForReview
    ) {
      return next(new ErrorHandler("Course has been retired", 410));
    }

    const owner = isOwner(course, userId);
    // Require students to complete 100% of the course before reviewing
    if (!owner && userId?.role !== "admin") {
      if (!enrollmentForReview) {
        return next(
          new ErrorHandler("You are not eligible to review this course", 403)
        );
      }
      if (!enrollmentForReview.completed) {
        return next(
          new ErrorHandler(
            "You can only review after completing 100% of this course",
            403
          )
        );
      }
    }

    const reviewDataObj: any = {
      userId: userId?._id,
      rating,
      comment: review,
      replies: [],
    };
    (course as any)?.reviews.push(reviewDataObj);

    let avg = 0;
    (course as any)?.reviews.forEach((rev: any) => {
      avg += rev.rating;
    });
    course.ratings =
      (course as any).reviews.length > 0
        ? avg / (course as any).reviews.length
        : 0;

    await course.save();

    try {
      await redis.del(
        `course:overview:${courseId}`,
        "course:latestReviews:10",
        "course:latestReviews:20",
        "course:latestReviews:50",
        "course:topRated:10",
        "course:topRated:20"
      );
    } catch {}

    // --- Logic cho "New Review" (Gửi cho Giảng viên) ---

    const creatorId = (course as any)?.creatorId;

    // 1. Chỉ gửi nếu người review không phải là giảng viên
    if (creatorId && String(creatorId) !== String(userId?._id)) {
      // 2. Lấy cài đặt của Giảng viên
      const creatorUser = await userModel
        .findById(creatorId)
        .select("notificationSettings");

      // 3. Kiểm tra cài đặt
      if (creatorUser && creatorUser.notificationSettings.on_new_review) {
        await createAndSendNotification({
          userId: String(creatorId),
          title: "New Review Received",
          message: `${userId?.name} has given a review in ${course?.name}`,
          link: `/course-overview/${courseId}?focusReview=${reviewDataObj._id}`, // Ví dụ link
        });
      }
    }

    res.status(200).json({ success: true, course });
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
    if (!course) return next(new ErrorHandler("Course not found", 404));
    if (
      course.status === "retired" &&
      !isAdmin(userId) &&
      !isOwner(course, userId) &&
      !(await EnrolledCourseModel.findOne({ userId: userId?._id, courseId }))
    ) {
      return next(new ErrorHandler("Course has been retired", 410));
    }

    const enrollmentForReviewReply = await EnrolledCourseModel.findOne({
      userId: userId?._id,
      courseId,
    });
    const owner = isOwner(course, userId);
    if (!enrollmentForReviewReply && !owner && userId?.role !== "admin") {
      return next(
        new ErrorHandler(
          "You must be enrolled in this course to reply to reviews",
          403
        )
      );
    }

    const review = (course as any)?.reviews?.find(
      (rev: any) => rev._id.toString() === reviewId
    );
    if (!review)
      return next(new ErrorHandler("Review of the course not found", 404));

    const replyDataObj: any = { userId: userId?._id, answer: comment };
    review.replies?.push(replyDataObj);

    await course.save();

    try {
      await redis.del(
        `course:overview:${courseId}`,
        "course:latestReviews:10",
        "course:latestReviews:20",
        "course:latestReviews:50",
        "course:topRated:10",
        "course:topRated:20"
      );
    } catch {}
    res.status(200).json({ success: true, course });
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
    const course = await CourseModel.findById(courseId).select("status name");
    if (!course) return next(new ErrorHandler("Course not found", 404));

    if (course.status === "retired" || course.status === "archived") {
      return res
        .status(200)
        .json({ success: true, message: "Course already removed" });
    }

    (course as any).status = "archived";
    (course as any).deletedAt = new Date();
    await course.save();

    try {
      await CartModel.updateMany(
        {},
        {
          $pull: {
            items: { courseId: new mongoose.Types.ObjectId(courseId) },
            savedForLater: { courseId: new mongoose.Types.ObjectId(courseId) },
          },
        }
      );
    } catch (e) {
      console.error("Failed to cleanup carts for archived course", courseId, e);
    }

    try {
      await redis.del(`course:overview:${courseId}`);
    } catch {}

    res.status(200).json({
      success: true,
      message: "Course archived successfully",
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

export const softDeleteCourseService = async (
  user: any,
  courseId: string,
  res: Response,
  next: NextFunction,
  opts?: {
    retire?: boolean;
    reason?: string;
    removeFromCarts?: boolean;
    notify?: boolean;
  }
) => {
  try {
    const {
      retire = false,
      reason = "",
      removeFromCarts = true,
      notify = true,
    } = opts || {};
    if (!mongoose.Types.ObjectId.isValid(courseId))
      return next(new ErrorHandler("Invalid course id", 400));

    const course = await CourseModel.findById(courseId).select(
      "creatorId name status"
    );
    if (!course) return next(new ErrorHandler("Course not found", 404));

    const owner = isOwner(course, user);
    if (!owner && !isAdmin(user))
      return next(new ErrorHandler("Forbidden", 403));

    if (["archived", "retired"].includes(course.status as any)) {
      return res
        .status(200)
        .json({ success: true, message: "Course already soft-deleted" });
    }

    (course as any).status = retire ? "retired" : "archived";
    (course as any).deletedAt = new Date();
    if (user?._id) (course as any).deletedBy = user._id;
    if (reason) (course as any).deleteReason = reason.slice(0, 500);
    await course.save();

    if (removeFromCarts) {
      await CartModel.updateMany(
        {},
        {
          $pull: {
            items: { courseId: new mongoose.Types.ObjectId(courseId) },
            savedForLater: { courseId: new mongoose.Types.ObjectId(courseId) },
          },
        }
      ).catch(() => null);
    }

    try {
      await redis.del(`course:overview:${courseId}`);
    } catch {}

    if (notify) {
      // Notify creator
      await createAndSendNotification({
        userId: course.creatorId.toString(),
        title: retire ? "Course retired" : "Course archived",
        message: `"${(course as any).name}" has been ${
          retire ? "retired" : "archived"
        }${reason ? `: ${reason}` : ""}.`,
      }).catch(() => null);

      // Notify all enrolled students
      const enrolledStudents = await EnrolledCourseModel.find({
        courseId: new mongoose.Types.ObjectId(courseId),
      })
        .select("userId")
        .lean();

      const studentNotifications = enrolledStudents.map((enrollment) =>
        createAndSendNotification({
          userId: enrollment.userId.toString(),
          title: retire ? "Course Retired" : "Course Archived",
          message: retire
            ? `The course "${(course as any).name}" has been retired${
                reason ? `: ${reason}` : ""
              }.`
            : `The course "${
                (course as any).name
              }" has been temporarily archived${reason ? `: ${reason}` : ""}.`,
        }).catch(() => null)
      );

      await Promise.all(studentNotifications);
    }

    return res.status(200).json({
      success: true,
      message: retire
        ? "Retired course successfully"
        : "Archived course successfully",
    });
  } catch (e: any) {
    return next(new ErrorHandler(e.message, 500));
  }
};

export const restoreCourseService = async (
  user: any,
  courseId: string,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(courseId))
      return next(new ErrorHandler("Invalid course id", 400));
    const course = await CourseModel.findById(courseId).select(
      "creatorId status"
    );
    if (!course) return next(new ErrorHandler("Course not found", 404));

    const owner = isOwner(course, user);
    if (!owner && !isAdmin(user))
      return next(new ErrorHandler("Forbidden", 403));

    if (course.status === "published") {
      return res
        .status(200)
        .json({ success: true, message: "Course is already active" });
    }

    await CourseModel.findByIdAndUpdate(courseId, {
      $set: { status: "published" },
      $unset: { deletedAt: 1, deletedBy: 1, deleteReason: 1 },
    });

    try {
      await redis.del(`course:overview:${courseId}`);
    } catch {}

    res
      .status(200)
      .json({ success: true, message: "Restored course successfully" });
  } catch (e: any) {
    return next(new ErrorHandler(e.message, 500));
  }
};

export const hardDeleteCourseService = async (
  user: any,
  courseId: string,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!isAdmin(user)) return next(new ErrorHandler("Forbidden", 403));
    const course = await CourseModel.findById(courseId);
    if (!course) return next(new ErrorHandler("Course not found", 404));

    await CourseModel.findByIdAndDelete(courseId);

    try {
      await CartModel.updateMany(
        {},
        {
          $pull: {
            items: { courseId: new mongoose.Types.ObjectId(courseId) },
            savedForLater: { courseId: new mongoose.Types.ObjectId(courseId) },
          },
        }
      );
    } catch (e) {
      console.error("Failed to cleanup carts for deleted course", courseId, e);
    }

    try {
      await redis.del(`course:overview:${courseId}`);
    } catch {}

    res
      .status(200)
      .json({ success: true, message: "Course hard-deleted successfully" });
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
  const { page, limit, skip } = parsePaging(query, 100, 10);
  const keyword =
    typeof query?.keyword !== "undefined" ? String(query.keyword).trim() : "";
  const filter: any = {};

  if (query?.status) {
    const statusValue = String(query.status).trim();
    if (statusValue) {
      filter.status = statusValue;
    }
  }

  if (keyword.length >= 2) {
    const regex = makeCaseInsensitiveRegex(keyword);
    filter.$or = [{ name: { $regex: regex } }, { tags: { $regex: regex } }];
  }

  const allowedSortFields = ["createdAt", "name"] as const;
  const sort = buildSort(query, allowedSortFields, "createdAt");

  const [courses, totalItems] = await Promise.all([
    CourseModel.find(filter)
      .populate("reviews.userId", "name avatar")
      .populate("creatorId", "name avatar email")
      .populate("categories", "title")
      .sort(sort)
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
  next: NextFunction,
  query?: any
) => {
  try {
    const q: any = query || {};
    const { page, limit, skip } = parsePaging(q, 100, 10);
    const keyword =
      typeof q?.keyword !== "undefined" ? String(q.keyword).trim() : "";

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
      const regex = makeCaseInsensitiveRegex(keyword);
      pipeline.push({
        $match: {
          $or: [
            { "user.name": { $regex: regex } },
            { "user.email": { $regex: regex } },
          ],
        },
      });
    }

    const allowedSortFields = ["createdAt", "name"] as const;
    const sortBy = allowedSortFields.includes(String(q?.sortBy) as any)
      ? String(q.sortBy)
      : "createdAt";
    const sortOrder = String(q?.sortOrder) === "asc" ? 1 : -1;
    const sortStage =
      sortBy === "name"
        ? { $sort: { "user.name": sortOrder } }
        : { $sort: { enrolledAt: sortOrder } };

    const countPipeline = [...pipeline, { $count: "count" }];
    const dataPipeline = [
      ...pipeline,
      sortStage,
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
    const cacheKey = "course:categories:all";

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const categories = JSON.parse(cached);
        return res
          .status(200)
          .json({ success: true, categories, cached: true });
      }
    } catch {}

    const categories = await CategoryModel.find()
      .sort({ createdAt: -1 })
      .select("_id title");

    try {
      await redis.set(cacheKey, JSON.stringify(categories), "EX", 1800);
    } catch {}

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
    const cacheKey = "course:levels";

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const levels = JSON.parse(cached);
        return res
          .status(200)
          .json({ success: true, levels, cached: true });
      }
    } catch {}

    const levels = Object.values(ECourseLevel);

    try {
      await redis.set(cacheKey, JSON.stringify(levels), "EX", 3600);
    } catch {}

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
      EnrolledCourseModel.findOne({ userId: user?._id, courseId }),
      CourseModel.findById(courseId).select(
        "courseData.sectionContents._id creatorId status"
      ),
    ]);

    if (!course) return next(new ErrorHandler("Course not found", 404));
    if (
      course.status === "retired" &&
      !isAdmin(user) &&
      !isOwner(course, user) &&
      !isEnrolledByUserDoc
    ) {
      return next(new ErrorHandler("Course has been retired", 410));
    }

    const isEnrolled = Boolean(isEnrolledByUserDoc);
    const owner = isOwner(course, user);
    if (!isEnrolled && !owner && user?.role !== "admin") {
      return next(new ErrorHandler("You are not enrolled in this course", 403));
    }

    const totalLectures = (course.courseData || []).reduce(
      (acc: number, section: any) =>
        acc + (section.sectionContents ? section.sectionContents.length : 0),
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
      { new: true, upsert: user?.role === "admin" || owner ? true : false }
    );
    if (!updated)
      return next(new ErrorHandler("Enrollment record not found", 404));

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
