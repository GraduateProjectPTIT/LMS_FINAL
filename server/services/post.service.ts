import { NextFunction, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import PostModel from "../models/post.model";
import CategoryModel from "../models/category.model";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

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

    const { title, contentHtml, status, coverImage, shortDescription } = data || {};
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

    let categoryIds: string[] = [];
    if (Array.isArray((data as any)?.categoryIds)) {
      categoryIds = (data as any).categoryIds as string[];
    } else if (Array.isArray((data as any)?.categories)) {
      categoryIds = (data as any).categories as string[];
    }
    let derivedTags: string[] = [];
    if (categoryIds.length) {
      const cats = await CategoryModel.find({ _id: { $in: categoryIds } }).select("title");
      derivedTags = cats.map((c: any) => String(c?.title || "").trim()).filter(Boolean);
    }

    const post = await PostModel.create({
      title,
      contentHtml,
      tags: derivedTags,
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
        .select("title slug tags createdAt coverImage authorId shortDescription contentHtml views")
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
        views: typeof (p as any).views === "number" ? (p as any).views : 0,
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

export const getPublicPostByIdService = async (
  id: string,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!id) return next(new ErrorHandler("Post id is required", 400));
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ErrorHandler("Invalid post id", 400));
    }
    const post = await PostModel.findOne({ _id: id })
      .populate("authorId", "name avatar");
    if (!post) return next(new ErrorHandler("Post not found", 404));
    return res.status(200).json({ success: true, post });
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
    const post = await PostModel.findOneAndUpdate(
      { slug, status: "published" },
      { $inc: { views: 1 } },
      { new: true }
    ).populate("authorId", "name avatar");
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
        .select("title slug status tags createdAt updatedAt authorId shortDescription contentHtml coverImage views")
        .populate("authorId", "name email avatar")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      PostModel.countDocuments(filter),
    ]);

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
        views: typeof (p as any).views === "number" ? (p as any).views : 0,
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

export const updatePostService = async (
  user: any,
  id: string,
  data: any,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!user?._id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    const post = await PostModel.findById(id);
    if (!post) {
      return next(new ErrorHandler("Post not found", 404));
    }

    const isOwner = String(post.authorId) === String(user._id);
    const isAdmin = user?.role === "admin";
    if (!isOwner && !isAdmin) {
      return next(new ErrorHandler("Forbidden", 403));
    }

    const { title, contentHtml, status, coverImage, shortDescription, slug } = data || {};

    if (typeof title !== "undefined") post.title = title;
    if (typeof contentHtml !== "undefined") post.contentHtml = contentHtml;
    if (typeof slug !== "undefined") post.slug = String(slug);
    if (Array.isArray((data as any)?.categoryIds) || Array.isArray((data as any)?.categories)) {
      let categoryIds: string[] = [];
      if (Array.isArray((data as any)?.categoryIds)) categoryIds = (data as any).categoryIds as string[];
      if (!categoryIds.length && Array.isArray((data as any)?.categories)) categoryIds = (data as any).categories as string[];
      const cats = categoryIds.length
        ? await CategoryModel.find({ _id: { $in: categoryIds } }).select("title")
        : [];
      post.tags = cats.map((c: any) => String(c?.title || "").trim()).filter(Boolean);
    }
    if (typeof status !== "undefined" && ["draft", "published"].includes(String(status))) {
      post.status = status;
    }
    if (typeof shortDescription !== "undefined") {
      post.shortDescription = typeof shortDescription === "string" ? shortDescription : undefined;
    }

    if (typeof coverImage !== "undefined") {
      let newCover: any = undefined;
      if (coverImage === null) {
        if (post.coverImage?.public_id) {
          try { await cloudinary.uploader.destroy(post.coverImage.public_id); } catch {}
        }
        newCover = undefined;
      } else if (typeof coverImage === "string" && (coverImage.startsWith("data:") || coverImage.startsWith("http"))) {
        const uploaded = await cloudinary.uploader.upload(coverImage, {
          folder: "posts",
          resource_type: "image",
        });
        if (post.coverImage?.public_id) {
          try { await cloudinary.uploader.destroy(post.coverImage.public_id); } catch {}
        }
        newCover = { public_id: uploaded.public_id, url: uploaded.secure_url };
      } else if (coverImage && coverImage.url) {
        newCover = coverImage;
      }
      post.coverImage = newCover;
    }

    try {
      const saved = await post.save();
      return res.status(200).json({ success: true, post: saved });
    } catch (error: any) {
      if (error?.code === 11000 && error?.keyPattern?.slug) {
        return next(new ErrorHandler("Post slug already exists", 409));
      }
      throw error;
    }
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

export const deletePostService = async (
  user: any,
  id: string,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!user?._id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    const post = await PostModel.findById(id);
    if (!post) {
      return next(new ErrorHandler("Post not found", 404));
    }

    const isOwner = String(post.authorId) === String(user._id);
    const isAdmin = user?.role === "admin";
    if (!isOwner && !isAdmin) {
      return next(new ErrorHandler("Forbidden", 403));
    }

    if (post.coverImage?.public_id) {
      try { await cloudinary.uploader.destroy(post.coverImage.public_id); } catch {}
    }

    await post.deleteOne();
    return res.status(200).json({ success: true });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};
