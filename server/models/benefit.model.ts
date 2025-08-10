import mongoose, { Document, Model, Schema } from "mongoose";

export interface IBenefit extends Document {
    title: string;
}

const benefitSchema = new Schema<IBenefit>(
    {
        title: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const BenefitModel: Model<IBenefit> = mongoose.model("Benefit", benefitSchema);

export default BenefitModel;
