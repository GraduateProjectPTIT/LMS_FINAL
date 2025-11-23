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
        userId: studentId, // Chỉ lọc các đơn hàng theo userId
      },
    },
    {
      $group: {
        _id: null, // Nhóm tất cả đơn hàng của user này lại
        total: { $sum: "$total" }, // Tính tổng dựa trên trường 'total'
      },
    },
  ]); // Nếu không có kết quả (chưa mua gì), trả về 0

  return result.length > 0 ? result[0].total : 0;
};

export const orderRepository = {
  getTotalSpentByStudent,
};
