import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import PrerequisiteModel from "../models/prerequisite.model";
import ErrorHandler from "../utils/ErrorHandler";

// create prerequisite
export const createPrerequisite = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { title, description, isRequired, order } = req.body;

            if (!title) {
                return next(new ErrorHandler("Vui lòng nhập tiêu đề prerequisite", 400));
            }

            const prerequisite = await PrerequisiteModel.create({
                title,
                description,
                isRequired,
                order,
            });

            res.status(201).json({
                success: true,
                prerequisite,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// get all prerequisites
export const getAllPrerequisites = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const prerequisites = await PrerequisiteModel.find().sort({ order: 1 });

            res.status(200).json({
                success: true,
                prerequisites,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// get single prerequisite
export const getSinglePrerequisite = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const prerequisite = await PrerequisiteModel.findById(req.params.id);

            if (!prerequisite) {
                return next(new ErrorHandler("Không tìm thấy prerequisite", 404));
            }

            res.status(200).json({
                success: true,
                prerequisite,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// update prerequisite
export const updatePrerequisite = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { title, description, isRequired, order } = req.body;

            const prerequisite = await PrerequisiteModel.findByIdAndUpdate(
                req.params.id,
                {
                    title,
                    description,
                    isRequired,
                    order,
                },
                { new: true }
            );

            if (!prerequisite) {
                return next(new ErrorHandler("Không tìm thấy prerequisite", 404));
            }

            res.status(200).json({
                success: true,
                prerequisite,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// delete prerequisite
export const deletePrerequisite = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const prerequisite = await PrerequisiteModel.findByIdAndDelete(req.params.id);

            if (!prerequisite) {
                return next(new ErrorHandler("Không tìm thấy prerequisite", 404));
            }

            res.status(200).json({
                success: true,
                message: "Xóa prerequisite thành công",
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);
