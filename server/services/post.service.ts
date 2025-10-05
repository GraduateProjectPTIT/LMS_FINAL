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

    const { title, contentHtml, tags, status, coverImage, shortDescription } = data || {};
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
      shortDescription: typeof shortDescription === "string" ? shortDescription : undefined,
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

    const [rawItems, total] = await Promise.all([
      PostModel.find({ status: "published" })
        .select("title slug tags createdAt coverImage authorId shortDescription contentHtml")
        .populate("authorId", "name avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PostModel.countDocuments({ status: "published" }),
    ]);

    const stripHtml = (html: string) => String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const makeShort = (text: string, len = 180) => (text.length <= len ? text : text.slice(0, len).trimEnd() + "…");
    const estimateReadingTimeMinutes = (text: string) => {
      const words = text.split(/\s+/).filter(Boolean).length;
      return Math.max(1, Math.ceil(words / 200));
    };

    const items = rawItems.map((p: any) => {
      const plain = stripHtml(p.contentHtml || "");
      const shortDescription = typeof p.shortDescription === "string" && p.shortDescription.trim().length > 0
        ? p.shortDescription.trim()
        : undefined;
      return {
        title: p.title,
        slug: p.slug,
        tags: p.tags,
        createdAt: p.createdAt,
        authorId: p.authorId,
        coverImage: p.coverImage?.url ? { url: p.coverImage.url } : p.coverImage,
        shortDescription,
        readingTimeMinutes: estimateReadingTimeMinutes(plain),
      };
    });

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

    // Filters
    const keyword = typeof query?.keyword !== "undefined" ? String(query.keyword).trim() : "";
    const status = typeof query?.status !== "undefined" ? String(query.status).trim() : undefined; // draft|published
    const tag = typeof query?.tag !== "undefined" ? String(query.tag).trim() : undefined;
    const authorId = typeof query?.authorId !== "undefined" ? String(query.authorId).trim() : undefined;

    const filter: any = {};
    if (keyword.length >= 2) {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [
        { title: { $regex: regex } },
        { slug: { $regex: regex } },
        { tags: { $regex: regex } },
      ];
    }
    if (status && ["draft", "published"].includes(status)) {
      filter.status = status;
    }
    if (tag) {
      filter.tags = { $in: [tag] };
    }
    if (authorId) {
      filter.authorId = authorId;
    }

    // Sorting
    const allowedSortFields = ["createdAt", "title"] as const;
    const sortBy = allowedSortFields.includes(String(query?.sortBy) as any)
      ? String(query.sortBy)
      : "createdAt";
    const sortOrder = String(query?.sortOrder) === "asc" ? 1 : -1;
    const sort: any = { [sortBy]: sortOrder };

    const [rawItems, total] = await Promise.all([
      PostModel.find(filter)
        .select("title slug status tags createdAt updatedAt authorId shortDescription contentHtml coverImage")
        .populate("authorId", "name email avatar")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      PostModel.countDocuments(filter),
    ]);

    // Helpers to produce short description and reading time
    const stripHtml = (html: string) => String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const estimateReadingTimeMinutes = (text: string) => {
      const words = text.split(/\s+/).filter(Boolean).length;
      return Math.max(1, Math.ceil(words / 200)); // ~200 wpm
    };

    const items = rawItems.map((p: any) => {
      const plain = stripHtml(p.contentHtml || "");
      const shortDescription = typeof p.shortDescription === "string" && p.shortDescription.trim().length > 0
        ? p.shortDescription.trim()
        : undefined;
      const readingTimeMinutes = estimateReadingTimeMinutes(plain);
      return {
        _id: p._id,
        title: p.title,
        slug: p.slug,
        status: p.status,
        tags: p.tags,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        authorId: p.authorId,
        coverImage: p.coverImage?.url ? { url: p.coverImage.url } : p.coverImage,
        shortDescription,
        readingTimeMinutes,
      };
    });

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
