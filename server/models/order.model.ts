import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPaymentInfo {
    id?: string;
    transaction_id?: string;
    amount: number;
    currency: string;
    status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
    payer_email?: string;
    payer_name?: string;
    payment_intent_id?: string;
    payer_id?: string;
    order_token?: string;
    paid_at?: Date;
    expires_at?: Date;
    refund_status?: 'none' | 'partial' | 'full';
    metadata?: Record<string, any>;
}

export interface IOrderItem {
    courseId: string;
    price: number;
}

export interface IOrder extends Document {
    courseId?: string;
    items?: IOrderItem[];
    total?: number;
    userId: mongoose.Types.ObjectId | string;
    payment_info: IPaymentInfo;
    payment_method: string;
    emailSent?: boolean;
    notificationSent?: boolean;
}

const orderSchema = new Schema<IOrder>(
    {
        courseId: {
            type: String,
            required: false,
        },
        items: [
            {
                courseId: { type: String, required: true },
                price: { type: Number, required: true },
            },
        ],
        total: { type: Number },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
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
        emailSent: {
            type: Boolean,
            default: false,
        },
        notificationSent: { 
            type: Boolean, 
            default: false 
        },
    },
    { timestamps: true }
);

orderSchema.index({ 'payment_info.order_token': 1, payment_method: 1 }, { unique: true, sparse: true });

const OrderModel: Model<IOrder> = mongoose.model<IOrder>("Order", orderSchema);

export default OrderModel;