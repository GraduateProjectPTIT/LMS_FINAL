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

/**
 * Thực thi truy vấn aggregate phức tạp trên 'orderModel' để tìm các đề xuất
 * dựa trên Lọc cộng tác (Item-Based).
 */
const getCollaborativeFilteringAggregation = async (
  currentUserId: mongoose.Types.ObjectId,
  userPurchasedCourses: mongoose.Types.ObjectId[],
  limit: number
): Promise<any[]> => {
  // Do dữ liệu nằm trong 'orderModel' (dạng transaction log),
  // chúng ta cần một pipeline phức tạp để:
  // 1. Chuẩn hóa dữ liệu về dạng { userId, courseId }
  // 2. Group theo userId để tạo lại 'purchasedCourses' array cho MỖI user
  // 3. Áp dụng logic lọc cộng tác (giống như logic cũ)

  const pipeline: any[] = [
    // --- Giai đoạn 1: Chuẩn hóa Orders ---
    // Tạo ra một luồng dữ liệu { userId, courseId }
    {
      $facet: {
        // Lấy từ trường 'courseId'
        fromCourseId: [
          { $match: { courseId: { $exists: true, $ne: null } } },
          {
            $project: {
              userId: "$userId",
              courseId: { $toObjectId: "$courseId" }, // Đảm bảo là ObjectId
            },
          },
        ],
        // Lấy từ trường 'items'
        fromItems: [
          { $match: { items: { $exists: true, $ne: [] } } },
          { $unwind: "$items" },
          {
            $project: {
              userId: "$userId",
              courseId: "$items.courseId", // Giả định 'items.courseId' là ObjectId
            },
          },
        ],
      },
    },
    // Gộp 2 luồng dữ liệu
    {
      $project: {
        allOrders: { $concatArrays: ["$fromCourseId", "$fromItems"] },
      },
    },
    { $unwind: "$allOrders" },
    { $replaceRoot: { newRoot: "$allOrders" } },

    // --- Giai đoạn 2: Xây dựng lại User-Item Matrix ---
    // Bây giờ chúng ta có dữ liệu dạng: { userId: "...", courseId: ... }
    {
      $group: {
        _id: "$userId", // Group theo userId
        purchasedCourses: { $addToSet: "$courseId" }, // Tạo mảng khóa học duy nhất
      },
    },

    // --- Giai đoạn 3: Áp dụng Lọc cộng tác (giống logic cũ) ---
    // Chuyển _id (userId string) thành ObjectId để so sánh
    {
      $project: {
        _id: { $toObjectId: "$_id" },
        purchasedCourses: 1,
      },
    },
    // 3.1: Tìm tất cả người dùng KHÁC
    {
      $match: {
        _id: { $ne: currentUserId },
      },
    },
    // 3.2: Tìm người dùng đã mua ÍT NHẤT MỘT khóa học giống bạn
    {
      $match: {
        purchasedCourses: { $in: userPurchasedCourses },
      },
    },
    // 3.3: "Mở" mảng purchasedCourses của HỌ ra
    {
      $unwind: "$purchasedCourses",
    },
    // 3.4: Loại bỏ các khóa học bạn ĐÃ sở hữu
    {
      $match: {
        purchasedCourses: { $nin: userPurchasedCourses },
      },
    },
    // 3.5: Đếm số lần xuất hiện (điểm tương đồng)
    {
      $group: {
        _id: "$purchasedCourses",
        recommendationScore: { $sum: 1 },
      },
    },
    // 3.6: Sắp xếp
    {
      $sort: { recommendationScore: -1 },
    },
    // 3.7: Giới hạn
    {
      $limit: limit,
    },
    // 3.8: Lấy thông tin chi tiết khóa học
    {
      $lookup: {
        from: "courses",
        localField: "_id",
        foreignField: "_id",
        as: "courseDetails",
      },
    },
    // 3.9: Định dạng lại output
    {
      $unwind: "$courseDetails",
    },
    {
      $project: {
        _id: "$courseDetails._id",
        name: "$courseDetails.name",
        thumbnail: "$courseDetails.thumbnail",
        price: "$courseDetails.price",
        ratings: "$courseDetails.ratings",
        score: "$recommendationScore",
      },
    },
  ];

  // Chạy aggregation trên 'orderModel'
  return orderModel.aggregate(pipeline);
};
// --- KẾT THÚC CÁC HÀM SỬA ---

// Export thành một đối tượng để dễ dàng import
export const userRepository = {
  findUserDetailById,
  findSimpleById,
  findUserPurchases, // Đã sửa
  getCollaborativeFilteringAggregation, // Đã sửa
};
