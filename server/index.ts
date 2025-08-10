require("dotenv").config();
import express, { NextFunction, Request, Response } from "express";
export const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import { ErrorMidleware } from "./middleware/error";
import userRouter from "./routes/user.route";
import courseRouter from "./routes/course.route";
import orderRouter from "./routes/order.route";
import notificationRouter from "./routes/notification.route";
import analyticsRouter from "./routes/analytics.route";
import layoutRouter from "./routes/layout.route";
import stripeRouter from "./routes/stripe.route";
import benefitRouter from "./routes/benefit.route";
import prerequisiteRouter from "./routes/prerequisite.route";
import { stripeWebhook } from "./controllers/order.controller";

app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
    cors({
        origin: ["http://localhost:3000"],
        credentials: true,
    })
);

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.get("/test", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "API is working",
  });
});

app.use("/api", userRouter);
app.use("/api", courseRouter);
app.use("/api", orderRouter);
app.use("/api", notificationRouter);
app.use("/api", analyticsRouter);
app.use("/api", layoutRouter);
app.use("/api/stripe", stripeRouter);
app.use("/api", benefitRouter);
app.use("/api", prerequisiteRouter);

app.all("*", (req: Request, res: Response, next: NextFunction) => {
  console.log(`404 - Router ${req.originalUrl} not found`);
  const err = new Error(`Router ${req.originalUrl} not found`) as any;
  err.statusCode = 404;
  next(err);
});

app.use(ErrorMidleware);