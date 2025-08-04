import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import { createCourse, getAllCoursesService } from "../services/course.service";
import cloudinary from "cloudinary";
import mongoose from "mongoose";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import CourseModel from "../models/course.model";
import { redis } from "../utils/redis";
import NotificationModel from "../models/notification.model";
import userModel from "../models/user.model";


// upload course
export const uploadCourse = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = req.body;
            const thumbnail = data.thumbnail;

            if (thumbnail?.public_id) {
                return res.status(200).json({ message: "Thumbnail already uploaded" });
            }

            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder: "courses",
                width: 500,
                height: 300,
                crop: "fill"
            });

            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };

            createCourse(data, res, next);
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// edit course
export const editCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;

        const courseId = req.params.id;

        const findCourse = await CourseModel.findById(courseId);

        if (!findCourse) {
            return next(new ErrorHandler("Course not found", 404));
        }

        const availableCourseThumbnail = findCourse?.thumbnail;

        if (thumbnail && thumbnail !== availableCourseThumbnail?.url) {
            if (availableCourseThumbnail?.public_id) {
                await cloudinary.v2.uploader.destroy(availableCourseThumbnail.public_id);
            }

            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder: "courses",
                width: 500,
                height: 300,
                crop: "fill"
            });

            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        } else {
            data.thumbnail = availableCourseThumbnail;
        }

        const course = await CourseModel.findByIdAndUpdate(
            courseId,
            {
                $set: data,
            },
            { new: true }
        );

        await redis.del("allCourses");

        res.status(201).json({
            success: true,
            course,
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})

// get single course (no purchase required => only show global information)
export const getSingleCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const courseId = req.params.id;

        const course = await CourseModel.findById(courseId).populate("reviews.user", "name");

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
            const sectionTotalTime = lectures.reduce((acc: number, curr: any) => acc + (curr.time || 0), 0);

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
                user: review.user.name,
                rating: review.rating,
                comment: review.comment,
                replies: review.replies,
                createdAt: review.createdAt,
                updatedAt: review.updatedAt,
            }))
        };

        res.status(200).json({
            success: true,
            courseData,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})

// get all courses (no purchase required)
export const getAllCourses = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const courses = await CourseModel.find().select(
            "-courseData.sectionContents"
        );

        await redis.set("allCourses", JSON.stringify(courses));

        res.status(200).json({
            success: true,
            courses,
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})

