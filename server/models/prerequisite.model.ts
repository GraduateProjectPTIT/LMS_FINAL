import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPrerequisite extends Document {
    title: string;
    description?: string;
    isRequired: boolean;
}

const prerequisiteSchema = new Schema<IPrerequisite>(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        isRequired: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const PrerequisiteModel: Model<IPrerequisite> = mongoose.model("Prerequisite", prerequisiteSchema);

export default PrerequisiteModel;
