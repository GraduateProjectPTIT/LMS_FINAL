import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPost extends Document {
  title: string;
  slug: string;
  contentHtml: string;
  excerpt?: string;
  shortDescription?: string;
  coverImage?: {
    public_id: string;
    url: string;
  };
  tags: string[];
  status: "draft" | "published";
  authorId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    contentHtml: { type: String, required: true },
    excerpt: { type: String },
    shortDescription: { type: String },
    coverImage: {
      public_id: { type: String },
      url: { type: String },
    },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

postSchema.pre("validate", function (next) {
  if (!this.slug && this.title) {
    this.slug = String(this.title)
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }
  next();
});

const PostModel = mongoose.model<IPost>("Post", postSchema);
export default PostModel;
