import mongoose, { Document, Model, Schema } from "mongoose";
import { IUser } from "./user.model";

export interface CreateNotificationInput {
  userId: string; // Chỉ cần ID của user dưới dạng string
  title: string;
  message: string;
  link?: string; // URL liên kết đến tài nguyên cụ thể (nếu có)
}

export interface INotification extends Document {
  title: string;
  message: string;
  status: string;
  userId: IUser;
  link?: string;
}

const notificationSchema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "unread",
    },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    link: {
      type: String, // Sẽ lưu URL, ví dụ: "/course-access/654b.../lecture/654c..."
      required: false, // Không phải thông báo nào cũng có link
    },
  },
  { timestamps: true }
);

const NotificationModel: Model<INotification> = mongoose.model(
  "Notification",
  notificationSchema
);

export default NotificationModel;
