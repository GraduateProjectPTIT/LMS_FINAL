import { Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import CourseModel from "../models/course.model";
import BenefitModel from "../models/benefit.model";
import PrerequisiteModel from "../models/prerequisite.model";
import ErrorHandler from "../utils/ErrorHandler";

// create course
export const createCourse = async (data: any, res: Response, next: NextFunction) => {
    try {
        console.log("Service createCourse called with data:", JSON.stringify(data, null, 2));
        
        const { benefits, prerequisites, ...courseData } = data;
        console.log("Extracted courseData:", JSON.stringify(courseData, null, 2));
        console.log("Benefits:", benefits);
        console.log("Prerequisites:", prerequisites);

        if (!courseData.name) {
            console.log("Course name is missing");
            return next(new ErrorHandler("Tên khóa học là bắt buộc", 400));
        }

        if (!courseData.description) {
            console.log("Course description is missing");
            return next(new ErrorHandler("Mô tả khóa học là bắt buộc", 400));
        }

        if (!courseData.price) {
            console.log("Course price is missing");
            return next(new ErrorHandler("Giá khóa học là bắt buộc", 400));
        }

        if (!courseData.thumbnail) {
            console.log("Course thumbnail is missing");
            return next(new ErrorHandler("Thumbnail là bắt buộc", 400));
        }

        let benefitIds: string[] = [];
        if (benefits && benefits.length > 0) {
            console.log("Creating benefits:", benefits);
            const createdBenefits = await Promise.all(
                benefits.map(async (benefit: any, index: number) => {
                    if (!benefit.title) {
                        throw new Error("Tiêu đề benefit là bắt buộc");
                    }
                    console.log("Creating benefit:", benefit);
                    const newBenefit = await BenefitModel.create({
                        title: benefit.title,
                        description: benefit.description || "",
                        icon: benefit.icon || "",
                        order: index,
                    });
                    console.log("Benefit created:", newBenefit._id);
                    return newBenefit._id;
                })
            );
            benefitIds = createdBenefits;
            console.log("All benefits created:", benefitIds);
        } else {
            console.log("No benefits to create");
        }

        let prerequisiteIds: string[] = [];
        if (prerequisites && prerequisites.length > 0) {
            console.log("Creating prerequisites:", prerequisites);
            const createdPrerequisites = await Promise.all(
                prerequisites.map(async (prerequisite: any, index: number) => {
                    if (!prerequisite.title) {
                        throw new Error("Tiêu đề prerequisite là bắt buộc");
                    }
                    console.log("Creating prerequisite:", prerequisite);
                    const newPrerequisite = await PrerequisiteModel.create({
                        title: prerequisite.title,
                        description: prerequisite.description || "",
                        isRequired: prerequisite.isRequired !== undefined ? prerequisite.isRequired : true,
                        order: index,
                    });
                    console.log("Prerequisite created:", newPrerequisite._id);
                    return newPrerequisite._id;
                })
            );
            prerequisiteIds = createdPrerequisites;
            console.log("All prerequisites created:", prerequisiteIds);
        } else {
            console.log("No prerequisites to create");
        }

        console.log("Creating course with data:", {
            ...courseData,
            benefits: benefitIds,
            prerequisites: prerequisiteIds,
        });
        
        const course = await CourseModel.create({
            ...courseData,
            benefits: benefitIds,
            prerequisites: prerequisiteIds,
        });
        
        console.log("Course created successfully:", course._id);

        console.log("Populating course data...");
        const populatedCourse = await CourseModel.findById(course._id)
            .populate("benefits")
            .populate("prerequisites");
        
        console.log("Course populated successfully");

        res.status(201).json({
            success: true,
            course: populatedCourse,
        });
    } catch (error: any) {
        console.error("Create course error:", error);
        return next(new ErrorHandler(error.message, 500));
    }
};

// Get all courses 
export const getAllCoursesService = async (res: Response) => {
    const courses = await CourseModel.find()
        .populate("benefits")
        .populate("prerequisites")
        .sort({ createAt: -1 });

    res.status(201).json({
        success: true,
        courses,
    });
}