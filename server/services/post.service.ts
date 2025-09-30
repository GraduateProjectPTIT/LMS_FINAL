import { NextFunction, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import PostModel from "../models/post.model";
import { v2 as cloudinary } from "cloudinary";

export const createPostService = async (
  user: any,
  data: any,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!user?._id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    const { title, contentHtml, tags, status, coverImage } = data || {};
    if (!title || !contentHtml) {
      return next(new ErrorHandler("title and contentHtml are required", 400));
    }

    let cover: any = undefined;

    if (typeof coverImage === "string" && (coverImage.startsWith("data:") || coverImage.startsWith("http"))) {
      const uploaded = await cloudinary.uploader.upload(coverImage, {
        folder: "posts",
        resource_type: "image",
      });
      cover = { public_id: uploaded.public_id, url: uploaded.secure_url };
    } else if (coverImage && coverImage.url) {
      cover = coverImage;
    }

    const post = await PostModel.create({
      title,
      contentHtml,
      tags: Array.isArray(tags) ? tags : [],
      status: ["draft", "published"].includes(String(status)) ? status : "draft",
      coverImage: cover,
      authorId: user._id,
    });

    return res.status(201).json({ success: true, post });
  } catch (error: any) {
    if (error?.code === 11000 && error?.keyPattern?.slug) {
      return next(new ErrorHandler("Post slug already exists", 409));
    }
    return next(new ErrorHandler(error.message, 500));
  }
};

export const getPublicPostsService = async (
  query: any,
  res: Response,
  next: NextFunction
) => {
  try {
    let page = parseInt(String(query?.page ?? "1"), 10);
    let limit = parseInt(String(query?.limit ?? "10"), 10);
    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      PostModel.find({ status: "published" })
        .select("title slug tags createdAt coverImage authorId")
        .populate("authorId", "name avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PostModel.countDocuments({ status: "published" }),
    ]);

    return res.status(200).json({
      success: true,
      paginatedResult: {
        data: items,
        meta: {
          totalItems: total,
          totalPages: Math.ceil(total / limit) || 0,
          currentPage: page,
          pageSize: limit,
        },
      },
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

export const getPublicPostBySlugService = async (
  slug: string,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!slug) return next(new ErrorHandler("Slug is required", 400));
    const post = await PostModel.findOne({ slug, status: "published" })
      .populate("authorId", "name avatar");
    if (!post) return next(new ErrorHandler("Post not found", 404));
    return res.status(200).json({ success: true, post });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

export const getPostsService = async (
  user: any,
  query: any,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!user?._id || user?.role !== "admin") {
      return next(new ErrorHandler("Forbidden", 403));
    }

    let page = parseInt(String(query?.page ?? "1"), 10);
    let limit = parseInt(String(query?.limit ?? "10"), 10);
    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      PostModel.find({})
        .select("title slug status tags createdAt updatedAt authorId")
        .populate("authorId", "name email avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PostModel.countDocuments({}),
    ]);

    return res.status(200).json({
      success: true,
      paginatedResult: {
        data: items,
        meta: {
          totalItems: total,
          totalPages: Math.ceil(total / limit) || 0,
          currentPage: page,
          pageSize: limit,
        },
      },
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

export const uploadTinyImageService = async (
  file: Express.Multer.File | undefined,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!file) return next(new ErrorHandler("No file uploaded", 400));

    const result = await new Promise<{ public_id: string; url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "posts", resource_type: "image" },
        (err, uploaded) => {
          if (err || !uploaded) return reject(err || new Error("Upload failed"));
          resolve({ public_id: uploaded.public_id, url: uploaded.secure_url });
        }
      );
      stream.end(file.buffer);
    });

    return res.status(200).json({ location: result.url });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};
