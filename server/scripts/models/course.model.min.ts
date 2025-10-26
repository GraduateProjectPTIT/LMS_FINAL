import mongoose, { Document, Model, Schema } from "mongoose";

// Interface tối giản
export interface IMinCourse extends Document {
  name: string;
  price: number;
}

const minCourseSchema = new Schema<IMinCourse>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
  },
  {
    strict: false,
  }
);

// Bạn có thể không cần export model này,
// nó chủ yếu để định nghĩa cấu trúc cho script Python
const MinCourseModel: Model<IMinCourse> = mongoose.model(
  "Course",
  minCourseSchema
);
export default MinCourseModel;
