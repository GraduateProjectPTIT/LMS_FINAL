import express from "express"
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { addAnswer, addQuestion, addReplyToReview, addReview, deleteCourse, editCourse, getAllCourses, adminGetAllCourses, enrollCourse, getCourseOverview, searchCourses, createCourseController } from "../controllers/course.controller";
const courseRouter = express.Router()

courseRouter.post("/course/create_course", isAuthenticated, authorizeRoles("admin"), createCourseController);
courseRouter.put("/course/update_course/:id", isAuthenticated, authorizeRoles("admin"), editCourse);
courseRouter.get("/course/overview/:id", getCourseOverview);
courseRouter.get("/course/get_all_courses", getAllCourses);
courseRouter.get("/course/enroll/:id", isAuthenticated, enrollCourse);
courseRouter.put("/course/add_question_to_lecture", isAuthenticated, addQuestion);
courseRouter.put("/course/add_answer_to_lecture_question", isAuthenticated, addAnswer);
courseRouter.put("/course/add_review/:id", isAuthenticated, addReview);
courseRouter.put("/course/add_review_answer", isAuthenticated, addReplyToReview);
courseRouter.get("/course/get_admin_courses", isAuthenticated, authorizeRoles("admin"), adminGetAllCourses);
courseRouter.delete("/course/delete_course/:id", isAuthenticated, authorizeRoles("admin"), deleteCourse);
courseRouter.get("/course/search", searchCourses);

export default courseRouter
