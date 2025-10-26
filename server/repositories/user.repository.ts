import mongoose, { Types } from "mongoose";
import userModel, { IUser } from "../models/user.model";
import { IStudent } from "../types/user.types";
// Import OrderModel và các interface liên quan
import orderModel, { IOrder, IOrderItem } from "../models/order.model";

const findUserDetailById = async (
  userId: string | Types.ObjectId
): Promise<IUser | null> => {
  return userModel
    .findById(userId)
    .select("-password -resetToken -activationCode -activationToken")
    .exec();
};

const findSimpleById = async (id: Types.ObjectId) =>
  userModel.findById(id).select("_id").lean();

// --- CÁC HÀM ĐÃ SỬA ---

/**
 * Lấy danh sách các khóa học đã mua của người dùng từ 'orderModel'.
 * Hàm này xử lý cả hai trường hợp: order có 'courseId' (mua lẻ)
 * và order có 'items' (mua qua giỏ hàng).
 */
const findUserPurchases = async (
  userId: mongoose.Types.ObjectId
): Promise<{ purchasedCourses: mongoose.Types.ObjectId[] } | null> => {
  const userIdString = userId.toString();

  // 1. Lấy các order mua lẻ (dùng courseId)
  const singleCourseOrders = await orderModel
    .find({
      userId: userIdString,
      courseId: { $exists: true, $ne: null },
    })
    .select("courseId")
    .lean();

  // 2. Lấy các order mua qua giỏ hàng (dùng items)
  const cartOrders = await orderModel
    .find({
      userId: userIdString,
      items: { $exists: true, $ne: [] },
    })
    .select("items.courseId") // Giả định IOrderItem có trường courseId
    .lean();

  const purchasedSet = new Set<string>();

  // Thêm từ order lẻ
  singleCourseOrders.forEach((order) => {
    if (order.courseId) {
      purchasedSet.add(order.courseId.toString());
    }
  });

  // Thêm từ order giỏ hàng
  cartOrders.forEach((order) => {
    // Đảm bảo order.items là một mảng trước khi lặp
    if (Array.isArray(order.items)) {
      order.items.forEach((item: IOrderItem) => {
        // Giả định kiểu IOrderItem
        if (item.courseId) {
          purchasedSet.add(item.courseId.toString());
        }
      });
    }
  });

  // 3. Chuyển Set (chuỗi) thành mảng các ObjectId
  const purchasedCourses = Array.from(purchasedSet).map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  return { purchasedCourses };
};

// Export thành một đối tượng để dễ dàng import
export const userRepository = {
  findUserDetailById,
  findSimpleById,
  findUserPurchases, // Đã sửa
};
