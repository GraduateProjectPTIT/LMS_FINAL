import { assessmentRepository } from "../repositories/assessment.repository";
import { IEnrolledCourse } from "../models/enrolledCourse.model";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import puppeteer from "puppeteer";

export const submitAssessmentService = async (
  userId: string,
  courseId: string,
  initialImage: string,
  makeupImage: string
) => {
  const enrolledCourse = await assessmentRepository.findByUserAndCourse(userId, courseId);

  if (!enrolledCourse) {
    throw new ErrorHandler("You are not enrolled in this course", 404);
  }

  if (enrolledCourse.assessment?.passed) {
    throw new ErrorHandler("You have already passed this assessment", 400);
  }

  let finalInitialImage = undefined;
  let finalMakeupImage = undefined;

  if (makeupImage) {
    try {
      const myCloud = await cloudinary.v2.uploader.upload(makeupImage, {
        folder: "assessments",
        width: 750,
      });
      finalMakeupImage = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    } catch (error: any) {
      throw new ErrorHandler("Makeup image upload failed: " + error.message, 500);
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
        url: myCloud.secure_url,
      };
    } catch (error: any) {
      throw new ErrorHandler("Initial image upload failed: " + error.message, 500);
    }
  }

  if (!finalMakeupImage) {
    throw new ErrorHandler("Please provide a makeup image", 400);
  }

  if (!finalInitialImage) {
    throw new ErrorHandler("Please provide an initial (before) image", 400);
  }

  const assessmentData: NonNullable<IEnrolledCourse["assessment"]> = {
    status: "submitted",
    initialImage: finalInitialImage,
    makeupImage: finalMakeupImage,
    score: undefined,
    feedback: undefined,
    passed: false,
  };

  const updatedCourse = await assessmentRepository.updateAssessment(userId, courseId, assessmentData);
  
  return updatedCourse?.assessment;
};

export const gradeAssessmentService = async (
  userId: string,
  courseId: string,
  isPassed: boolean,
  feedback: string
) => {
  if (typeof isPassed !== "boolean") {
    throw new ErrorHandler("Invalid pass status.", 400);
  }

  const enrolledCourse = await assessmentRepository.findByUserAndCourse(userId, courseId);

  if (!enrolledCourse) {
    throw new ErrorHandler("Enrollment not found", 404);
  }

  const currentAssessment = enrolledCourse.assessment || {};
  
  const assessmentData: NonNullable<IEnrolledCourse["assessment"]> = {
    ...currentAssessment,
    status: "graded",
    passed: isPassed,
    feedback,
  };

  const updatedCourse = await assessmentRepository.updateAssessment(userId, courseId, assessmentData);
  return updatedCourse?.assessment;
};

export const getAssessmentsService = async (
  user: any,
  status?: string
) => {
  const filter: any = {
    "assessment.status": { $in: ["submitted", "graded"] }
  };

  if (status) {
    filter["assessment.status"] = status;
  }

  if (user?.role === "tutor") {
    const tutorCourseIds = await assessmentRepository.findCourseIdsByCreator(user._id);
    filter["courseId"] = { $in: tutorCourseIds };
  }

  return assessmentRepository.getAssessmentsByFilter(filter);
};

export const generateCertificateService = async (
  userId: string,
  courseId: string
) => {
  const enrolledCourse = await assessmentRepository.getEnrolledCourseForCertificate(userId, courseId);

  if (!enrolledCourse || !enrolledCourse.assessment?.passed) {
    throw new ErrorHandler("Certificate not available. Course not passed.", 400);
  }

  const studentName = (enrolledCourse.userId as any)?.name || "Student";
  const courseName = (enrolledCourse.courseId as any)?.name || "Course";
  const date = new Date(enrolledCourse.updatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const courseObj = enrolledCourse.courseId as any;
  const creatorObj = courseObj?.creatorId;
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

  const browser = await puppeteer.launch({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
    ],
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
    protocolTimeout: 120000,
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0", timeout: 60000 });
  const pdfBuffer = await page.pdf({
    format: "A4",
    landscape: true,
    printBackground: true,
  });

  await browser.close();

  return {
    pdfBuffer,
    filename: `Certificate-${studentName.replace(/\s+/g, "_")}.pdf`,
  };
};

export const assessmentService = {
  submitAssessmentService,
  gradeAssessmentService,
  getAssessmentsService,
  generateCertificateService
};
