import express from "express";
import { recommendationController } from "../controllers/recommendation.controller";
// Giả định bạn có file middleware 'auth' export 'isAuthenticated'
import { isAuthenticated } from "../middleware/auth";

const recommendationRouter = express.Router();

recommendationRouter.get(
  "/recommendations",
  isAuthenticated, // Rất quan trọng: Phải chạy trước để có req.user
  recommendationController.getRecommendations
);

export default recommendationRouter;
