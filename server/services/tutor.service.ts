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
import { paginate, PaginationParams } from "../utils/pagination.helper"; // Import the helper
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

export const getTutorDetailsService = async (tutorId: string) => {
  const id = new mongoose.Types.ObjectId(tutorId);

  const tutorDetails = await courseModel.aggregate([
    // Giai đoạn 1: Lọc tất cả các khóa học của giảng viên này
    {
      $match: {
        creatorId: id,
      },
    },
    // Giai đoạn 2: Nhóm các khóa học lại và tính toán các chỉ số
    {
      $group: {
        _id: "$creatorId", // Nhóm theo ID của người tạo
        totalStudents: { $sum: "$purchased" }, // Tính tổng số lượt mua
        totalCourses: { $sum: 1 }, // Mỗi khóa học đếm là 1
        totalReviews: { $sum: { $size: "$reviews" } }, // Tính tổng số review từ các mảng review
        averageRating: { $avg: "$ratings" }, // Tính rating trung bình
      },
    },
    // Giai đoạn 3: Kết nối (JOIN) với collection 'users' để lấy thông tin cá nhân
    {
      $lookup: {
        from: "users", // Tên collection của User trong MongoDB (thường là số nhiều)
        localField: "_id",
        foreignField: "_id",
        as: "creatorInfo",
      },
    },
    // Giai đoạn 4: 'creatorInfo' là một mảng, ta chỉ cần phần tử đầu tiên
    {
      $unwind: "$creatorInfo",
    },
    // Giai đoạn 5: Chọn và định dạng lại các trường cần thiết cho kết quả cuối cùng
    {
      $project: {
        _id: 0, // Bỏ trường _id mặc định
        name: "$creatorInfo.name",
        avatar: {
          url: "$creatorInfo.avatar.url",
        },
        bio: "$creatorInfo.bio", // Giả sử bạn có trường bio trong user model
        totalStudents: 1, // Giữ lại trường đã tính toán
        totalCourses: 1,
        totalReviews: 1,
        averageRating: { $round: ["$averageRating", 1] }, // Làm tròn rating đến 1 chữ số thập phân
      },
    },
  ]);

  // Aggregation trả về một mảng, ta chỉ cần phần tử đầu tiên
  // Nếu giảng viên chưa có khóa học nào, mảng sẽ rỗng
  if (tutorDetails.length === 0) {
    // Nếu không có khóa học, ta vẫn trả về thông tin cơ bản của user
    const user = await userModel
      .findById(tutorId)
      .select("name avatar.url bio");
    return {
      name: user?.name,
      avatar: {
        url: user.avatar?.url || "",
      },
      bio: user?.bio,
      totalStudents: 0,
      totalCourses: 0,
      totalReviews: 0,
      averageRating: 0,
    };
  }

  return tutorDetails[0];
};
