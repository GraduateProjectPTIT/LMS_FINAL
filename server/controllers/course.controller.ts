import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import {
  createCourse,
  editCourseService,
  getCourseOverviewService,
  getAllCoursesService,
  adminGetAllCoursesService,
  enrollCourseService,
  searchCoursesService,
  addQuestionService,
  addAnswerService,
  addReviewService,
  addReplyToReviewService,
  deleteCourseService,
  getAllCategoriesService,
  getAllLevelsService,
  generateUploadSignatureService,
  markLectureCompletedService,
} from "../services/course.service";
import cloudinary from "cloudinary";
import {
  IAddQuestionData,
  IAddAnswerData,
  IAddReviewData,
  IAddReviewReplyData,
} from "../interfaces/course.interface";

// upload course
export const createCourseController = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      console.log("Received data:", JSON.stringify(data, null, 2));

      if (req.user) {
        data.creatorId = req.user._id;
      } else {
        return next(new ErrorHandler("User not authenticated", 401));
      }

      // If thumbnail exists, upload to Cloudinary
      if (
        data.thumbnail &&
        typeof data.thumbnail === "string" &&
        (data.thumbnail.startsWith("data:") ||
          data.thumbnail.startsWith("http"))
      ) {
        console.log("Uploading thumbnail to Cloudinary...");
        try {
          const myCloud = await cloudinary.v2.uploader.upload(data.thumbnail, {
            folder: "courses",
            width: 500,
            height: 300,
            crop: "fill",
          });

          console.log("Cloudinary upload successful:", myCloud.public_id);
          data.thumbnail = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        } catch (uploadError: any) {
          console.error("Cloudinary upload error:", uploadError);
          return next(
            new ErrorHandler(
              "Error uploading thumbnail: " + uploadError.message,
              500
            )
          );
        }
      }

      console.log("Calling createCourse service...");
      createCourse(data, res, next);
    } catch (error: any) {
      console.error("Course upload error:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// edit course
export const editCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const courseId = req.params.id;

      // If thumbnail exists, upload to Cloudinary
      if (
        data.thumbnail &&
        typeof data.thumbnail === "string" &&
        (data.thumbnail.startsWith("data:") ||
          data.thumbnail.startsWith("http"))
      ) {
        try {
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
        } catch (uploadError: any) {
          console.error("Cloudinary upload error:", uploadError);
          return next(
            new ErrorHandler(
              "Error uploading thumbnail: " + uploadError.message,
              500
            )
          );
        }
      }

      editCourseService(courseId, data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get single course (no purchase required => only show global information)
export const getCourseOverview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      getCourseOverviewService(courseId, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get all courses (no purchase required)
export const getAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllCoursesService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get full course content (for user who have purchase the course and admins only)
export const enrollCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      enrollCourseService(courseId, req.user, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// search courses
export const searchCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      searchCoursesService(req.query, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add question in each lecture
export const addQuestion = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const questionData: IAddQuestionData = req.body;
      addQuestionService(questionData, req.user, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add answer in each lecture
export const addAnswer = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const answerData: IAddAnswerData = req.body;
      addAnswerService(answerData, req.user, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add course review -- only for user who purchase the course and admin
export const addReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const reviewData: IAddReviewData = req.body;
      addReviewService(courseId, reviewData, req.user, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// add reply in course review
export const addReplyToReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const replyData: IAddReviewReplyData = req.body;
      addReplyToReviewService(replyData, req.user, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// delete course
export const deleteCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      deleteCourseService(courseId, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get all courses for admin
export const adminGetAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      adminGetAllCoursesService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getAllCategories = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    getAllCategoriesService(res, next);
  }
);

export const getAllLevels = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    getAllLevelsService(res, next);
  }
);

export const generateUploadSignature = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await generateUploadSignatureService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const markLectureCompleted = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, lectureId } = req.body || {};
      if (!courseId || !lectureId) {
        return next(new ErrorHandler("courseId and lectureId are required", 400));
      }
      await markLectureCompletedService(req.user, { courseId, lectureId }, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
