import express from "express";
import {
    createBenefit,
    getAllBenefits,
    getSingleBenefit,
    updateBenefit,
    deleteBenefit,
} from "../controllers/benefit.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";

const benefitRouter = express.Router();

benefitRouter.post(
    "/create-benefit",
    isAuthenticated,
    authorizeRoles("admin"),
    createBenefit
);

benefitRouter.get("/get-benefits", getAllBenefits);

benefitRouter.get("/get-benefit/:id", getSingleBenefit);

benefitRouter.put(
    "/update-benefit/:id",
    isAuthenticated,
    authorizeRoles("admin"),
    updateBenefit
);

benefitRouter.delete(
    "/delete-benefit/:id",
    isAuthenticated,
    authorizeRoles("admin"),
    deleteBenefit
);

export default benefitRouter;
