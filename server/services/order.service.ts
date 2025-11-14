import { NextFunction, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import OrderModel from "../models/order.model";
import CourseModel from "../models/course.model";
import { normalizeOrders, normalizeOrder } from "../utils/order.helpers";
import ErrorHandler from "../utils/ErrorHandler";
import mongoose from "mongoose";
import { getInclusiveDateRange } from "../utils/date.helpers";

// create new order
export const newOrder = CatchAsyncError(async (data: any, res: Response, next: NextFunction) => {
    const order = await OrderModel.create(data)

    res.status(201).json({
        success: true,
        order: order
    })
})

// Get all orders with pagination, filters, sorting
export const getAllOrdersService = async (query: any, res: Response) => {
    let page = parseInt(String(query?.page ?? "1"), 10);
    let limit = parseInt(String(query?.limit ?? "10"), 10);
    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100;
    const skip = (page - 1) * limit;

    const status = typeof query?.status !== "undefined" ? String(query.status).trim() : undefined; 
    const method = typeof query?.method !== "undefined" ? String(query.method).trim() : undefined;
    const { from: dateFrom, to: dateTo } = getInclusiveDateRange(query);
    const keyword = typeof query?.keyword !== "undefined" ? String(query.keyword).trim() : "";

    const filter: any = {};
    if (status) {
        filter["payment_info.status"] = status;
    }
    if (method) {
        filter["payment_method"] = method;
    }
    if (dateFrom || dateTo) {
        filter.createdAt = {} as any;
        if (dateFrom && !Number.isNaN(dateFrom.getTime())) filter.createdAt.$gte = dateFrom;
        if (dateTo && !Number.isNaN(dateTo.getTime())) filter.createdAt.$lte = dateTo;
    }

    if (keyword.length > 0) {
        const or: any[] = [];
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escaped, "i");
        or.push({ "payment_info.payer_email": { $regex: regex } });
        // legacy string match (in case of old data)
        or.push({ userId: keyword });
        // if keyword is a valid ObjectId, also match ref equality
        if (mongoose.Types.ObjectId.isValid(keyword)) {
            or.push({ userId: new mongoose.Types.ObjectId(keyword) });
        }
        or.push({ courseId: keyword });
        or.push({ "items.courseId": keyword });
        filter.$or = or;
    }

    const allowedSortFields = ["createdAt", "name"] as const;
    const sortBy = allowedSortFields.includes(String(query?.sortBy) as any)
        ? String(query.sortBy)
        : "createdAt";
    const sortOrder = String(query?.sortOrder) === "asc" ? 1 : -1;
    const sort: any =
        sortBy === "name"
            ? { "payment_info.payer_name": sortOrder, createdAt: -1 }
            : { createdAt: sortOrder };

    const [orders, total] = await Promise.all([
        OrderModel.find(filter)
            .populate('userId', 'name email avatar')
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        OrderModel.countDocuments(filter),
    ]);
    const normalized = normalizeOrders(orders).map((o: any) => ({
        ...o,
        payer_name: o?.payment_info?.payer_name ?? undefined,
        payer_email: o?.payment_info?.payer_email ?? undefined,
    }));

    res.status(200).json({
        success: true,
        paginatedResult: {
            data: normalized,
            meta: {
                totalItems: total,
                totalPages: Math.ceil(total / limit) || 0,
                currentPage: page,
                pageSize: limit,
            },
        },
    });
}

// Get all paid orders
export const getPaidOrdersService = async (res: Response) => {
    const orders = await OrderModel.find({
        $or: [
            { "payment_info.status": "paid" },
            { "payment_info.status": "succeeded" }
        ]
    }).populate('userId', 'name email avatar').sort({ createdAt: -1 }).lean();
    const normalized = normalizeOrders(orders);

    res.status(200).json({
        success: true,
        orders: normalized,
    });
}

