import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICourse extends Document {
  name: string;
  description: string;
  categories: mongoose.Types.ObjectId[];
  price: number;
  estimatedPrice?: number;
  thumbnail: {
    public_id?: string;
    url?: string;
  };
  tags: string;
  level: string;
  videoDemo: {
    public_id: string;
    url: string;
  };
  benefits: { title: string }[];
  prerequisites: { title: string }[];
  reviews: ICourseReview[];
  courseData: ICourseSection[];
  ratings?: number;
  purchased: number;
  creatorId: mongoose.Types.ObjectId;
}

interface ICourseReview extends Document {
  userId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  replies: IReviewReply[];
}

interface IReviewReply extends Document {
  userId: mongoose.Types.ObjectId;
  answer: string;
}

interface ICourseSection extends Document {
  sectionTitle: string;
  sectionContents: ICourseLecture[];
}

interface ICourseLecture extends Document {
  videoTitle: string;
  videoDescription: string;
  video: {
    public_id: string;
    url: string;
  };
  videoLength: number;
  videoLinks: ILink[];
  lectureQuestions: ILectureQuestion[];
}

interface ILink extends Document {
  title: string;
  url: string;
}

interface ILectureQuestion extends Document {
  userId: mongoose.Types.ObjectId;
  question: string;
  replies: IQuestionReply[];
}

interface IQuestionReply extends Document {
  userId: mongoose.Types.ObjectId;
  answer: string;
}

// SCHEMAS

const questionReplySchema = new Schema<IQuestionReply>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    answer: { type: String, required: true },
  },
  { timestamps: true }
);

const lectureQuestionSchema = new Schema<ILectureQuestion>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: String, required: true },
    replies: [questionReplySchema], // this is only for lecture questions
  },
  { timestamps: true }
);

const reviewReplySchema = new Schema<IReviewReply>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
  video: {
    public_id: { type: String, required: true },
    url: { type: String, required: true },
  },
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
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category",
        required: true,
      },
    ],
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
    videoDemo: {
      public_id: { type: String, required: true },
      url: { type: String, required: true },
    },
    benefits: [{ title: String }],
    prerequisites: [{ title: String }],
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
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const CourseModel: Model<ICourse> = mongoose.model("Course", courseSchema);

export default CourseModel;
