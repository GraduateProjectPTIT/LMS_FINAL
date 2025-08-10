import express from "express";
import {
  createPrerequisite,
  getAllPrerequisites,
  getSinglePrerequisite,
  updatePrerequisite,
  deletePrerequisite,
} from "../controllers/prerequisite.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";

const prerequisiteRouter = express.Router();

prerequisiteRouter.post(
  "/create-prerequisite",
  isAuthenticated,
  authorizeRoles("admin"),
  createPrerequisite
);

prerequisiteRouter.get("/get-prerequisites", getAllPrerequisites);

prerequisiteRouter.get("/get-prerequisite/:id", getSinglePrerequisite);

prerequisiteRouter.put(
  "/update-prerequisite/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  updatePrerequisite
);

prerequisiteRouter.delete(
  "/delete-prerequisite/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  deletePrerequisite
);

export default prerequisiteRouter;
