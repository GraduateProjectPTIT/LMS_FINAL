import { NextFunction, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import OrderModel from "../models/order.model";
import { normalizeOrders } from "../utils/order.helpers";

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
    const dateFrom = query?.dateFrom ? new Date(String(query.dateFrom)) : undefined;
    const dateTo = query?.dateTo ? new Date(String(query.dateTo)) : undefined;
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
        or.push({ userId: keyword });
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
            .sort(sort)
            .skip(skip)
            .limit(limit),
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
}

// Get all paid orders
export const getPaidOrdersService = async (res: Response) => {
    const orders = await OrderModel.find({
        $or: [
            { "payment_info.status": "paid" },
            { "payment_info.status": "succeeded" }
        ]
    }).sort({ createdAt: -1 });
    const normalized = normalizeOrders(orders);

    res.status(200).json({
        success: true,
        orders: normalized,
    });
}