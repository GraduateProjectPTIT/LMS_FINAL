import mongoose from "mongoose";
import { courseRepository } from "../repositories/course.repository";
import { userRepository } from "../repositories/user.repository";

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
      return courseRepository.getColdStartRecommendations(currentUserId, limit);
    }

    console.log(
      `User ${currentUserId} has purchases, using PRECOMPUTED filtering...`
    );
    const userPurchasedCourses = userPurchases.purchasedCourses;

    return courseRepository.getPrecomputedRecommendations(
      userPurchasedCourses,
      limit
    );
  } catch (error) {
    console.error("Error in getRecommendationsForUser service:", error);
    throw new Error("Could not retrieve recommendations.");
  }
};
export const recommendationService = {
  getRecommendationsForUser,
};
