import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  title: string;
}

const categorySchema = new Schema<ICategory>({
  title: {
    type: String,
    required: true,
    unique: true,
  },
});

const CategoryModel = mongoose.model<ICategory>("Category", categorySchema);

export default CategoryModel;
