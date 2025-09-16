import { NextFunction, Request, Response } from "express"
import { CatchAsyncError } from "../middleware/catchAsyncErrors"
import ErrorHandler from "../utils/ErrorHandler"
import cloudinary from "cloudinary"
import LayoutModel from "../models/layout.model"

export const createLayout = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type } = req.body;
        const isTypeExist = await LayoutModel.exists({ type })

        if (isTypeExist) {
            return next(new ErrorHandler(`${type} already exist`, 400))
        }

        let layoutData: any = { type };

        if (type === "Banner") {
            const { image, title, subTitle } = req.body.banner;

            if (image) {
                const myCloud = await cloudinary.v2.uploader.upload(image, {
                    folder: "layout",
                    width: 500,
                    height: 300,
                    crop: "fill"
                })

                layoutData.banner = {
                    image: {
                        public_id: myCloud.public_id,
                        url: myCloud.secure_url
                    }
                }
            }

            layoutData.banner = {
                title,
                subTitle
            }

        }
        else if (type === "FAQ") {
            const { faq } = req.body
            layoutData.faq = faq.map((item: any) => ({
                question: item.question,
                answer: item.answer
            }));
        }
        else if (type === "Categories") {
            const { categories } = req.body;
            if (!Array.isArray(categories)) {
                return next(new ErrorHandler("Invalid data of Categories", 400));
            }
            layoutData.categories = categories;
        }
        else {
            return next(new ErrorHandler("Invalid layout type", 400));
        }

        await LayoutModel.create(layoutData);

        res.status(200).json({
            success: true,
            message: "Layout created successfully"
        })

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500))
    }
})

export const updateLayout = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type } = req.body;

        if (type === "Banner") {
            const bannerData: any = await LayoutModel.findOne({ type: "Banner" })
            if (!bannerData) {
                return next(new ErrorHandler("Banner layout not found", 404));
            }

            const { banner } = req.body;

            if (!banner) {
                return next(new ErrorHandler("Invalid data of banner", 404));
            }

            const { image, title, subTitle } = banner;

            let existedImage = bannerData.banner?.image;
            let newImage = existedImage;

            if (image && image !== existedImage?.url) {
                if (existedImage?.public_id) {
                    await cloudinary.v2.uploader.destroy(existedImage.public_id);
                }

                const myCloud = await cloudinary.v2.uploader.upload(image, {
                    folder: "layout",
                    width: 500,
                    height: 300,
                    crop: "fill"
                });

                newImage = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url
                };
            }

            const updateData: any = {
                "banner.title": title,
                "banner.subTitle": subTitle
            };

            if (newImage) {
                updateData["banner.image"] = newImage;
            }

            await LayoutModel.findByIdAndUpdate(bannerData._id, { $set: updateData });
        }
        else if (type === "FAQ") {
            const faqData = await LayoutModel.findOne({ type: "FAQ" });
            if (!faqData) {
                return next(new ErrorHandler("FAQ layout not found", 404));
            }

            const { faq } = req.body;

            if (!faq || !Array.isArray(faq)) {
                return next(new ErrorHandler("Invalid data of FAQ", 404));
            }
            const faqs = faq.map((item: any) => ({
                ...(item && item._id ? { _id: item._id } : {}),
                question: item.question,
                answer: item.answer
            }));

            await LayoutModel.findByIdAndUpdate(faqData._id, { $set: { faq: faqs } });
        }
        else if (type === "Categories") {
            const categoriesData = await LayoutModel.findOne({ type: "Categories" });
            if (!categoriesData) {
                return next(new ErrorHandler("Categories layout not found", 404));
            }

            const { categories } = req.body;

            if (!categories || !Array.isArray(categories)) {
                return next(new ErrorHandler("Invalid data of Categories", 400));
            }

            await LayoutModel.findByIdAndUpdate(categoriesData._id, { $set: { categories } });
        }
        else {
            return next(new ErrorHandler("Invalid layout type", 400));
        }

        res.status(200).json({
            success: true,
            message: "Layout updated successfully"
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500))
    }
})

// get layout by type
export const getLayoutByType = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const { type } = req.params
    const layout = await LayoutModel.findOne({ type }).populate("categories")
    try {
        res.status(200).json({
            success: true,
            layout
        })
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500))
    }
}
)