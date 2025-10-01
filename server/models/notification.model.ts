import mongoose, { Document, Model, Schema } from "mongoose";
import { IUser } from "./user.model";

export interface CreateNotificationInput {
  userId: string; // Chỉ cần ID của user dưới dạng string
  title: string;
  message: string;
}

export interface INotification extends Document {
  title: string;
  message: string;
  status: string;
  userId: IUser;
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
  },
  { timestamps: true }
);

const NotificationModel: Model<INotification> = mongoose.model(
  "Notification",
  notificationSchema
);

export default NotificationModel;
