import { Request, Response, NextFunction } from "express";
import { createPostService, uploadTinyImageService, getPostsService, getPublicPostsService, getPublicPostBySlugService, updatePostService, deletePostService } from "../services/post.service";

export const createPost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await createPostService(req.user, req.body, res, next);
};

export const uploadTinyImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await uploadTinyImageService(req.file as any, res, next);
};

export const getPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await getPostsService(req.user, req.query, res, next);
};

export const getPublicPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await getPublicPostsService(req.query, res, next);
};

export const getPublicPostBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { slug } = req.params as { slug: string };
  await getPublicPostBySlugService(slug, res, next);
};

export const updatePost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params as { id: string };
  await updatePostService(req.user, id, req.body, res, next);
};

export const deletePost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params as { id: string };
  await deletePostService(req.user, id, res, next);
};
