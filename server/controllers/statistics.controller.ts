import { Request, Response, NextFunction } from "express";
import { getUserGrowthChartService } from "../services/statistics.service";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import CourseModel from "../models/course.model";
import OrderModel from "../models/order.model";
import userModel from "../models/user.model";
import { generateLast12MonthsDate } from "../utils/analytics.generator";
import ErrorHandler from "../utils/ErrorHandler";
import EnrolledCourseModel from "../models/enrolledCourse.model";

// Controller Ä‘á»ƒ láº¥y dá»¯ liá»‡u biá»ƒu Ä‘á»“ tÄƒng trÆ°á»Ÿng user
export const getUserGrowthChart = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    // Láº¥y cÃ¡c query params, cÃ³ thá»ƒ lÃ  undefined
    const { granularity, days: daysStr } = req.query;

    // Chuyá»ƒn Ä‘á»•i vÃ  validation Ä‘áº§u vÃ o
    let validatedGranularity: "daily" | "monthly" = "daily";

    if (granularity === "monthly") {
      validatedGranularity = "monthly";
    }

    const days = daysStr ? parseInt(daysStr as string, 10) : 30;
    if (isNaN(days) || days <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid 'days' parameter." });
    }

    const options = {
      granularity: validatedGranularity,
      days: days,
    };

    const chartData = await getUserGrowthChartService(options);

    res.status(200).json({
      success: true,
      chartData,
    });
  }
);

