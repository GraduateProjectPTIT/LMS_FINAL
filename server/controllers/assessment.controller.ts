import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import { assessmentService } from "../services/assessment.service";

export const submitAssessment = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, initialImage, makeupImage } = req.body;
      const userId = String(req.user?._id);

      const assessment = await assessmentService.submitAssessmentService(
        userId,
        courseId,
        initialImage,
        makeupImage
      );

      res.status(200).json({
        success: true,
        message: "Assessment submitted successfully",
        assessment,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const gradeAssessment = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, courseId, isPassed, feedback } = req.body;

      const assessment = await assessmentService.gradeAssessmentService(
        String(userId),
        courseId,
        isPassed,
        feedback
      );

      res.status(200).json({
        success: true,
        message: "Assessment graded successfully",
        assessment,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getAssessments = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.query;
      const user = req.user as any;

      const assessments = await assessmentService.getAssessmentsService(user, status as string);

      res.status(200).json({
        success: true,
        assessments,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getCertificate = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;
      const userId = String(req.user?._id);
      
      const { pdfBuffer, filename } = await assessmentService.generateCertificateService(userId, courseId);

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length,
      });

      res.end(pdfBuffer);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
