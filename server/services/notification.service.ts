import cron from "node-cron";
import {
  INotification,
  CreateNotificationInput,
} from "../models/notification.model";
import { IUser } from "../models/user.model";
import { sendEventToUser } from "../utils/sseManager";
import { notificationRepository } from "../repositories/notification.repostitory";

// --- Xử lý logic nghiệp vụ ---

export const getAllNotificationsService = async (): Promise<
  INotification[]
> => {
  return notificationRepository.findAll();
};

export const getUserNotificationsService = async (options: {
  userId: string;
  filter: any;
  page: number;
  limit: number;
}) => {
  const { userId, filter, page, limit } = options;
  const findFilter = { userId, ...filter };
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    notificationRepository.findByUser(findFilter, skip, limit),
    notificationRepository.countByUser(findFilter),
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
  // 1. Tìm thông báo từ repo
  const notification = await notificationRepository.findById(notificationId);

  if (!notification) {
    return null;
  }

  // 2. Logic kiểm tra quyền (Business Logic)
  const isOwner = notification.userId?.toString() === user._id?.toString();
  const isAdmin = user.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new Error("Forbidden");
  }

  // 3. Cập nhật trạng thái
  if (notification.status !== "read") {
    notification.status = "read";
    await notificationRepository.save(notification);
  }

  return notification;
};

export const markAllNotificationsAsReadService = async (userId: string) => {
  const result = await notificationRepository.markAllAsRead(userId);
  return result.modifiedCount;
};

// --- Tạo và Gửi thông báo (Phối hợp Repo & SSE) ---

export const createNotificationService = async (
  data: CreateNotificationInput
) => {
  // Gọi repository để tạo
  return notificationRepository.create(data);
};

export const createAndSendNotification = async (
  data: CreateNotificationInput
) => {
  // 1. Lưu vào DB
  const notification = await createNotificationService(data);

  // 2. Gửi sự kiện real-time
  try {
    sendEventToUser(data.userId, "NEW_NOTIFICATION", notification);
  } catch (sseError) {
    console.error("Lỗi khi gửi thông báo SSE:", sseError);
  }

  return notification;
};

// --- Cron Job (Logic chạy nền) ---

const deleteOldNotifications = async () => {
  try {
    // Logic tính toán ngày tháng nằm ở Service
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Gọi repository để thực hiện xóa
    const result = await notificationRepository.deleteOldReadNotifications(
      sixMonthsAgo
    );

    if (result.deletedCount > 0) {
      console.log(
        `Cron job: Deleted ${result.deletedCount} old read notifications.`
      );
    }
  } catch (error) {
    console.error("Error during cron job for deleting notifications:", error);
  }
};

// Lên lịch chạy xóa mỗi ngày lúc 12h đêm với notification có date quá 6 tháng
cron.schedule("0 0 0 * * *", deleteOldNotifications, {
  timezone: "Asia/Ho_Chi_Minh",
});

console.log("Cron job for deleting old notifications has been scheduled.");
