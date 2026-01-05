import { Types } from "mongoose";
import orderModel from "../models/order.model";

const getTotalSpentByStudent = async (
  studentId: Types.ObjectId
): Promise<number> => {
  const result = await orderModel.aggregate([
    {
      $match: {
        userId: studentId,
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$total" },
      },
    },
  ]);

  return result.length > 0 ? result[0].total : 0;
};

export const orderRepository = {
  getTotalSpentByStudent,
};
