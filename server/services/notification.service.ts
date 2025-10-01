import { Response } from "express";
import cron from "node-cron";
import NotificationModel, {
  CreateNotificationInput,
  INotification,
} from "../models/notification.model";
import { IUser } from "../models/user.model";
import notificationModel from "../models/notification.model";
import { sendEventToUser } from "../utils/sseManager";

// --- Phần quản lý Real-time SSE ---

// Biến này sẽ lưu trữ tất cả các client đang kết nối SSE
// Key là ID của user, Value là đối tượng Response của Express
const connectedClients = new Map<string, Response>();

/**
 * Thêm một client mới vào danh sách đang kết nối SSE.
 * @param userId - ID của người dùng.
 * @param res - Đối tượng Response của Express để giữ kết nối.
 */
export const addSseClient = (userId: string, res: Response): void => {
  connectedClients.set(userId, res);
  console.log(
    `SSE Client connected: ${userId}. Total clients: ${connectedClients.size}`
  );
};

/**
 * Xóa một client khỏi danh sách khi họ ngắt kết nối.
 * @param userId - ID của người dùng.
 */
export const removeSseClient = (userId: string): void => {
  connectedClients.delete(userId);
  console.log(
    `SSE Client disconnected: ${userId}. Total clients: ${connectedClients.size}`
  );
};

export const sendNotificationToUser = (
  userId: string,
  notification: INotification
): void => {
  const clientRes = connectedClients.get(userId);

  if (clientRes) {
    clientRes.write(`event: new_notification\n`);
    clientRes.write(`data: ${JSON.stringify(notification)}\n\n`);
    console.log(`Sent SSE notification to user ${userId}`);
  }
};

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

  return { notifications, total };
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

export const createNotificationService = async (
  data: CreateNotificationInput
) => {
  const { userId, title, message } = data;

  // 1. Lưu thông báo vào cơ sở dữ liệu (như code cũ)
  const notification = await notificationModel.create({
    userId,
    title,
    message,
  });

  // 2. GỌI SSE MANAGER ĐỂ ĐẨY THÔNG BÁO REAL-TIME
  // Dữ liệu đẩy đi có thể là toàn bộ object notification
  try {
    sendEventToUser(userId, {
      type: "NEW_NOTIFICATION",
      payload: notification,
    });
  } catch (error) {
    // Việc gửi SSE thất bại không nên làm hỏng cả tiến trình
    console.error("Lỗi khi gửi thông báo SSE:", error);
  }

  return notification;
};
// --- Phần công việc chạy nền (Cron Job) ---

const deleteOldNotifications = async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await NotificationModel.deleteMany({
      status: "read",
      createdAt: { $lt: thirtyDaysAgo }, // Sửa lỗi typo từ 'createAt'
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
