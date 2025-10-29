// src/services/user.service.ts
import userModel, { IUser, UserRole } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { Request, Response } from "express";
// import { redis } from "../utils/redis";
import {
  IStudent,
  ITutor,
  IUpdateStudentInterestDto,
  IUpdateTutorExpertiseDto,
  IUpdateUserInfo,
} from "../types/user.types";
import {
  CourseQueryParams,
  paginate,
  PaginationParams,
  SortOptions,
} from "../utils/pagination.helper"; // Import the helper
import {
  IUpdatePassword,
  IUpdatePasswordParams,
  IUserResponse,
} from "../types/auth.types";
import CategoryModel, { ICategory } from "../models/category.model";
import { tutorModel } from "../models/tutor.model";
import mongoose, { Types } from "mongoose";
import { studentModel } from "../models/student.model";
import { _toUserResponse } from "./auth.service";
import courseModel from "../models/course.model";
import EnrolledCourseModel from "../models/enrolledCourse.model";
import OrderModel from "../models/order.model";
import { createKeywordSearchFilter } from "../utils/query.helper";
import {
  courseTutorViewProjection,
  ICourseTutorViewDto,
  IPaginatedTutorCourseResult,
} from "../interfaces/course-tutor-view.interface";

// Cập nhật profile khi đăng ký
export type ICombinedTutorUserResponse = ReturnType<ITutor["toObject"]> &
  IUserResponse;

export const updateTutorExpertiseService = async (
  userId: string,
  data: IUpdateTutorExpertiseDto
): Promise<ICombinedTutorUserResponse> => {
  const { expertise } = data;

  if (!expertise || expertise.length === 0) {
    throw new ErrorHandler("Expertise is required for tutors.", 400);
  }

  // BƯỚC 1: Tìm user và profile (KHÔNG cần populate ở đây)
  const [user, tutorProfile] = await Promise.all([
    userModel.findById(userId),
    tutorModel.findOne({ userId }), // Bỏ .populate() không cần thiết ở đây
  ]);

  if (!user || !tutorProfile) {
    throw new ErrorHandler("User or Tutor profile not found.", 404);
  }

  // BƯỚC 2: Cập nhật dữ liệu bằng ObjectId và lưu vào DB
  tutorProfile.expertise = expertise as unknown as Types.ObjectId[];
  if (user.isSurveyCompleted === false) {
    user.isSurveyCompleted = true;
  }
  await Promise.all([tutorProfile.save(), user.save()]);

  // BƯỚC 3: Chuẩn bị response (POPULATE MỘT LẦN DUY NHẤT Ở ĐÂY)
  // Populate document sau khi đã được lưu với dữ liệu mới nhất
  const populatedProfile = await tutorProfile.populate<{
    expertise: ICategory[];
  }>("expertise");

  let expertiseTitles: string[] = [];

  // Sửa lỗi 'undefined': Thêm kiểm tra sự tồn tại của 'populatedProfile.expertise'
  if (populatedProfile && populatedProfile.expertise) {
    // Sửa lỗi 'title does not exist': Giờ đây TypeScript hiểu 'category' là ICategory
    expertiseTitles = populatedProfile.expertise.map(
      (category) => category.title
    );
  }

  const userResponse = _toUserResponse(user);
  const { userId: removedUserId, ...restOfProfile } =
    populatedProfile.toObject();

  const combinedResponse = {
    ...restOfProfile,
    ...userResponse,
    expertise: expertiseTitles,
  };

  return combinedResponse as ICombinedTutorUserResponse;
};