export const getOrderDetailService = async (
  orderId: string,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return next(new ErrorHandler("Invalid order id", 400));
    }
    const order = await OrderModel.findById(orderId).populate('userId', 'name email avatar');
    if (!order) {
      return next(new ErrorHandler("Order not found", 404));
    }

    const normalized = normalizeOrder(order);

    const itemCourseIds: string[] = Array.isArray(normalized?.items)
      ? normalized.items
          .map((it: any) => String(it?.courseId || ""))
          .filter((id: string) => id && mongoose.Types.ObjectId.isValid(id))
      : [];

    if (normalized?.courseId && mongoose.Types.ObjectId.isValid(String(normalized.courseId))) {
      itemCourseIds.push(String(normalized.courseId));
    }

    const uniqueCourseIds = [...new Set(itemCourseIds)];

    const courses = uniqueCourseIds.length
      ? await CourseModel.find({ _id: { $in: uniqueCourseIds } })
          .select("_id name price thumbnail creatorId")
          .populate("creatorId", "name email avatar")
          .lean()
      : [];

    const courseMap = new Map<string, any>(
      courses.map((c: any) => [String(c._id), c])
    );

    const items = Array.isArray(normalized?.items)
      ? normalized.items.map((it: any) => {
          const cid = String(it?.courseId || "");
          const found = courseMap.get(cid);
          return found ? found : it;
        })
      : normalized?.items;

    return res.status(200).json({
      success: true,
      order: { ...normalized, items },
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};


export const getUserOrderDetailService = async (
  user: any,
  orderId: string,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return next(new ErrorHandler("Invalid order id", 400));
    }

    const order = await OrderModel.findById(orderId).populate('userId', 'name email avatar');
    if (!order) {
      return next(new ErrorHandler("Order not found", 404));
    }

    if (String((order as any).userId?._id || (order as any).userId) !== String(user?._id)) {
      return next(new ErrorHandler("You do not have access to this order", 403));
    }

    const normalized = normalizeOrder(order);

    const itemCourseIds: string[] = Array.isArray(normalized?.items)
      ? normalized.items
          .map((it: any) => String(it?.courseId || ""))
          .filter((id: string) => id && mongoose.Types.ObjectId.isValid(id))
      : [];

    if (normalized?.courseId && mongoose.Types.ObjectId.isValid(String(normalized.courseId))) {
      itemCourseIds.push(String(normalized.courseId));
    }

    const uniqueCourseIds = [...new Set(itemCourseIds)];

    const courses = uniqueCourseIds.length
      ? await CourseModel.find({ _id: { $in: uniqueCourseIds } })
          .select("_id name price thumbnail creatorId")
          .populate("creatorId", "name email avatar")
          .lean()
      : [];

    const courseMap = new Map<string, any>(
      courses.map((c: any) => [String(c._id), c])
    );

    const items = Array.isArray(normalized?.items)
      ? normalized.items.map((it: any) => {
          const cid = String(it?.courseId || "");
          const found = courseMap.get(cid);
          return found ? found : it;
        })
      : normalized?.items;

    return res.status(200).json({
      success: true,
      order: { ...normalized, items },
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

export const getTutorOrderDetailService = async (
  user: any,
  orderId: string,
  res: Response,
  next: NextFunction
) => {
  try {
    if (String(user?.role) !== "tutor") {
      return next(new ErrorHandler("Forbidden", 403));
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return next(new ErrorHandler("Invalid order id", 400));
    }

    const order = await OrderModel.findById(orderId).populate('userId', 'name email avatar');
    if (!order) {
      return next(new ErrorHandler("Order not found", 404));
    }

    const normalized = normalizeOrder(order);

    const itemCourseIds: string[] = Array.isArray(normalized?.items)
      ? normalized.items
          .map((it: any) => String(it?.courseId || ""))
          .filter((id: string) => id && mongoose.Types.ObjectId.isValid(id))
      : [];

    if (normalized?.courseId && mongoose.Types.ObjectId.isValid(String(normalized.courseId))) {
      itemCourseIds.push(String(normalized.courseId));
    }

    const uniqueCourseIds = [...new Set(itemCourseIds)];

    if (uniqueCourseIds.length === 0) {
      return next(new ErrorHandler("Order does not reference any course", 400));
    }

    const courses = await CourseModel.find({ _id: { $in: uniqueCourseIds } })
      .select("_id name price thumbnail creatorId")
      .populate("creatorId", "name email avatar")
      .lean();
    const tutorOwnsAny = courses.some(
      (c: any) =>
        String(c?.creatorId?._id || c?.creatorId) === String(user._id)
    );
    if (!tutorOwnsAny) {
      return next(new ErrorHandler("You do not have access to this order", 403));
    }

    const courseMap = new Map<string, any>(
      courses.map((c: any) => [String(c._id), c])
    );

    const items = Array.isArray(normalized?.items)
      ? normalized.items.map((it: any) => {
          const cid = String(it?.courseId || "");
          const found = courseMap.get(cid);
          return found ? found : it;
        })
      : normalized?.items;

    return res.status(200).json({
      success: true,
      order: { ...normalized, items },
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};


export const getTutorOrdersService = async (
  user: any,
  query: any,
  res: Response,
  next: NextFunction
) => {
  try {
    if (String(user?.role) !== "tutor") {
      return next(new ErrorHandler("Forbidden", 403));
    }

    let page = parseInt(String(query?.page ?? "1"), 10);
    let limit = parseInt(String(query?.limit ?? "10"), 10);
    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100;
    const skip = (page - 1) * limit;

    // Find course ids owned by tutor
    const tutorCourses = await CourseModel.find({ creatorId: user._id }).select("_id");
    const courseIds = tutorCourses.map((c: any) => String(c._id));
    if (courseIds.length === 0) {
      return res.status(200).json({
        success: true,
        paginatedResult: {
          data: [],
          meta: { totalItems: 0, totalPages: 0, currentPage: page, pageSize: limit },
        },
      });
    }

    const status = typeof query?.status !== "undefined" ? String(query.status).trim() : undefined;
    const method = typeof query?.method !== "undefined" ? String(query.method).trim() : undefined;
    const { from: dateFrom, to: dateTo } = getInclusiveDateRange(query);

    const filter: any = {
      $or: [
        { courseId: { $in: courseIds } },
        { "items.courseId": { $in: courseIds } },
      ],
    };

    if (status) filter["payment_info.status"] = status;
    if (method) filter["payment_method"] = method;
    if (dateFrom || dateTo) {
      filter.createdAt = {} as any;
      if (dateFrom && !Number.isNaN(dateFrom.getTime())) filter.createdAt.$gte = dateFrom;
      if (dateTo && !Number.isNaN(dateTo.getTime())) filter.createdAt.$lte = dateTo;
    }

    const allowedSortFields = ["createdAt"] as const;
    const sortBy = allowedSortFields.includes(String(query?.sortBy) as any)
      ? String(query.sortBy)
      : "createdAt";
    const sortOrder = String(query?.sortOrder) === "asc" ? 1 : -1;
    const sort: any = { [sortBy]: sortOrder };

    const [orders, total] = await Promise.all([
      OrderModel.find(filter)
        .populate('userId', 'name email avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      OrderModel.countDocuments(filter),
    ]);

    const normalized = normalizeOrders(orders);

    return res.status(200).json({
      success: true,
      paginatedResult: {
        data: normalized,
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

// Get user orders with pagination and filters
export const getUserOrdersService = async (
  user: any,
  query: any,
  res: Response
) => {
  let page = parseInt(String(query?.page ?? "1"), 10);
  let limit = parseInt(String(query?.limit ?? "10"), 10);
  if (Number.isNaN(page) || page < 1) page = 1;
  if (Number.isNaN(limit) || limit < 1) limit = 10;
  if (limit > 100) limit = 100;
  const skip = (page - 1) * limit;

  const status = typeof query?.status !== "undefined" ? String(query.status).trim() : undefined;
  const method = typeof query?.method !== "undefined" ? String(query.method).trim() : undefined;
  const { from: dateFrom, to: dateTo } = getInclusiveDateRange(query);

  const filter: any = { userId: user._id };

  if (status) {
    filter["payment_info.status"] = status;
  }
  if (method) {
    filter["payment_method"] = method;
  }
  if (dateFrom || dateTo) {
    filter.createdAt = {} as any;
    if (dateFrom && !Number.isNaN(dateFrom.getTime())) filter.createdAt.$gte = dateFrom;
    if (dateTo && !Number.isNaN(dateTo.getTime())) filter.createdAt.$lte = dateTo;
  }

  const allowedSortFields = ["createdAt"] as const;
  const sortBy = allowedSortFields.includes(String(query?.sortBy) as any)
    ? String(query.sortBy)
    : "createdAt";
  const sortOrder = String(query?.sortOrder) === "asc" ? 1 : -1;
  const sort: any = { [sortBy]: sortOrder };

  const [orders, total] = await Promise.all([
    OrderModel.find(filter)
      .populate('userId', 'name email avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    OrderModel.countDocuments(filter),
  ]);

  const normalized = normalizeOrders(orders);

  res.status(200).json({
    success: true,
    paginatedResult: {
      data: normalized,
      meta: {
        totalItems: total,
        totalPages: Math.ceil(total / limit) || 0,
        currentPage: page,
        pageSize: limit,
      },
    },
  });
};