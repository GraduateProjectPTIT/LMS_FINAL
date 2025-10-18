// src/controllers/user.controller.ts
import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import {
  adminCreateEnrollmentService,
  getAllUsersService,
  getUserDetailService,
} from "../services/admin.service";

// --- XÓA USER (ADMIN) ---
// export const deleteUser = CatchAsyncError(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const { id } = req.params;
//     await deleteUserService(id);
//     res
//       .status(200)
//       .json({ success: true, message: "User deleted successfully" });
//   }
// );

// --- LẤY TẤT CẢ USERS (ADMIN) ---
export const getAllUsers = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1. Call the service and pass the request query
    const paginatedUsers = await getAllUsersService(req.query);

    // 2. Send the response with the data returned from the service
    res.status(200).json({
      success: true,
      ...paginatedUsers,
    });
  }
);

export const getUserDetail = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    // Lấy id từ URL params
    const { id } = req.params;

    // Gọi service đã được refactor
    const userDetail = await getUserDetailService(id);

    // Service sẽ ném ErrorHandler nếu không tìm thấy
    res.status(200).json({
      success: true,
      user: userDetail,
    });
  }
);

export const createEnrollment = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    // Lấy từ body của request
    const { userId, courseId } = req.body;

    // Validation đầu vào cơ bản

    const newEnrollment = await adminCreateEnrollmentService(userId, courseId);

    res.status(201).json({
      success: true,
      message: "Ghi danh học viên thành công.",
      enrollment: newEnrollment,
    });
  }
);

// --- CẬP NHẬT VAI TRÒ (ADMIN) ---
// export const updateUserRole = CatchAsyncError(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const { id, role } = req.body;
//     const user = await updateUserRoleService(id, role);
//     res.status(200).json({ success: true, user });
//   }
// );
