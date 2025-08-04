import { Response } from "express";
import userModel from "../models/user.model";
import { redis } from "../utils/redis";

export const getUserById = async (id: string, res: Response) => {
    // const userJson = await redis.get(id)

    // if (userJson) {
    //     const user = JSON.parse(userJson)
    //     res.status(200).json({
    //         success: true,
    //         user,
    //     })
    // }
    const user = await userModel.findById(id).select('-password');
    res.status(200).json({
        success: true,
        user
    })

}

export const getAllUsersService = async (res: Response) => {
    const allUsers = await userModel.find().sort({ createdAt: -1 });
    if (allUsers.length === 0) {
        throw new Error("No users found");
    }
    res.status(200).json({
        success: true,
        users: allUsers
    })
}

export const updatetUserRoleService = async (id: string, res: Response, role: string) => {
    const findUser = await userModel.findByIdAndUpdate(
        id,
        { role },
        { new: true }
    );
    if (!findUser) {
        throw new Error("User not found");
    }
    res.status(200).json({
        success: true,
        user: findUser
    })
}