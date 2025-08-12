import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPaymentInfo {
    transaction_id?: string;
    amount: number;
    currency: string;
    status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
    payer_email?: string;
    payer_name?: string;
    payment_intent_id?: string;
    paid_at?: Date;
    expires_at?: Date;
    refund_status?: 'none' | 'partial' | 'full';
    metadata?: Record<string, any>;
}

export interface IOrder extends Document {
    courseId: string;
    userId: string;
    payment_info: IPaymentInfo;
    payment_method: string;
}

const orderSchema = new Schema<IOrder>(
    {
        courseId: {
            type: String,
            required: true,
        },
        userId: {
            type: String,
            required: true,
        },
        payment_info: {
            type: Object,
        },
        payment_method: {
            type: String,
            required: true,
            default: 'stripe'
        },
    },
    { timestamps: true }
);

const OrderModel: Model<IOrder> = mongoose.model<IOrder>("Order", orderSchema);

export default OrderModel;