import express from "express";
import multer from "multer";
import { isAuthenticated, authorizeRoles } from "../middleware/auth";
import { createPost, uploadTinyImage, getPosts, getPublicPosts, getPublicPostBySlug } from "../controllers/post.controller";

const postRouter = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

postRouter.post("/post", isAuthenticated, createPost);

postRouter.get("/post", isAuthenticated, authorizeRoles("admin"), getPosts);

postRouter.post(
  "/post/upload-image",
  isAuthenticated,
  upload.single("file"),
  uploadTinyImage
);

postRouter.get("/public/posts", getPublicPosts);
postRouter.get("/public/posts/:slug", getPublicPostBySlug);

export default postRouter;
