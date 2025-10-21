import mongoose from "mongoose";

// Import trực tiếp các đối tượng repository
// (Giả sử chúng được export const từ file .repository.ts)
import { courseRepository } from "../repositories/course.repository";
import { userRepository } from "../repositories/user.repository";

/**
 * Lấy các khóa học đề xuất cho người dùng.
 * Tự động quyết định dùng "cold-start" hay "collaborative filtering"
 * dựa trên lịch sử mua hàng của người dùng.
 */
const getRecommendationsForUser = async (
  userId: string | mongoose.Types.ObjectId,
  limit: number = 10
): Promise<any[]> => {
  const currentUserId = new mongoose.Types.ObjectId(userId.toString());

  try {
    // 1. Kiểm tra lịch sử mua hàng (sử dụng userRepository đã import)
    // Giả định userRepository đã được cập nhật để dùng orderModel
    const userPurchases = await userRepository.findUserPurchases(currentUserId);
    console.log(userPurchases);
    // 2. Quyết định logic nghiệp vụ
    // Kiểm tra nếu không có lịch sử mua hàng hoặc mảng rỗng
    if (
      !userPurchases ||
      !userPurchases.purchasedCourses ||
      userPurchases.purchasedCourses.length === 0
    ) {
      // Kịch bản 1: Cold-Start
      console.log(
        `User ${currentUserId} has no purchases, falling back to cold-start...`
      );

      // Sử dụng courseRepository đã import
      // Giả định courseRepository đã được cập nhật để dùng studentModel
      return courseRepository.getColdStartRecommendations(currentUserId, limit);
    }

    // Kịch bản 2: Collaborative Filtering
    console.log(
      `User ${currentUserId} has purchases, using collaborative filtering...`
    );
    const userPurchasedCourses = userPurchases.purchasedCourses;

    // Sử dụng userRepository đã import
    return userRepository.getCollaborativeFilteringAggregation(
      currentUserId,
      userPurchasedCourses,
      limit
    );
  } catch (error) {
    console.error("Error in getRecommendationsForUser service:", error);
    // Xử lý lỗi một cách rõ ràng
    throw new Error("Could not retrieve recommendations.");
  }
};

// Export thành một đối tượng chứa tất cả các hàm service của bạn
export const recommendationService = {
  getRecommendationsForUser,
  // Thêm các hàm recommendation khác vào đây nếu có
};
