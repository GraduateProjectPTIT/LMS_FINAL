// src/controllers/user.controller.ts
import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import { getAllUsersService } from "../services/admin.service";

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

// --- CẬP NHẬT VAI TRÒ (ADMIN) ---
// export const updateUserRole = CatchAsyncError(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const { id, role } = req.body;
//     const user = await updateUserRoleService(id, role);
//     res.status(200).json({ success: true, user });
//   }
// );
