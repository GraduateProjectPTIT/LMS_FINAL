import express from "express"
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { addAnswer, addQuestion, addReplyToReview, addReview, deleteCourse, editCourse, getAdminCourses, getAllCourses, getCourseByUser, getSingleCourse, searchCourses, uploadCourse } from "../controllers/course.controller";
const courseRouter = express.Router()

courseRouter.post("/course/create_course", isAuthenticated, authorizeRoles("admin"), uploadCourse);
courseRouter.put("/course/update_course/:id", isAuthenticated, authorizeRoles("admin"), editCourse);
courseRouter.get("/course/get_single_course/:id", getSingleCourse);
courseRouter.get("/course/get_all_courses", getAllCourses);
courseRouter.get("/course/get_course_content/:id", isAuthenticated, getCourseByUser);
courseRouter.put("/course/add_question_to_lecture", isAuthenticated, addQuestion);
courseRouter.put("/course/add_answer_to_lecture_question", isAuthenticated, addAnswer);
courseRouter.put("/course/add_review/:id", isAuthenticated, addReview);
courseRouter.put("/course/add_review_answer", isAuthenticated, authorizeRoles("admin"), addReplyToReview);
courseRouter.get("/course/get_admin_courses", isAuthenticated, authorizeRoles("admin"), getAdminCourses);
courseRouter.delete("/course/delete_course/:id", isAuthenticated, authorizeRoles("admin"), deleteCourse);
courseRouter.get("/course/search_course", searchCourses);

export default courseRouter