// get full course content (for user who have purchase the course and admins only)
export const getCourseByUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const courseId = req.params.id;

        const isEnrolled = req.user?.courses?.some((c: any) => c.courseId.toString() === courseId);

        if (!isEnrolled && req.user?.role !== "admin") {
            return next(
                new ErrorHandler("You are not eligible to access this course", 500)
            );
        }

        const course = await CourseModel.findById(courseId);

        res.status(200).json({
            success: true,
            course: course
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

export const searchCourses = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = req.query.query as string;

        if (!query) {
            return next(new ErrorHandler("Search query is required", 400));
        }

        // Create a regex pattern for case-insensitive search
        const regexPattern = new RegExp(query, 'i');

        // Check if query is a valid ObjectId
        const isValidObjectId = mongoose.Types.ObjectId.isValid(query);

        const searchConditions: any[] = [
            { name: { $regex: regexPattern } },
            { categories: { $regex: regexPattern } },
            { tags: { $regex: regexPattern } },
            { level: { $regex: regexPattern } }
        ];

        if (isValidObjectId) {
            searchConditions.push({ _id: query });
        }

        const courses = await CourseModel.find({
            $or: searchConditions
        }).select("_id name description categories price estimatedPrice thumbnail tags level demoUrl rating purchased createdAt");

        res.status(200).json({
            success: true,
            courses,
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})

export const advancedSearchCourses = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { query, category, level, priceMin, priceMax, sort } = req.query;

        // Build the filter object
        const filter: any = {};

        // Add text search if query exists
        if (query) {
            const regexPattern = new RegExp(query as string, 'i');
            filter.$or = [
                { name: { $regex: regexPattern } },
                { description: { $regex: regexPattern } },
                { tags: { $regex: regexPattern } }
            ];
        }

        // Add category filter if exists
        if (category) {
            filter.categories = { $regex: new RegExp(category as string, 'i') };
        }

        // Add level filter if exists
        if (level) {
            filter.level = { $regex: new RegExp(level as string, 'i') };
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
                case 'price_asc':
                    sortOption = { price: 1 };
                    break;
                case 'price_desc':
                    sortOption = { price: -1 };
                    break;
                case 'newest':
                    sortOption = { createdAt: -1 };
                    break;
                case 'oldest':
                    sortOption = { createdAt: 1 };
                    break;
                case 'popular':
                    sortOption = { purchased: -1 };
                    break;
                case 'rating':
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
            .select("name description categories price level thumbnail ratings purchased createdAt")
            .sort(sortOption);

        res.status(200).json({
            success: true,
            courses,
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// add question in each lecture
interface IAddQuestionData {
    question: string;
    courseId: string;
    contentId: string;
}

export const addQuestion = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { question, courseId, contentId }: IAddQuestionData = req.body;
        const course = await CourseModel.findById(courseId);

        if (!course) return next(new ErrorHandler("Course not found", 404));

        const section = course?.courseData.find((sec: any) =>
            sec.sectionContents.some((cont: any) => cont._id.equals(contentId))
        );

        const content = section?.sectionContents.find((cont: any) => cont._id.equals(contentId));

        if (!content) return next(new ErrorHandler("Content not found", 404));

        // create a new question object
        const newQuestion: any = {
            user: req.user?._id,
            question,
            replies: [],
        };

        // add this question to our course content
        content.questions.push(newQuestion);

        await NotificationModel.create({
            userId: req.user?._id, // objectId
            title: "New Question",
            message: `You have a new question in section: ${section?.sectionTitle}`,
        });

        // save the updated course
        await course?.save();

        res.status(200).json({
            success: true,
            message: "Ask question successfully"
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})

// add answer in each lecture
interface IAddAnswerData {
    answer: string;
    courseId: string;
    contentId: string;
    questionId: string;
}

export const addAnswer = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { answer, courseId, contentId, questionId }: IAddAnswerData = req.body;
        const course = await CourseModel.findById(courseId);

        if (!course) return next(new ErrorHandler("Course not found", 404));

        const section = course?.courseData.find((sec: any) =>
            sec.sectionContents.some((cont: any) => cont._id.equals(contentId))
        );

        const content = section?.sectionContents.find((cont: any) => cont._id.equals(contentId));

        if (!content) return next(new ErrorHandler("Content not found", 404));

        const question = content?.questions.find((q: any) => q._id.equals(questionId));

        if (!question) return next(new ErrorHandler("Question not found", 404));

        const askedUser = await userModel.findById(question.user);

        if (!askedUser || !askedUser.email) {
            return next(new ErrorHandler("User email not found", 404));
        }

        const reply: any = {
            user: req.user?._id,
            answer,
        };

        // add this question to our course content
        question.replies?.push(reply);

        // save the updated course
        await course?.save();

        const data = {
            name: askedUser.name,
            title: section?.sectionTitle
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
            message: "Reply question successfully"
        });


    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})

// add course review -- only for user who purchase the course and admin
interface IAddReviewData {
    review: string;
    rating: number;
}

export const addReview = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const courseId = req.params.id;
        const { review, rating } = req.body as IAddReviewData;

        const isEnrolled = req.user?.courses?.some((c: any) => c.courseId === courseId);

        if (!isEnrolled && req.user?.role !== "admin") {
            return next(new ErrorHandler("You are not eligible to review this course", 403));
        }

        const course = await CourseModel.findById(courseId);

        if (!course) {
            return next(new ErrorHandler("Course not found", 404));
        }

        const reviewData: any = {
            user: req.user?._id,
            rating,
            comment: review,
            replies: [],
        };

        course?.reviews.push(reviewData);

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
            userId: req.user?._id,
            title: "New Review Received",
            message: `${req.user?.name} has given a review in ${course?.name}`,
        })

        res.status(200).json({
            success: true,
            course,
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500))
    }
})

// add reply in course review
interface IAddReviewReplyData {
    comment: string;
    courseId: string;
    reviewId: string;
}

export const addReplyToReview = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { comment, courseId, reviewId } = req.body as IAddReviewReplyData;

            const course = await CourseModel.findById(courseId);

            if (!course) {
                return next(new ErrorHandler("Course not found", 404));
            }

            const review = course?.reviews?.find(
                (rev: any) => rev._id.toString() === reviewId
            );

            if (!review) {
                return next(new ErrorHandler("Review of the course not found", 404));
            }

            const replyData: any = {
                user: req.user,
                comment,
            };

            review.replies?.push(replyData);

            await course?.save();

            res.status(200).json({
                success: true,
                course,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// get all courses--- only for admin
export const getAdminCourses = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            getAllCoursesService(res);
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

// delete course-- only for admin
export const deleteCourse = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            const course = await CourseModel.findById(id);

            if (!course) {
                return next(new ErrorHandler("Course not found", 404));
            }

            await course.deleteOne({ id });

            await redis.del(id);

            res.status(201).json({
                success: true,
                message: "Course deleted successfully",
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);