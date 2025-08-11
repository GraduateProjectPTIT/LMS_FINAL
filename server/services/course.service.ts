import { Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import CourseModel from "../models/course.model";
import LayoutModel from "../models/layout.model";
import cloudinary from "cloudinary";
import mongoose from "mongoose";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notification.model";
import userModel from "../models/user.model";

import ErrorHandler from "../utils/ErrorHandler";

// create course
export const createCourse = async (
  data: any,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!data.name) {
      console.log("Course name is missing");
      return next(new ErrorHandler("Course name is required", 400));
    }

    if (!data.description) {
      console.log("Course description is missing");
      return next(new ErrorHandler("Course description is required", 400));
    }

    if (!data.price) {
      console.log("Course price is missing");
      return next(new ErrorHandler("Course price is required", 400));
    }

    if (data.categories) {
      const layoutData = await LayoutModel.findOne({ type: "Categories" });
      if (!layoutData) {
        return next(new ErrorHandler("Categories layout not found", 404));
      }

      const existingCategories = layoutData.categories.map((cat: any) =>
        cat.title.toLowerCase()
      );
      const courseCategory = data.categories.toLowerCase();

      if (!existingCategories.includes(courseCategory)) {
        return next(
          new ErrorHandler(
            `Category "${data.categories
            }" does not exist. Available categories: ${existingCategories.join(
              ", "
            )}`,
            400
          )
        );
      }

      data.categories =
        data.categories.charAt(0).toUpperCase() +
        data.categories.slice(1).toLowerCase();
    }

    const course = await CourseModel.create(data);

    console.log("Course created successfully:", course._id);
    res.status(201).json({
      success: true,
      course,
    });
  } catch (error: any) {
    console.error("Create course error:", error);
    return next(new ErrorHandler(error.message, 500));
  }
};

