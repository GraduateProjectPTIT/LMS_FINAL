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
    const userPurchases = await userRepository.findUserPurchases(currentUserId);

    if (
      !userPurchases ||
      !userPurchases.purchasedCourses ||
      userPurchases.purchasedCourses.length === 0
    ) {
      // Kịch bản 1: Cold-Start (Giữ nguyên)
      return courseRepository.getColdStartRecommendations(currentUserId, limit);
    }

    // Kịch bản 2: Collaborative Filtering (ĐÃ THAY ĐỔI)
    console.log(
      `User ${currentUserId} has purchases, using PRECOMPUTED filtering...`
    );
    const userPurchasedCourses = userPurchases.purchasedCourses;

    // --- THAY ĐỔI DUY NHẤT LÀ Ở ĐÂY ---
    // Gọi hàm mới, nhanh hơn
    return courseRepository.getPrecomputedRecommendations(
      userPurchasedCourses,
      limit
    );
    // --- HẾT THAY ĐỔI ---
  } catch (error) {
    console.error("Error in getRecommendationsForUser service:", error);
    throw new Error("Could not retrieve recommendations.");
  }
};
// Export thành một đối tượng chứa tất cả các hàm service của bạn
export const recommendationService = {
  getRecommendationsForUser,

  // Thêm các hàm recommendation khác vào đây nếu có
};