export const getTutorDashboardSummaryService = async (userId: string) => {
  const courses = await courseModel
    .find({ creatorId: userId })
    .select("_id purchased ratings")
    .lean();
  const myCoursesCount = courses.length;
  const myStudentsCount = courses.reduce(
    (acc, c: any) => acc + (c.purchased || 0),
    0
  );

  const courseIds = courses.map((c: any) => c._id);
  const recentEnrollments = await EnrolledCourseModel.find({
    courseId: { $in: courseIds },
  })
    .sort({ enrolledAt: -1 })
    .limit(5)
    .populate("userId", "name avatar email")
    .select("userId courseId enrolledAt");

  const courseIdStrings = courseIds.map((id) => String(id));
  const revenueAgg = await OrderModel.aggregate([
    { $match: { "payment_info.status": { $in: ["succeeded", "paid"] } } },
    { $unwind: "$items" },
    { $match: { "items.courseId": { $in: courseIdStrings } } },
    {
      $group: {
        _id: null,
        revenue: { $sum: "$items.price" },
        count: { $sum: 1 },
      },
    },
  ]);
  const myRevenue =
    Array.isArray(revenueAgg) && revenueAgg.length ? revenueAgg[0].revenue : 0;

  return {
    summary: {
      myCoursesCount,
      myStudentsCount,
      myRevenue,
    },
    recentEnrollments,
  };
};

export const getTutorEarningsChartService = async (
  userId: string,
  range: string = "30d"
) => {
  const isMonthly = range === "12m";
  const courses = await courseModel
    .find({ creatorId: userId })
    .select("_id")
    .lean();
  const tutorCourseIds = courses.map((c: any) => String(c._id));
  const groupId = isMonthly
    ? { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }
    : {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        day: { $dayOfMonth: "$createdAt" },
      };

  const series = await OrderModel.aggregate([
    { $match: { "payment_info.status": { $in: ["succeeded", "paid"] } } },
    { $unwind: "$items" },
    { $match: { "items.courseId": { $in: tutorCourseIds } } },
    { $group: { _id: groupId, revenue: { $sum: "$items.price" } } },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
        ...(isMonthly ? {} : { "_id.day": 1 }),
      },
    },
  ]);

  return { range, series };
};

export const getTutorDetailsService = async (tutorId: string) => {
  const id = new mongoose.Types.ObjectId(tutorId);

  // --- BƯỚC 2: Kiểm tra User có tồn tại VÀ có phải là 'tutor' không ---
  // (Giả sử userModel của bạn có trường `role: 'tutor'`)
  const user = await userModel
    .findOne({ _id: id, role: "tutor" }) // *** Đây là phần kiểm tra ***
    .select("name avatar.url bio social socials") // Chỉ lấy các trường cần thiết
    .lean(); // Sử dụng .lean() để đọc nhanh hơn (trả về POJO)

  // Nếu không tìm thấy user, hoặc user đó không phải 'tutor'
  if (!user) {
    // Bạn có thể throw error hoặc return null
    // throw new Error("Tutor not found");
    return null;
  }

  // --- BƯỚC 3: Chạy aggregation CHỈ để lấy các chỉ số thống kê ---
  // Chúng ta đã loại bỏ $lookup, $unwind vì đã có thông tin user
  const statsAggregation = await courseModel.aggregate([
    // Giai đoạn 1: Lọc tất cả các khóa học của giảng viên này
    {
      $match: {
        creatorId: id,
      },
    },
    // Giai đoạn 2: Nhóm và tính toán
    {
      $group: {
        _id: "$creatorId",
        totalStudents: { $sum: "$purchased" },
        totalCourses: { $sum: 1 },
        totalReviews: { $sum: { $size: "$reviews" } },
        averageRating: { $avg: "$ratings" },
      },
    },
    // Giai đoạn 3: Định dạng lại (loại bỏ _id, làm tròn rating)
    {
      $project: {
        _id: 0,
        totalStudents: 1,
        totalCourses: 1,
        totalReviews: 1,
        averageRating: { $round: ["$averageRating", 1] },
      },
    },
  ]);

  // --- BƯỚC 4: Kết hợp thông tin User và kết quả thống kê ---

  // statsAggregation sẽ là mảng:
  // - [ { totalStudents: ..., ... } ] nếu có khóa học
  // - [] nếu chưa có khóa học nào
  const courseStats = statsAggregation[0];

  // Trả về kết quả cuối cùng, kết hợp thông tin user và các chỉ số
  return {
    name: user.name,
    avatar: {
      url: user.avatar?.url || "", // Xử lý trường hợp avatar/url có thể null
    },
    bio: user.bio,
    socials: user.socials,
    // Dùng toán tử `?.` hoặc `||` để gán giá trị 0 nếu chưa có khóa học
    totalStudents: courseStats?.totalStudents || 0,
    totalCourses: courseStats?.totalCourses || 0,
    totalReviews: courseStats?.totalReviews || 0,
    averageRating: courseStats?.averageRating || 0,
  };
};