// Minh
export const getUserAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await generateLast12MonthsDate(userModel);

      if (!users) {
        return res.json({ message: "No users found in last 12 months" });
      }

      res.status(200).json({
        success: true,
        users,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getCourseAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await generateLast12MonthsDate(CourseModel);

      if (!courses) {
        return res.json({ message: "No courses found in last 12 months" });
      }

      res.status(200).json({
        success: true,
        courses,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getOrderAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await generateLast12MonthsDate(OrderModel);

      if (!orders) {
        return res.json({ message: "No orders found in last 12 months" });
      }

      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getStudentLearningSummary = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      if (!userId) return next(new ErrorHandler("Unauthorized", 401));

      const enrollments = await EnrolledCourseModel.find({ userId })
        .select("courseId progress completedLectures")
        .populate({
          path: "courseId",
          select:
            "courseData._id courseData.sectionContents._id courseData.sectionContents.videoLength name thumbnail",
        });

      let totalMinutesLearned = 0;
      let progressSum = 0;
      const count = enrollments.length;

      enrollments.forEach((en) => {
        progressSum += en.progress ?? 0;
        const course: any = (en as any).courseId;
        if (!course) return;

        const lectureLenMap = new Map<string, number>();
        (course.courseData || []).forEach((sec: any) => {
          (sec.sectionContents || []).forEach((lec: any) => {
            lectureLenMap.set(String(lec._id), lec.videoLength || 0);
          });
        });
        (en.completedLectures || []).forEach((lecId) => {
          const len = lectureLenMap.get(String(lecId)) || 0;
          totalMinutesLearned += len;
        });
      });

      const avgProgress = count > 0 ? Math.round(progressSum / count) : 0;

      res.status(200).json({
        success: true,
        avgProgress,
        totalMinutesLearned,
        coursesCount: count,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getStudentCourseProgress = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      if (!userId) return next(new ErrorHandler("Unauthorized", 401));

      const enrollments = await EnrolledCourseModel.find({ userId })
        .select("courseId progress completed completedLectures enrolledAt")
        .populate({
          path: "courseId",
          select:
            "name thumbnail courseData._id courseData.sectionContents._id courseData.sectionContents.videoLength",
        });

      const items = enrollments.map((en) => {
        const course: any = (en as any).courseId;

        const lectureLenMap = new Map<string, number>();
        (course?.courseData || []).forEach((sec: any) => {
          (sec.sectionContents || []).forEach((lec: any) => {
            lectureLenMap.set(String(lec._id), lec.videoLength || 0);
          });
        });
        const minutesLearned = (en.completedLectures || []).reduce(
          (acc, id) => acc + (lectureLenMap.get(String(id)) || 0),
          0
        );

        return {
          course: course?._id,
          courseName: course?.name,
          thumbnail: course?.thumbnail,
          progress: en.progress ?? 0,
          completed: en.completed ?? false,
          minutesLearned,
          enrolledAt: en.enrolledAt,
        };
      });

      res.status(200).json({ success: true, items });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getTutorDashboardStats = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tutorId = req.user?._id;
      if (!tutorId) return next(new ErrorHandler("Unauthorized", 401));

      const tutorCourses = await CourseModel.find({
        creatorId: tutorId,
      }).select("_id");
      const courseIds = tutorCourses.map((c) => String(c._id));

      const enrollments = await EnrolledCourseModel.find({
        courseId: { $in: courseIds },
      }).select("userId progress completed");

      const totalCourses = tutorCourses.length;
      const uniqueStudents = new Set(enrollments.map((e) => String(e.userId)))
        .size;
      const avgCompletion =
        enrollments.length > 0
          ? Math.round(
              enrollments.reduce((acc, e) => acc + (e.progress || 0), 0) /
                enrollments.length
            )
          : 0;

      const revenueAgg = await OrderModel.aggregate([
        {
          $match: {
            "payment_info.status": "succeeded",
            courseId: { $in: courseIds },
          },
        },
        {
          $group: {
            _id: {
              y: { $year: "$createdAt" },
              m: { $month: "$createdAt" },
              w: { $isoWeek: "$createdAt" },
            },
            monthTotal: { $sum: "$payment_info.amount" },
            count: { $sum: 1 },
          },
        },
      ]);

      const byMonth: any[] = [];
      const byWeek: any[] = [];
      const totalsByYear: Record<string, number> = {};
      revenueAgg.forEach((r: any) => {
        const ym = `${r._id.y}-${String(r._id.m).padStart(2, "0")}`;
        byMonth.push({ ym, total: r.monthTotal });
        const yw = `${r._id.y}-W${String(r._id.w).padStart(2, "0")}`;
        byWeek.push({ yw, total: r.monthTotal });
        totalsByYear[r._id.y] = (totalsByYear[r._id.y] || 0) + r.monthTotal;
      });

      const byYear = Object.keys(totalsByYear).map((y) => ({
        y: Number(y),
        total: totalsByYear[y],
      }));

      res.status(200).json({
        success: true,
        totalCourses,
        totalStudents: uniqueStudents,
        avgCompletion,
        revenue: { byWeek, byMonth, byYear },
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getTutorStudentsProgress = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tutorId = req.user?._id;
      if (!tutorId) return next(new ErrorHandler("Unauthorized", 401));

      const courses = await CourseModel.find({ creatorId: tutorId })
        .select("_id name")
        .lean();
      const courseMap = new Map(courses.map((c) => [String(c._id), c.name]));
      const courseIds = courses.map((c) => String(c._id));

      const enrollments = await EnrolledCourseModel.find({
        courseId: { $in: courseIds },
      })
        .select("userId courseId progress completed")
        .populate("userId", "name email avatar")
        .lean();

      const rows = enrollments.map((e: any) => ({
        student: e.userId,
        courseId: e.courseId,
        courseName: courseMap.get(String(e.courseId)),
        progress: e.progress || 0,
        completed: e.completed || false,
      }));

      res.status(200).json({ success: true, rows });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getAdminCourseInsights = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const totalCourses = await CourseModel.countDocuments();

      const popularTop10 = await CourseModel.find()
        .select("name purchased ratings thumbnail creatorId")
        .sort({ purchased: -1 })
        .limit(10)
        .populate("creatorId", "name");

      const revenueTop10Agg = await OrderModel.aggregate([
        { $match: { "payment_info.status": "succeeded" } },
        {
          $group: {
            _id: "$courseId",
            totalRevenue: { $sum: "$payment_info.amount" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 },
      ]);
      const courseDocs = await CourseModel.find({
        _id: { $in: revenueTop10Agg.map((r) => r._id) },
      })
        .select("name thumbnail purchased creatorId")
        .populate("creatorId", "name")
        .lean();
      const courseDocMap = new Map(
        courseDocs.map((c: any) => [String(c._id), c])
      );
      const revenueTop10 = revenueTop10Agg.map((r: any) => ({
        courseId: r._id,
        course: courseDocMap.get(String(r._id)) || null,
        totalRevenue: r.totalRevenue,
        orders: r.orders,
      }));

      const leastInterestedTop5 = await CourseModel.find()
        .select("name purchased ratings thumbnail creatorId")
        .sort({ purchased: 1, ratings: 1 })
        .limit(5)
        .populate("creatorId", "name");

      res.status(200).json({
        success: true,
        totalCourses,
        popularTop10,
        revenueTop10,
        leastInterestedTop5,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);