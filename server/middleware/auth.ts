import { Request, Response, NextFunction } from "express"
import { CatchAsyncError } from "./catchAsyncErrors"
import ErrorHandler from "../utils/ErrorHandler"
import jwt, { JwtPayload } from "jsonwebtoken"
import { redis } from "../utils/redis"
import { updateAccessToken } from "../controllers/user.controller"

// authenticated user
export const isAuthenticated = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const access_token = req.cookies.access_token as string; // access_token luu tru trong cookies

    if (!access_token) {
        // If access_token is missing, try to get refresh_token from cookies
        const refresh_token = req.cookies.refresh_token as string;
        if (!refresh_token) {
            return next(new ErrorHandler("Both access_token and refresh_token are missing", 400));
        }
        // Try to update the access_token using the refresh_token
        try {
            console.log("Trying to update access_token using refresh_token")
            await updateAccessToken(req, res, next);
            return;
        } catch (error: any) {
            return next(new ErrorHandler("Unable to update access_token using refresh_token", 400));
        }
    }

    // If we have the access_token, decode it
    const decoded = jwt.decode(access_token) as JwtPayload

    if (!decoded) {
        return next(new ErrorHandler("access_token is not valid", 400));
    }

    // check if the access token is expired
    if (decoded.exp && decoded.exp <= Date.now() / 1000) {
        try {
            await updateAccessToken(req, res, next);
            return;
        } catch (error: any) {
            return next(new ErrorHandler("Please login to access this resource", 400));
        }
    }

    const user = await redis.get(decoded.id)

    if (!user) {
        return next(new ErrorHandler("User not found", 400));
    }

    req.user = JSON.parse(user)

    next()
})

// validate user role
export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user?.role || '')) {
            return next(new ErrorHandler(`Role: ${req.user?.role} is not allowed to access this resource`, 403))
        }
        next()
    }
}