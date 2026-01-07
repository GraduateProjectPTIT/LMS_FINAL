import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import EnrolledCourseModel from "../models/enrolledCourse.model";
import cloudinary from "cloudinary";
import puppeteer from "puppeteer";
import CourseModel from "../models/course.model";

export const submitAssessment = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, submissionUrl, submissionImage, initialImage, makeupImage } = req.body;
      const userId = req.user?._id;

      const enrolledCourse = await EnrolledCourseModel.findOne({
        userId,
        courseId,
      });

      if (!enrolledCourse) {
        return next(
          new ErrorHandler("You are not enrolled in this course", 404)
        );
      }

      if (enrolledCourse.assessment?.passed) {
         return next(new ErrorHandler("You have already passed this assessment", 400));
      }

      let finalSubmissionImage = undefined;
      let finalInitialImage = undefined;
      let finalMakeupImage = undefined;

      const imageToProcess = makeupImage || submissionImage;

      if (imageToProcess) {
        try {
            const myCloud = await cloudinary.v2.uploader.upload(imageToProcess, {
                folder: "assessments",
                width: 750,
            });
            finalMakeupImage = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            };
            finalSubmissionImage = finalMakeupImage;
        } catch (error: any) {
            return next(new ErrorHandler("Makeup image upload failed: " + error.message, 500));
        }
      }

      if (initialImage) {
        try {
            const myCloud = await cloudinary.v2.uploader.upload(initialImage, {
                folder: "assessments",
                width: 750,
            });
            finalInitialImage = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            };
        } catch (error: any) {
            return next(new ErrorHandler("Initial image upload failed: " + error.message, 500));
        }
      }

      if (!finalMakeupImage) {
         return next(new ErrorHandler("Please provide a makeup image", 400));
      }
       if (!finalInitialImage) {
           return next(new ErrorHandler("Please provide an initial (before) image", 400));
       }

      enrolledCourse.assessment = {
        ...enrolledCourse.assessment,
        status: "submitted",
        submissionImage: finalSubmissionImage, 
        makeupImage: finalMakeupImage,
        score: undefined,
        feedback: undefined,
        passed: false,
      };

      await enrolledCourse.save();

      res.status(200).json({
        success: true,
        message: "Assessment submitted successfully",
        assessment: enrolledCourse.assessment,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Grade Assessment (Instructor/Admin)
export const gradeAssessment = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, courseId, isPassed, feedback } = req.body;

      if (typeof isPassed !== "boolean") {
        return next(new ErrorHandler("Invalid pass status.", 400));
      }

      const enrolledCourse = await EnrolledCourseModel.findOne({
        userId,
        courseId,
      });

      if (!enrolledCourse) {
        return next(new ErrorHandler("Enrollment not found", 404));
      }

      if (!enrolledCourse.assessment) {
        enrolledCourse.assessment = {
          status: "graded",
          passed: isPassed,
          feedback,
          submissionImage: undefined,
          initialImage: undefined,
          makeupImage: undefined
        };
      } else {
        enrolledCourse.assessment.status = "graded";
        enrolledCourse.assessment.passed = isPassed;
        enrolledCourse.assessment.feedback = feedback;
      }

      enrolledCourse.markModified("assessment");

      await enrolledCourse.save();

      res.status(200).json({
        success: true,
        message: "Assessment graded successfully",
        assessment: enrolledCourse.assessment,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get All Assessments (Admin/Tutor)
export const getAssessments = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.query;

      const user = req.user as any;
      
      const filter: any = {
        "assessment.status": { $in: ["submitted", "graded"] }
      };

      if (status) {
        filter["assessment.status"] = status;
      }

      // Nếu là tutor, chỉ lấy assessment của các khóa học do tutor tạo
      if (user?.role === "tutor") {
        // Lấy danh sách courseId mà tutor này tạo
        const tutorCourses = await CourseModel.find({ creatorId: user._id }, { _id: 1 });
        const tutorCourseIds = tutorCourses.map((c: any) => c._id);
        filter["courseId"] = { $in: tutorCourseIds };
      }

      // Admin thì lấy tất cả
      const assessments = await EnrolledCourseModel.find(filter)
        .populate("userId", "name email")
        .populate("courseId", "name")
        .sort({ updatedAt: -1 });

      res.status(200).json({
        success: true,
        assessments,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Generate Certificate (Puppeteer)
export const getCertificate = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;
      const userId = req.user?._id;
      console.log(`Generating certificate for User: ${userId}, Course: ${courseId}`);

      const enrolledCourse = await EnrolledCourseModel.findOne({
        userId,
        courseId,
      })
        .populate("userId", "name")
        .populate({
          path: "courseId",
          select: "name creatorId",
          populate: {
            path: "creatorId",
            select: "name",
          },
        });

      if (!enrolledCourse || !enrolledCourse.assessment?.passed) {
        return next(
          new ErrorHandler("Certificate not available. Course not passed.", 400)
        );
      }

      const studentName = (enrolledCourse.userId as any)?.name || "Student";
      const courseName = (enrolledCourse.courseId as any)?.name || "Course";
      const date = new Date(enrolledCourse.updatedAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
      
      const courseObj = enrolledCourse.courseId as any;
      const creatorObj = courseObj?.creatorId;
      console.log("Certificate Debug:", {
          courseId: courseObj?._id,
          hasCreator: !!creatorObj,
          creatorName: creatorObj?.name
      });

      const tutorName = creatorObj?.name;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
            body { 
                width: 1122px; height: 795px; margin: 0; padding: 0; 
                display: flex; justify-content: center; align-items: center;
                background-color: #fdfbf7;
                font-family: 'Playfair Display', serif;
            }
            .certificate-container {
                width: 1000px;
                height: 700px;
                border: 20px solid #4A90A4;
                padding: 40px;
                text-align: center;
                position: relative;
                background: white;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            h1 { font-size: 50px; color: #2c3e50; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 4px; }
            h2 { font-size: 24px; color: #4A90A4; text-transform: uppercase; font-weight: 300; letter-spacing: 2px; margin-top: 0; }
            p { font-size: 20px; color: #555; font-style: italic; margin: 20px 0; }
            .student-name { font-family: 'Great Vibes', cursive; font-size: 80px; color: #2c3e50; margin: 10px 0; border-bottom: 1px solid #ddd; padding-bottom: 20px; width: 80%; }
            .course-name { font-size: 36px; font-weight: bold; color: #2c3e50; text-transform: uppercase; margin: 10px 0; }
            .footer { display: flex; justify-content: space-between; width: 80%; margin-top: auto; padding-bottom: 40px; }
            .signature-block { display: flex; flex-direction: column; align-items: center; }
            .signature { font-family: 'Great Vibes', cursive; font-size: 32px; color: #2c3e50; min-height: 40px; }
            .line { width: 200px; border-bottom: 1px solid #777; margin-bottom: 5px; }
            .label { font-size: 14px; text-transform: uppercase; color: #777; font-family: sans-serif; letter-spacing: 1px; }
          </style>
        </head>
        <body>
            <div class="certificate-container">
                <div style="font-size: 12px; color: #999; margin-bottom: 20px;">Glow Academy</div>
                
                <h1>Certificate</h1>
                <h2>of Completion</h2>

                <p>This certificate is proudly presented to</p>
                <div class="student-name">${studentName}</div>

                <p>For the successful completion of the professional makeup course:</p>
                <div class="course-name">${courseName}</div>

                <div class="footer">
                    <div class="signature-block">
                        <div class="signature">${date}</div>
                        <div class="line"></div>
                        <div class="label">Date</div>
                    </div>
                    <div class="signature-block">
                        <div class="signature">${tutorName}</div>
                        <div class="line"></div>
                        <div class="label">Master Instructor</div>
                    </div>
                </div>
            </div>
        </body>
        </html>
      `;

      console.log("Launching Puppeteer...");
      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        headless: true 
      });
      console.log("Puppeteer launched. Creating page...");
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: "networkidle0" });
      console.log("Page content set. Generating PDF...");
      const pdfBuffer = await page.pdf({
        format: "A4",
        landscape: true,
        printBackground: true,
      });

      await browser.close();
      console.log("PDF generated. Sending response...");

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Certificate-${studentName.replace(/\s+/g, "_")}.pdf"`,
        "Content-Length": pdfBuffer.length,
      });

      res.end(pdfBuffer);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
