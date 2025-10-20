import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import {
  createCourse,
  editCourseService,
  getCourseOverviewService,
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
  getTutorCoursesService,
  getStudentEnrolledCoursesService,
  getCourseStudentsService,
  getAdminCoursesService,
  updateLectureVideoService,
  getOwnerSingleCourseService,
  getTopPurchasedCoursesService,
  getTopRatedCoursesService,
  checkUserPurchasedCourseService,
  getStudentDetailsInCourseService,
} from "../services/course.service";
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

      console.log("Calling createCourse service...");
      createCourse(data, res, next);
    } catch (error: any) {
      console.error("Course upload error:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get top purchased courses
export const getTopPurchasedCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await getTopPurchasedCoursesService(req.query, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get top rated courses
export const getTopRatedCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await getTopRatedCoursesService(req.query, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// check if user purchased a course
export const checkUserPurchasedCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      await checkUserPurchasedCourseService(req.user, courseId, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getCourseStudents = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      await getCourseStudentsService(courseId, res, next, req.query);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getTutorCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await getTutorCoursesService(req.user, req.query, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getStudentEnrolledCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await getStudentEnrolledCoursesService(req.user, req.query, res, next);
    } catch (error: any) {
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

// get course for edit (admin/tutor only; route ensures ownership/roles)
export const getOwnerSingleCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      await getOwnerSingleCourseService(courseId, res, next);
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
export const getAdminCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAdminCoursesService(req.query, res);
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
        return next(
          new ErrorHandler("courseId and lectureId are required", 400)
        );
      }
      await markLectureCompletedService(
        req.user,
        { courseId, lectureId },
        res,
        next
      );
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// update lecture video
export const updateLectureVideo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, lectureId, video, videoLength } = req.body || {};
      if (!courseId || !lectureId || !video) {
        return next(
          new ErrorHandler("courseId, lectureId and video are required", 400)
        );
      }
      await updateLectureVideoService(
        req.user,
        { courseId, lectureId, video, videoLength },
        res,
        next
      );
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getStudentDetailsInCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { courseId, studentId } = req.params;
    const tutorId = req.user?._id.toString();

    if (!tutorId) {
      return next(new ErrorHandler("Authentication required", 401));
    }

    // Chỉ cần gọi service đã được tối ưu
    const student = await getStudentDetailsInCourseService(
      courseId,
      studentId,
      tutorId
    );

    res.status(200).json({
      success: true,
      student,
    });
  }
);
