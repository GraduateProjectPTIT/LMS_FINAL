import NotificationModel, {
  CreateNotificationInput,
  INotification,
} from "../models/notification.model";

const findAll = async (): Promise<INotification[]> => {
  return NotificationModel.find().sort({ createdAt: -1 });
};

const findById = async (id: string) => {
  return NotificationModel.findById(id);
};

const findByUser = async (filter: any, skip: number, limit: number) => {
  return NotificationModel.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

const countByUser = async (filter: any) => {
  return NotificationModel.countDocuments(filter);
};

const create = async (data: CreateNotificationInput) => {
  return NotificationModel.create(data);
};

const save = async (notification: any) => {
  return notification.save();
};

const markAllAsRead = async (userId: string) => {
  return NotificationModel.updateMany(
    { userId, status: { $ne: "read" } },
    { $set: { status: "read" } }
  );
};

const deleteOldReadNotifications = async (dateThreshold: Date) => {
  return NotificationModel.deleteMany({
    status: "read",
    createdAt: { $lt: dateThreshold },
  });
};

export const notificationRepository = {
  findAll,
  findById,
  findByUser,
  countByUser,
  create,
  save,
  markAllAsRead,
  deleteOldReadNotifications,
};