export const findCoursesByTutorId = async (
  tutorId: string,
  queryParams: CourseQueryParams
): Promise<IPaginatedTutorCourseResult> => {
  // <-- SỬ DỤNG KIỂU TRẢ VỀ MỚI

  // 1. Kiểm tra tutorId (Giữ nguyên)
  if (!mongoose.Types.ObjectId.isValid(tutorId)) {
    throw new ErrorHandler("ID gia sư không hợp lệ.", 400);
  }

  // 2. Destructure các tham số query (Giữ nguyên)
  const {
    page,
    limit,
    keyword,
    level,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = queryParams;

  // 3. Validation cho Sort (Giữ nguyên)
  // (Đảm bảo 'allowedSortFields' khớp với các trường trong 'courseTutorViewProjection')
  const allowedSortFields = [
    "createdAt",
    "name",
    "price",
    "ratings",
    "purchased",
  ];
  if (!allowedSortFields.includes(sortBy)) {
    throw new ErrorHandler(
      `Giá trị của sortBy không hợp lệ. Chỉ chấp nhận: ${allowedSortFields.join(
        ", "
      )}.`,
      400
    );
  }

  // 4. Xây dựng Filter ($match) (Giữ nguyên)
  const baseFilter: { [key: string]: any } = {
    creatorId: new mongoose.Types.ObjectId(tutorId),
  };
  if (level) {
    baseFilter.level = level;
  }
  const keywordFilter = createKeywordSearchFilter(keyword, [
    "name",
    "description",
    "tags",
  ]);
  const finalFilter = { ...baseFilter, ...keywordFilter };

  // 5. Xây dựng đối tượng Sort (Giữ nguyên)
  const sortOptions: SortOptions = {
    [sortBy]: sortOrder === "asc" ? 1 : -1,
  };

  // --- 6. Aggregation Pipeline (Đã được đơn giản hóa) ---

  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 10;
  const skip = (pageNum - 1) * limitNum;

  // Xây dựng Pipeline
  const pipeline: any[] = [
    // Stage 1: Lọc
    { $match: finalFilter },

    {
      $lookup: {
        // Tên collection của Category model (thường là số nhiều)
        from: "categories",
        localField: "categories", // Trường trong 'course' model
        foreignField: "_id", // Trường trong 'category' model
        as: "categories", // Ghi đè (overwrite) lên trường 'categories'
      },
    },

    // Stage 2: Chọn lọc và tính toán (SỬ DỤNG PROJECTION ĐÃ ĐỊNH NGHĨA)
    { $project: courseTutorViewProjection }, // <-- THAY ĐỔI CHÍNH

    // Stage 3: Sắp xếp
    { $sort: sortOptions },

    // Stage 4: Phân trang
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limitNum }],
        metadata: [{ $count: "totalDocs" }],
      },
    },
  ];

  // Thực thi pipeline
  const results = await courseModel.aggregate(pipeline);

  // 7. Trả về kết quả (đã được định kiểu mạnh)

  if (!results[0] || !results[0].data || results[0].data.length === 0) {
    return {
      data: [], // Kiểu trả về là ICourseTutorViewDto[]
      pagination: {
        totalDocs: 0,
        limit: limitNum,
        page: pageNum,
        totalPages: 0,
      },
    };
  }

  // Ép kiểu 'data' về DTO của chúng ta
  const data: ICourseTutorViewDto[] = results[0].data;
  const totalDocs = results[0].metadata[0].totalDocs;
  const totalPages = Math.ceil(totalDocs / limitNum);

  const pagination = {
    totalDocs,
    limit: limitNum,
    page: pageNum,
    totalPages,
  };

  // Kiểu trả về bây giờ khớp với IPaginatedTutorCourseResult
  return { data, pagination };
};
