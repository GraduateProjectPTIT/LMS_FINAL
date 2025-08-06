require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user.model";
import {
  getUserById,
  getAllUsersService,
  updatetUserRoleService,
} from "../services/user.service";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import sendMail from "../utils/sendMail";
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from "../utils/jwt";
import { redis } from "../utils/redis";

import ejs from "ejs";
import path from "path";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";

import cloudinary, {
  UploadApiResponse,
  UploadApiErrorResponse,
} from "cloudinary";
import multer from "multer";
import { Readable } from "stream";
import {
  IActivationRequest,
  IActivationToken,
  ILoginRequest,
  IRegistrationBody,
  ISocialAuthBody,
  IUpdatePassword,
} from "../types/auth.types";
import { IUpdateUserInfo } from "../types/user.types";

// Set up multer storage configuration to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single("avatar"); // 'avatar' is the key used to upload file

export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: "5m",
    }
  );

  return { token, activationCode };
};

export const register = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, confirmPassword } = req.body;

      const isEmailExist = await userModel.findOne({ email });
      if (isEmailExist) {
        return next(new ErrorHandler("Email already exist", 400));
      }

      const user: IRegistrationBody = {
        name,
        email,
        password,
        confirmPassword,
      };

      if (password !== confirmPassword) {
        return next(new ErrorHandler("Passwords do not match", 400));
      }

      const activationToken = createActivationToken(user);

      const activationCode = activationToken.activationCode;

      const data = { user: { name: user.name }, activationCode };
      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/activation-mail.ejs"),
        data
      );

      try {
        await sendMail({
          email: user.email,
          subject: "Activate your account",
          template: "activation-mail.ejs",
          data,
        });

        res.status(201).json({
          success: true,
          message: `Please check your email: ${user.email} to activate your account!`,
          activationToken: activationToken.token,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const activateUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } =
        req.body as IActivationRequest;

      const newUser: { user: IUser; activationCode: string } = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string
      ) as { user: IUser; activationCode: string };

      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler("Invalid activation code", 400));
      }

      const { name, email, password } = newUser.user;

      const existUser = await userModel.findOne({ email });

      if (existUser) {
        return next(new ErrorHandler("Email already exist", 400));
      }

      const user = await userModel.create({
        name,
        email,
        password,
      });

      res.status(201).json({
        success: true,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const login = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;

      if (!email || !password) {
        return next(new ErrorHandler("Please enter email and password", 400));
      }

      const user = await userModel.findOne({ email }).select("+password");
      if (!user) {
        return next(new ErrorHandler("Invalid email or password", 400));
      }

      const isPasswordMatch = await user.comparePassword(password);
      if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid email or password", 400));
      }

      const userWithoutPassword = (await userModel.findOne({ email })) as IUser;

      sendToken(userWithoutPassword, 200, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const logout = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });

      const userId = req.user?._id?.toString() || "";

      // if (userId) {
      //     redis.del(userId); // Delete session from Redis
      // } else {
      //     console.error("No user ID found to delete session.");
      // }

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const updateAccessToken = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refresh_token as string;
      const decoded = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN as string
      ) as JwtPayload;

      if (!decoded) {
        return next(new ErrorHandler("Could not refresh token", 400));
      }

      const user = await userModel.findById(decoded.id);

      // 3. Nếu không tìm thấy user, token không còn hợp lệ
      if (!user) {
        return next(
          new ErrorHandler("User not found, please login again", 400)
        );
      }

      //   const user = JSON.parse(session);

      const accessToken = jwt.sign(
        { id: user._id },
        process.env.ACCESS_TOKEN as string,
        {
          expiresIn: "1h",
        }
      );
      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN as string,
        {
          expiresIn: "1d",
        }
      );

      req.user = user;

      res.cookie("access_token", accessToken, accessTokenOptions);
      res.cookie("refresh_token", refreshToken, refreshTokenOptions);

      //   await redis.set(user._id, JSON.stringify(user), "EX", 604800); //7 days

      return res.status(200).json({
        success: true,
        message: "Tokens refreshed successfully",
        accessToken,
        refreshToken,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const getUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id as string;
      getUserById(userId, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const socialAuth = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, avatar } = req.body as ISocialAuthBody;

      let user = await userModel.findOne({ email });

      if (!user) {
        // Create new user
        user = await userModel.create({
          email,
          name,
          avatar: {
            public_id: "default_id",
            url: avatar,
          },
        });
      } else {
        if (user.avatar?.url !== avatar) {
          user.avatar = {
            public_id: user.avatar?.public_id || "",
            url: avatar,
          };
          await user.save(); // Save updated avatar
        }
      }
      sendToken(user, 200, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const updateUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email } = req.body as IUpdateUserInfo;
      const userId = req.user?._id;
      const user = await userModel.findById(userId);

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      if (email) {
        const isEmailExist = await userModel.findOne({ email });
        if (isEmailExist) {
          return next(new ErrorHandler("Email already exist", 400));
        }
        user.email = email;
      }

      if (name) {
        user.name = name;
      }

      await user?.save();

      //   await redis.set(userId as string, JSON.stringify(user));

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const updatePassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, newPassword } = req.body as IUpdatePassword;

      if (!oldPassword || !newPassword) {
        return next(new ErrorHandler("Please enter old and new password", 400));
      }

      const userId = req.user?._id;
      const user = await userModel.findById(userId).select("+password");

      if (user?.password == undefined) {
        return next(new ErrorHandler("Invalid user", 400));
      }

      const isPasswordMatch = await user?.comparePassword(oldPassword);

      if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid old password", 400));
      }

      user.password = newPassword;

      await user?.save();

      //   await redis.set(req.user?._id as string, JSON.stringify(user));

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const updateProfilePicture = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, async (err) => {
      if (err) {
        return next(new ErrorHandler("Error uploading file", 400));
      }

      try {
        const { file } = req;
        const userId = req.user?._id;

        if (!file) {
          return next(new ErrorHandler("No file provided", 400));
        }

        // Find the user
        const user = await userModel.findById(userId);
        if (!user) {
          return next(new ErrorHandler("User not found", 404));
        }

        // If the user already has a profile picture (avatar), delete the old one
        if (user?.avatar?.public_id) {
          await cloudinary.v2.uploader.destroy(user.avatar.public_id); // Delete old image from Cloudinary
        }

        // Upload the new image to Cloudinary using the file buffer and promise
        const uploadPromise = new Promise<UploadApiResponse>(
          (resolve, reject) => {
            const uploadStream = cloudinary.v2.uploader.upload_stream(
              {
                folder: "avatars",
                width: 150,
                crop: "scale",
              },
              (
                error: UploadApiErrorResponse | undefined,
                result: UploadApiResponse | undefined
              ) => {
                if (error) {
                  reject(new ErrorHandler(error.message, 400));
                } else if (!result) {
                  reject(new ErrorHandler("Cloudinary upload failed", 400));
                } else {
                  resolve(result); // Resolve with the result from Cloudinary
                }
              }
            );

            const bufferStream = new Readable();
            bufferStream.push(file.buffer);
            bufferStream.push(null);
            bufferStream.pipe(uploadStream);
          }
        );

        // Wait for the upload to finish
        const uploadedImage = await uploadPromise;

        // Update the user's avatar in the database
        user.avatar = {
          public_id: uploadedImage.public_id,
          url: uploadedImage.secure_url,
        };

        await user.save();

        console.log("Updated User Avatar:", user.avatar);

        // Update Redis cache
        // await redis.set(userId as string, JSON.stringify(user));

        // Send response to client
        res.status(201).json({
          success: true,
          user,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    });
  }
);

export const getAllUsers = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllUsersService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const updateUserRole = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, role } = req.body;
      const isUserExits = await userModel.findOne({ email });
      if (isUserExits) {
        const id = isUserExits._id as string;
        updatetUserRoleService(id, res, role);
      } else {
        res.status(400).json({
          success: false,
          message: "User not found",
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const deleteUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const user = await userModel.findById(id);

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      await user.deleteOne({ id });

      //   await redis.del(id);

      res.status(201).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
