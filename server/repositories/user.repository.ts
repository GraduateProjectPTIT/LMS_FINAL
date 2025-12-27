import mongoose, { Types } from "mongoose";
import userModel, { IUser } from "../models/user.model";
import orderModel, { IOrderItem } from "../models/order.model";
import { studentModel } from "../models/student.model";
import { tutorModel } from "../models/tutor.model";
import { adminModel } from "../models/admin.model";

// --- FIND METHODS ---

const findById = async (id: string | Types.ObjectId) => {
  return userModel.findById(id);
};

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

const findUserWithPassword = async (userId: string) => {
  return userModel.findById(userId).select("+password");
};

// --- UPDATE METHODS ---

const updateUserRole = async (userId: string, role: string) => {
  return userModel.findByIdAndUpdate(userId, { role }, { new: true });
};

const updateNotificationSettings = async (
  userId: string,
  updateFields: any
) => {
  return userModel.findByIdAndUpdate(
    userId,
    { $set: updateFields },
    { new: true }
  );
};

// --- DELETE METHODS ---

const deleteUser = async (userId: string) => {
  // Vì trong service dùng user.deleteOne() để kích hoạt middleware (nếu có)
  // Nhưng nếu muốn xóa nhanh thì dùng deleteOne({_id: userId}).
  // Để tương thích với logic cũ (lấy user instance rồi xóa), ta có thể tìm rồi xóa,
  // hoặc dùng findByIdAndDelete. Ở đây dùng findByIdAndDelete cho gọn.
  return userModel.findByIdAndDelete(userId);
};

/**
 * Helper để xóa các profile liên quan (Student/Tutor/Admin)
 * Việc này giúp Service không phải import các Model con.
 */
const deleteRelatedProfile = async (
  role: string,
  profileId: string | Types.ObjectId
) => {
  switch (role) {
    case "student": // UserRole.Student
      return studentModel.findByIdAndDelete(profileId);
    case "tutor": // UserRole.Tutor
      return tutorModel.findByIdAndDelete(profileId);
    case "admin": // UserRole.Admin
      return adminModel.findByIdAndDelete(profileId);
    default:
      return null;
  }
};

// --- QUERY PHỨC TẠP (Logic cũ của bạn giữ nguyên) ---

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

// Export repository object
export const userRepository = {
  findById,
  findUserDetailById,
  findSimpleById,
  findUserWithPassword,
  updateUserRole,
  updateNotificationSettings,
  deleteUser,
  deleteRelatedProfile,
  findUserPurchases,
};
