import { Types } from "mongoose";
import ErrorHandler from "../utils/ErrorHandler";
import { IUpdateStudentInterestDto, IStudent } from "../types/user.types";
import { IUserResponse } from "../types/auth.types";
import { _toUserResponse } from "./auth.service"; // Hoặc import từ helper tương ứng

// Import Repositories
import { studentRepository } from "../repositories/student.repository";
import { userRepository } from "../repositories/user.repository";
import userModel from "../models/user.model";

// Định nghĩa Type cho Response
type IStudentDataObject = ReturnType<IStudent["toObject"]>;
export type ICombinedStudentUserResponse = IStudentDataObject & IUserResponse;

export const updateStudentInterestService = async (
  userId: string,
  data: IUpdateStudentInterestDto
): Promise<ICombinedStudentUserResponse> => {
  const { interests } = data;

  // 1. Validate Input cơ bản
  if (!interests) {
    throw new ErrorHandler("Interests field is required.", 400);
  }

  // 2. Lấy dữ liệu từ 2 Repository song song
  const [user, studentProfile] = await Promise.all([
    userRepository.findById(userId),
    studentRepository.findByUserId(userId),
  ]);

  // 3. Kiểm tra tồn tại
  if (!user || !studentProfile) {
    throw new ErrorHandler("User or Student profile not found.", 404);
  }

  // 4. Validate Interest IDs (Logic nghiệp vụ: ID gửi lên phải tồn tại trong DB)
  if (interests.length > 0) {
    const categoryCount = await studentRepository.countValidCategories(
      interests
    );
    if (categoryCount !== interests.length) {
      throw new ErrorHandler("One or more interest IDs are invalid.", 400);
    }
  }

  // 5. Cập nhật trạng thái User (Survey Completed)
  // Nếu user chưa hoàn thành survey thì cập nhật
  if (user.isSurveyCompleted === false) {
    await userModel.findByIdAndUpdate(userId, { isSurveyCompleted: true });

    // Cập nhật biến local để trả về response đúng ngay lập tức
    user.isSurveyCompleted = true;
  }

  // 6. Cập nhật Student Profile (Interests)
  // Ép kiểu sang ObjectId của Mongoose
  const objectIdInterests = interests as unknown as Types.ObjectId[];

  const populatedProfile = await studentRepository.updateInterests(
    studentProfile,
    objectIdInterests
  );

  // 7. Xử lý logic Transform dữ liệu (Mapping response)
  // Logic này giữ nguyên như code cũ của bạn để đảm bảo Frontend không bị lỗi

  // Lấy ra mảng các title của interests
  let interestTitles: string[] = [];
  if (populatedProfile && populatedProfile.interests) {
    interestTitles = (populatedProfile.interests as any[])
      .filter((i) => i)
      .map((category) => category.title);
  }

  // Chuẩn bị User Response DTO
  const userResponse = _toUserResponse(user);

  // Chuẩn bị Student Response DTO (bỏ userId thừa vì đã có trong userResponse)
  const { userId: removedUserId, ...restOfProfile } =
    populatedProfile.toObject();

  // Kết hợp lại
  const combinedResponse = {
    ...restOfProfile,
    ...userResponse,
    interests: interestTitles, // Ghi đè interests (ObjectId[]) bằng interests (string[])
  };

  return combinedResponse as ICombinedStudentUserResponse;
};
