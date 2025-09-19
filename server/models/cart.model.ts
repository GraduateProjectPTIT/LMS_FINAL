import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICartItem {
  courseId: mongoose.Types.ObjectId;
  addedAt?: Date;
}

export interface ICart extends Document {
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  savedForLater: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>({
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  addedAt: { type: Date, default: Date.now },
});

const CartSchema = new Schema<ICart>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  items: { type: [CartItemSchema], default: [] },
  savedForLater: { type: [CartItemSchema], default: [] },
}, { timestamps: true });

const CartModel: Model<ICart> = mongoose.model<ICart>("Cart", CartSchema);
export default CartModel;
