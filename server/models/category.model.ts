// file: category.model.ts

import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  title: string;
}

const categorySchema = new Schema<ICategory>({
  title: {
    type: String,
    required: true,
    unique: true, // Nên có để đảm bảo các danh mục không trùng nhau
  },
});

const CategoryModel = mongoose.model<ICategory>("Category", categorySchema);

export default CategoryModel;