// edit course
export const editCourseService = async (
  courseId: string,
  data: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const findCourse = await CourseModel.findById(courseId);

    if (!findCourse) {
      return next(new ErrorHandler("Course not found", 404));
    }

    const availableCourseThumbnail = findCourse?.thumbnail;

    if (data.thumbnail && data.thumbnail !== availableCourseThumbnail?.url) {
      if (availableCourseThumbnail?.public_id) {
        await cloudinary.v2.uploader.destroy(
          availableCourseThumbnail.public_id
        );
      }

      const myCloud = await cloudinary.v2.uploader.upload(data.thumbnail, {
        folder: "courses",
        width: 500,
        height: 300,
        crop: "fill",
      });

      data.thumbnail = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    } else {
      data.thumbnail = availableCourseThumbnail;
    }

    // Check if category exists in Layout and format it
    if (data.categories) {
      const layoutData = await LayoutModel.findOne({ type: "Categories" });
      if (!layoutData) {
        return next(new ErrorHandler("Categories layout not found", 404));
      }

      const existingCategories = layoutData.categories.map((cat: any) =>
        cat.title.toLowerCase()
      );
      const courseCategory = data.categories.toLowerCase();

      if (!existingCategories.includes(courseCategory)) {
        return next(
          new ErrorHandler(
            `Category "${data.categories
            }" does not exist. Available categories: ${existingCategories.join(
              ", "
            )}`,
            400
          )
        );
      }

      data.categories =
        data.categories.charAt(0).toUpperCase() +
        data.categories.slice(1).toLowerCase();
    }

    const course = await CourseModel.findByIdAndUpdate(
      courseId,
      { $set: data },
      { new: true }
    );

    res.status(201).json({
      success: true,
      course,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// get course overview
export const getCourseOverviewService = async (
  courseId: string,
  res: Response,
  next: NextFunction
) => {
  try {
    const course = await CourseModel.findById(courseId)
      .populate("reviews.userId", "name avatar")
      .populate("reviews.replies.userId", "name avatar");

    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }

    const totalSections = course.courseData.length;
    let totalLectures = 0;
    let totalTimeMinutes = 0;

    const sections = course.courseData.map((section: any) => {
      const lectures = section.sectionContents.map((lecture: any) => ({
        title: lecture.videoTitle,
        time: lecture.videoLength, // minutes
      }));

      const sectionTotalLectures = lectures.length;
      const sectionTotalTime = lectures.reduce(
        (acc: number, curr: any) => acc + (curr.time || 0),
        0
      );

      totalLectures += sectionTotalLectures;
      totalTimeMinutes += sectionTotalTime;

      return {
        sectionTitle: section.sectionTitle,
        totalLectures: sectionTotalLectures,
        totalTime: sectionTotalTime,
        lectures,
      };
    });

    const formatTime = (minutes: number) => {
      if (minutes < 60) {
        return `${minutes}m`;
      }
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
    };

    const courseData = {
      _id: course._id,
      name: course.name,
      description: course.description,
      categories: course.categories,
      price: course.price,
      estimatedPrice: course.estimatedPrice,
      level: course.level,
      tags: course.tags,
      demoUrl: course.demoUrl,
      thumbnail: course.thumbnail,
      benefits: course.benefits,
      prerequisites: course.prerequisites,
      totalSections,
      totalLectures,
      totalTime: formatTime(totalTimeMinutes),
      sections: sections.map((section: any) => ({
        sectionTitle: section.sectionTitle,
        totalLectures: section.totalLectures,
        totalTime: formatTime(section.totalTime),
        lectures: section.lectures.map((lecture: any) => ({
          title: lecture.title,
          time: formatTime(lecture.time),
        })),
      })),
      reviews: course.reviews.map((review: any) => ({
        _id: review._id,
        user: {
          _id: review.userId._id,
          name: review.userId.name,
          avatar: review.userId.avatar,
        },
        rating: review.rating,
        comment: review.comment,
        replies: review.replies.map((reply: any) => ({
          _id: reply._id,
          user: {
            _id: reply.userId._id,
            name: reply.userId.name,
            avatar: reply.userId.avatar,
          },
          answer: reply.answer,
          createdAt: reply.createdAt,
          updatedAt: reply.updatedAt,
        })),
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      })),
    };

    res.status(200).json({
      success: true,
      courseData,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// get all courses
export const getAllCoursesService = async (res: Response) => {
  const courses = await CourseModel.find()
    .select("-courseData.sectionContents")
    .populate("reviews.userId", "name avatar")
    .sort({ createAt: -1 });

  res.status(200).json({
    success: true,
    courses,
  });
};

// enroll course
export const enrollCourseService = async (
  courseId: string,
  userId: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const isEnrolled = userId?.courses?.some(
      (c: any) => c.courseId.toString() === courseId
    );

    if (!isEnrolled && userId?.role !== "admin") {
      return next(
        new ErrorHandler("You are not eligible to access this course", 500)
      );
    }

    const course = await CourseModel.findById(courseId)
      .populate("courseData.sectionContents.lectureQuestions.userId", "name avatar")
      .populate("courseData.sectionContents.lectureQuestions.replies.userId", "name avatar")
      .populate("reviews.userId", "name avatar")
      .populate("reviews.replies.userId", "name avatar");

    res.status(200).json({
      success: true,
      course: course,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// search courses
export const searchCoursesService = async (
  query: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      query: searchQuery,
      category,
      level,
      priceMin,
      priceMax,
      sort,
    } = query;

    // Build the filter object
    const filter: any = {};

    // Add text search if query exists
    if (searchQuery) {
      const regexPattern = new RegExp(searchQuery as string, "i");

      // Check if query is a valid ObjectId
      const isValidObjectId = mongoose.Types.ObjectId.isValid(
        searchQuery as string
      );

      const searchConditions: any[] = [
        { name: { $regex: regexPattern } },
        { description: { $regex: regexPattern } },
        { categories: { $regex: regexPattern } },
        { tags: { $regex: regexPattern } },
        { level: { $regex: regexPattern } },
      ];

      if (isValidObjectId) {
        searchConditions.push({ _id: searchQuery });
      }

      filter.$or = searchConditions;
    }

    // Add category filter if exists
    if (category) {
      filter.categories = { $regex: new RegExp(category as string, "i") };
    }

    // Add level filter if exists
    if (level) {
      filter.level = { $regex: new RegExp(level as string, "i") };
    }

    // Add price range filter if exists
    if (priceMin || priceMax) {
      filter.price = {};
      if (priceMin) filter.price.$gte = Number(priceMin);
      if (priceMax) filter.price.$lte = Number(priceMax);
    }

    // Determine sort order
    let sortOption = {};
    if (sort) {
      switch (sort) {
        case "price_asc":
          sortOption = { price: 1 };
          break;
        case "price_desc":
          sortOption = { price: -1 };
          break;
        case "newest":
          sortOption = { createdAt: -1 };
          break;
        case "oldest":
          sortOption = { createdAt: 1 };
          break;
        case "popular":
          sortOption = { purchased: -1 };
          break;
        case "rating":
          sortOption = { ratings: -1 };
          break;
        default:
          sortOption = { createdAt: -1 }; // Default to newest
      }
    } else {
      sortOption = { createdAt: -1 }; // Default to newest
    }

    // Find courses with the filter and sort options
    const courses = await CourseModel.find(filter)
      .select(
        "_id name description categories price estimatedPrice thumbnail tags level demoUrl rating purchased createdAt"
      )
      .sort(sortOption);

    res.status(200).json({
      success: true,
      courses,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// add question
export const addQuestionService = async (
  questionData: any,
  userId: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { question, courseId, contentId } = questionData;
    const course = await CourseModel.findById(courseId);

    if (!course) return next(new ErrorHandler("Course not found", 404));

    // Check if user is enrolled in this course
    const isEnrolled = userId?.courses?.some(
      (c: any) => c.courseId.toString() === courseId
    );

    if (!isEnrolled && userId?.role !== "admin") {
      return next(
        new ErrorHandler(
          "You must be enrolled in this course to ask questions",
          403
        )
      );
    }

    const section = course?.courseData.find((sec: any) =>
      sec.sectionContents.some((cont: any) => cont._id.equals(contentId))
    );

    const content = section?.sectionContents.find((cont: any) =>
      cont._id.equals(contentId)
    );

    if (!content) return next(new ErrorHandler("Content not found", 404));

    // create a new question object
    const newQuestion: any = {
      userId: userId?._id,
      question,
      replies: [],
    };

    // add this question to our course content
    content.lectureQuestions.push(newQuestion);

    await NotificationModel.create({
      userId: userId?._id,
      title: "New Question",
      message: `You have a new question in section: ${section?.sectionTitle}`,
    });

    // save the updated course
    await course?.save();

    res.status(200).json({
      success: true,
      message: "Ask question successfully",
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// add answer
export const addAnswerService = async (
  answerData: any,
  userId: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { answer, courseId, contentId, questionId } = answerData;
    const course = await CourseModel.findById(courseId);

    if (!course) return next(new ErrorHandler("Course not found", 404));

    // Check if user is enrolled in this course
    const isEnrolled = userId?.courses?.some(
      (c: any) => c.courseId.toString() === courseId
    );

    if (!isEnrolled && userId?.role !== "admin") {
      return next(
        new ErrorHandler(
          "You must be enrolled in this course to answer questions",
          403
        )
      );
    }

    const section = course?.courseData.find((sec: any) =>
      sec.sectionContents.some((cont: any) => cont._id.equals(contentId))
    );

    const content = section?.sectionContents.find((cont: any) =>
      cont._id.equals(contentId)
    );

    if (!content) return next(new ErrorHandler("Content not found", 404));

    const question = content?.lectureQuestions.find((q: any) =>
      q._id.equals(questionId)
    );

    if (!question) return next(new ErrorHandler("Question not found", 404));

    const askedUser = await userModel.findById(question.userId);

    if (!askedUser || !askedUser.email) {
      return next(new ErrorHandler("User email not found", 404));
    }

    const reply: any = {
      userId: userId?._id,
      answer,
    };

    // add this question to our course content
    question.replies?.push(reply);

    // save the updated course
    await course?.save();

    const data = {
      name: askedUser.name,
      title: section?.sectionTitle,
    };

    const html = await ejs.renderFile(
      path.join(__dirname, "../mails/question-reply.ejs"),
      data
    );

    try {
      await sendMail({
        email: askedUser.email,
        subject: "Question Reply",
        template: "question-reply.ejs",
        data,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }

    res.status(200).json({
      success: true,
      message: "Reply question successfully",
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// add review
export const addReviewService = async (
  courseId: string,
  reviewData: any,
  userId: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { review, rating } = reviewData;

    const isEnrolled = userId?.courses?.some(
      (c: any) => c.courseId === courseId
    );

    if (!isEnrolled && userId?.role !== "admin") {
      return next(
        new ErrorHandler("You are not eligible to review this course", 403)
      );
    }

    const course = await CourseModel.findById(courseId);

    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }

    const reviewDataObj: any = {
      userId: userId?._id,
      rating,
      comment: review,
      replies: [],
    };

    course?.reviews.push(reviewDataObj);

    // make avarage rating
    let avg = 0;
    course?.reviews.forEach((rev: any) => {
      avg += rev.rating;
    });
    if (course) {
      course.ratings = avg / course.reviews.length;
    }

    await course?.save();

    await NotificationModel.create({
      userId: userId?._id,
      title: "New Review Received",
      message: `${userId?.name} has given a review in ${course?.name}`,
    });

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// add reply to review
export const addReplyToReviewService = async (
  replyData: any,
  userId: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { comment, courseId, reviewId } = replyData;

    const course = await CourseModel.findById(courseId);

    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }

    // Check if user is enrolled in this course
    const isEnrolled = userId?.courses?.some(
      (c: any) => c.courseId.toString() === courseId
    );

    if (!isEnrolled && userId?.role !== "admin") {
      return next(
        new ErrorHandler(
          "You must be enrolled in this course to reply to reviews",
          403
        )
      );
    }

    const review = course?.reviews?.find(
      (rev: any) => rev._id.toString() === reviewId
    );

    if (!review) {
      return next(new ErrorHandler("Review of the course not found", 404));
    }

    const replyDataObj: any = {
      userId: userId?._id,
      answer: comment,
    };

    review.replies?.push(replyDataObj);

    await course?.save();

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// delete course
export const deleteCourseService = async (
  courseId: string,
  res: Response,
  next: NextFunction
) => {
  try {
    const course = await CourseModel.findById(courseId);

    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }

    await CourseModel.findByIdAndDelete(courseId);

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// get all courses for admin
export const adminGetAllCoursesService = async (res: Response) => {
  const courses = await CourseModel.find()
    .populate("reviews.userId", "name avatar")
    .sort({ createAt: -1 });

  res.status(200).json({
    success: true,
    courses,
  });
};
