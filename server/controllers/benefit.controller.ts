import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import BenefitModel from "../models/benefit.model";
import ErrorHandler from "../utils/ErrorHandler";

// create benefit
export const createBenefit = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { title } = req.body;

            if (!title) {
                return next(new ErrorHandler("Vui lòng nhập tiêu đề benefit", 400));
            }

            const benefit = await BenefitModel.create({
                title,
            });

            res.status(201).json({
                success: true,
                benefit,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// get all benefits
export const getAllBenefits = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const benefits = await BenefitModel.find();

            res.status(200).json({
                success: true,
                benefits,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// get single benefit
export const getSingleBenefit = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const benefit = await BenefitModel.findById(req.params.id);

            if (!benefit) {
                return next(new ErrorHandler("Không tìm thấy benefit", 404));
            }

            res.status(200).json({
                success: true,
                benefit,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// update benefit
export const updateBenefit = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { title } = req.body;

            const benefit = await BenefitModel.findByIdAndUpdate(
                req.params.id,
                {
                    title,
                },
                { new: true }
            );

            if (!benefit) {
                return next(new ErrorHandler("Không tìm thấy benefit", 404));
            }

            res.status(200).json({
                success: true,
                benefit,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// delete benefit
export const deleteBenefit = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const benefit = await BenefitModel.findByIdAndDelete(req.params.id);

            if (!benefit) {
                return next(new ErrorHandler("Không tìm thấy benefit", 404));
            }

            res.status(200).json({
                success: true,
                message: "Xóa benefit thành công",
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);
