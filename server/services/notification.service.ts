// src/services/notification.service.ts

import cron from "node-cron";
import NotificationModel, {
  CreateNotificationInput,
  INotification,
} from "../models/notification.model";
import { IUser } from "../models/user.model";
import notificationModel from "../models/notification.model";
import { sendEventToUser } from "../utils/sseManager";

// --- Phần xử lý logic nghiệp vụ và tương tác DB ---

export const getAllNotificationsService = async (): Promise<
  INotification[]
> => {
  return NotificationModel.find().sort({ createdAt: -1 });
};

export const getUserNotificationsService = async (options: {
  userId: string;
  filter: any;
  page: number;
  limit: number;
}) => {
  const { userId, filter, page, limit } = options;
  const findFilter = { userId, ...filter };

  const [notifications, total] = await Promise.all([
    NotificationModel.find(findFilter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    NotificationModel.countDocuments(findFilter),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return {
    data: notifications,
    meta: {
      totalItems: total,
      totalPages,
      currentPage: page,
      pageSize: limit,
    },
  };
};

export const markNotificationAsReadService = async (
  notificationId: string,
  user: IUser
): Promise<INotification | null> => {
  const notification = await NotificationModel.findById(notificationId);
  if (!notification) {
    return null; // Controller sẽ xử lý việc ném lỗi 404
  }

  // Kiểm tra quyền: người dùng phải là chủ sở hữu hoặc admin
  const isOwner = notification.userId?.toString() === user._id?.toString();
  const isAdmin = user.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new Error("Forbidden"); // Controller sẽ xử lý việc ném lỗi 403
  }

  if (notification.status !== "read") {
    notification.status = "read";
    await notification.save();
  }
  return notification;
};

export const markAllNotificationsAsReadService = async (userId: string) => {
  const result = await NotificationModel.updateMany(
    { userId, status: { $ne: "read" } },
    { $set: { status: "read" } }
  );
  return result.modifiedCount;
};

export const createAndSendNotification = async (
  data: CreateNotificationInput
) => {
  // 1. Gọi hàm service cũ để lưu vào DB
  const notification = await createNotificationService(data);

  // 2. Gửi sự kiện real-time qua SSE Manager
  try {
    sendEventToUser(data.userId, "NEW_NOTIFICATION", notification);
  } catch (sseError) {
    console.error("Lỗi khi gửi thông báo SSE:", sseError);
    // Việc gửi SSE thất bại không nên làm hỏng logic chính
  }

  return notification;
};

export const createNotificationService = async (
  data: CreateNotificationInput
) => {
  const { userId, title, message, link } = data;

  // 1. Chỉ lưu thông báo vào cơ sở dữ liệu
  const notification = await notificationModel.create({
    userId,
    title,
    message,
    link,
  });

  // 2. Việc gửi SSE đã được chuyển cho Controller xử lý
  return notification;
};

// --- Phần công việc chạy nền (Cron Job) ---

const deleteOldNotifications = async () => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const result = await NotificationModel.deleteMany({
      status: "read",
      createdAt: { $lt: sixMonthsAgo },
    });
    if (result.deletedCount > 0) {
      console.log(
        `Cron job: Deleted ${result.deletedCount} old read notifications.`
      );
    }
  } catch (error) {
    console.error("Error during cron job for deleting notifications:", error);
  }
};

// Lên lịch chạy vào lúc nửa đêm mỗi ngày.
cron.schedule("0 0 0 * * *", deleteOldNotifications, {
  timezone: "Asia/Ho_Chi_Minh",
});

console.log("Cron job for deleting old notifications has been scheduled.");
