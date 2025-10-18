import express from "express";
import {
  authorizeRoles,
  checkOwnership,
  isAuthenticated,
} from "../middleware/auth";
import {
  addAnswer,
  addQuestion,
  addReplyToReview,
  addReview,
  deleteCourse,
  editCourse,
  enrollCourse,
  getCourseOverview,
  searchCourses,
  createCourseController,
  getAllCategories,
  getAllLevels,
  generateUploadSignature,
  markLectureCompleted,
  getTutorCourses,
  getStudentEnrolledCourses,
  getAdminCourses,
  getCourseStudents,
  updateLectureVideo,
  getOwnerSingleCourse,
  getTopPurchasedCourses,
  getTopRatedCourses,
  checkUserPurchasedCourse,
  getStudentDetailsInCourse,
} from "../controllers/course.controller";
import CourseModel from "../models/course.model";
const courseRouter = express.Router();

courseRouter.post(
  "/course/create_course",
  isAuthenticated,
  authorizeRoles("admin", "tutor"),
  createCourseController
);
courseRouter.put(
  "/course/update_course/:id",
  isAuthenticated,
  authorizeRoles("admin", "tutor"),
  checkOwnership(CourseModel),
  editCourse
);
courseRouter.get("/course/overview/:id", getCourseOverview);
courseRouter.get(
  "/course/data/:id",
  isAuthenticated,
  authorizeRoles("admin", "tutor"),
  checkOwnership(CourseModel),
  getOwnerSingleCourse
);
courseRouter.get("/course/enroll/:id", isAuthenticated, enrollCourse);
courseRouter.get(
  "/course/:id/students",
  isAuthenticated,
  authorizeRoles("admin", "tutor"),
  checkOwnership(CourseModel),
  getCourseStudents
);
courseRouter.get(
  "/course/tutor/my_courses",
  isAuthenticated,
  authorizeRoles("tutor", "admin"),
  getTutorCourses
);
courseRouter.get(
  "/course/student/enrolled_courses",
  isAuthenticated,
  getStudentEnrolledCourses
);

courseRouter.get("/course/top-purchased", getTopPurchasedCourses);
courseRouter.get("/course/top-rated", getTopRatedCourses);

courseRouter.get(
  "/course/:id/has-purchased",
  isAuthenticated,
  checkUserPurchasedCourse
);
courseRouter.put(
  "/course/add_question_to_lecture",
  isAuthenticated,
  addQuestion
);
courseRouter.put(
  "/course/add_answer_to_lecture_question",
  isAuthenticated,
  addAnswer
);
courseRouter.put(
  "/course/complete_lecture",
  isAuthenticated,
  markLectureCompleted
);
courseRouter.put(
  "/course/update_lecture_video",
  isAuthenticated,
  authorizeRoles("admin", "tutor"),
  checkOwnership(CourseModel),
  updateLectureVideo
);
courseRouter.put("/course/add_review/:id", isAuthenticated, addReview);
courseRouter.put(
  "/course/add_review_answer",
  isAuthenticated,
  addReplyToReview
);
courseRouter.get(
  "/course/admin/courses",
  isAuthenticated,
  authorizeRoles("admin"),
  getAdminCourses
);
courseRouter.delete(
  "/course/delete_course/:id",
  isAuthenticated,
  authorizeRoles("admin", "tutor"),
  checkOwnership(CourseModel),
  deleteCourse
);
courseRouter.get("/course/search", searchCourses);
courseRouter.get("/course/categories", getAllCategories);
courseRouter.get("/course/levels", getAllLevels);

courseRouter.get(
  "/course/generate-upload-signature",
  isAuthenticated,
  authorizeRoles("admin", "tutor"),
  generateUploadSignature
);

courseRouter.get(
  "/courses/:courseId/students/:studentId",
  isAuthenticated,
  authorizeRoles("tutor", "admin"),
  getStudentDetailsInCourse
);

export default courseRouter;
