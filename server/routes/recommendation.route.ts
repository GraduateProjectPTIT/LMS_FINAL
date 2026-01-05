import express from "express";
import { recommendationController } from "../controllers/recommendation.controller";
import { isAuthenticated } from "../middleware/auth";

const recommendationRouter = express.Router();

recommendationRouter.get(
  "/recommendations",
  isAuthenticated,
  recommendationController.getRecommendations
);

export default recommendationRouter;

recommendationRouter.get(
  "/recommendations/:userId",
  recommendationController.getTestRecommendations
);
