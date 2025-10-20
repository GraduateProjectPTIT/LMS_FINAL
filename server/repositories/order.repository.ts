import { Types } from "mongoose";
import orderModel from "../models/order.model";

/**
 * Tính tổng số tiền một student đã chi trả thành công.
 */
const getTotalSpentByStudent = async (
  studentId: Types.ObjectId
): Promise<number> => {
  const result = await orderModel.aggregate([
    {
      $match: {
        userId: studentId,
        status: "succeeded", // Chỉ tính đơn hàng thành công
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$totalAmount" }, // Tên trường tổng tiền
      },
    },
  ]);

  // Nếu không có kết quả (chưa mua gì), trả về 0
  return result.length > 0 ? result[0].total : 0;
};

export const orderRepository = {
  getTotalSpentByStudent,
};
