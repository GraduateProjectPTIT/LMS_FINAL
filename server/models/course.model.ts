import mongoose, { Document, Model, Schema } from "mongoose";
import { IUser } from "./user.model";
import { IBenefit } from "./benefit.model";
import { IPrerequisite } from "./prerequisite.model";

export interface ICourse extends Document {
    name: string;
    description: string;
    categories: string;
    price: number;
    estimatedPrice?: number;
    thumbnail: {
        public_id?: string;
        url?: string;
    };
    tags: string;
    level: string;
    demoUrl: string;
    benefits: IBenefit[];
    prerequisites: IPrerequisite[];
    reviews: ICourseReview[];
    courseData: ICourseSection[];
    ratings?: number;
    purchased: number;
}

interface ICourseReview extends Document {
    userId: mongoose.Types.ObjectId; // Đổi từ user thành userId
    rating: number;
    comment: string;
    replies: IReviewReply[];
}

interface IReviewReply extends Document {
    userId: mongoose.Types.ObjectId; // Đổi từ user thành userId
    answer: string;
}

interface ICourseSection extends Document {
    sectionTitle: string;
    sectionContents: ICourseLecture[];
}

interface ICourseLecture extends Document {
    videoTitle: string;
    videoDescription: string;
    videoUrl: string;
    videoLength: number;
    videoLinks: ILink[];
    lectureQuestions: ILectureQuestion[];
}

interface ILink extends Document {
    title: string;
    url: string;
}

interface ILectureQuestion extends Document {
    userId: mongoose.Types.ObjectId; // Đổi từ user thành userId
    question: string;
    replies: IQuestionReply[];
}

interface IQuestionReply extends Document {
    userId: mongoose.Types.ObjectId; // Đổi từ user thành userId
    answer: string;
}

// SCHEMAS

const questionReplySchema = new Schema<IQuestionReply>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Đổi từ user thành userId
        answer: { type: String, required: true },
    },
    { timestamps: true }
);

const lectureQuestionSchema = new Schema<ILectureQuestion>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Đổi từ user thành userId
        question: { type: String, required: true },
        replies: [questionReplySchema], // this is only for lecture questions
    },
    { timestamps: true }
);

const reviewReplySchema = new Schema<IReviewReply>(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        answer: { type: String, required: true },
    },
    { timestamps: true }
);

const courseReviewSchema = new Schema<ICourseReview>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        rating: { type: Number, default: 0 },
        comment: { type: String },
        replies: [reviewReplySchema],
    },
    { timestamps: true }
);

const linkSchema = new Schema<ILink>({
    title: String,
    url: String,
});

const courseLectureSchema = new Schema<ICourseLecture>({
    videoTitle: { type: String, required: true },
    videoDescription: { type: String, required: true },
    videoUrl: { type: String, required: true },
    videoLength: { type: Number, required: true },
    videoLinks: [linkSchema],
    lectureQuestions: [lectureQuestionSchema],
});

const courseSectionSchema = new Schema<ICourseSection>({
    sectionTitle: { type: String, required: true },
    sectionContents: [courseLectureSchema],
});

const courseSchema = new Schema<ICourse>(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        categories: {
            type: String,
            // required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        estimatedPrice: {
            type: Number,
        },
        thumbnail: {
            public_id: {
                type: String,
            },
            url: {
                type: String,
            },
        },
        tags: {
            type: String,
            required: true,
        },
        level: {
            type: String,
            required: true,
        },
        demoUrl: {
            type: String,
            required: true,
        },
        benefits: [{ type: Schema.Types.ObjectId, ref: "Benefit" }],
        prerequisites: [{ type: Schema.Types.ObjectId, ref: "Prerequisite" }],
        reviews: [courseReviewSchema],
        courseData: [courseSectionSchema],
        ratings: {
            type: Number,
            default: 0,
        },
        purchased: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

const CourseModel: Model<ICourse> = mongoose.model("Course", courseSchema);

export default CourseModel;