// src/services/auth.service.ts
import { Response } from "express";
import userModel, { IUser, UserRole } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import sendMail from "../utils/sendMail";
import path from "path";
import ejs from "ejs";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { redis } from "../utils/redis";
import {
  IActivationRequest,
  IActivationToken,
  IRegistrationBody,
  ISocialAuthBody,
  IResendCodeRequest,
  IUpdatePassword, // IUpdatePasswordService was renamed to IUpdatePassword
  ILoginRequest,
  IResetPasswordToken,
  IResetPasswordPayload,
  IDecodedPayload,
  IUserResponse,
} from "../types/auth.types";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import mongoose, { Types } from "mongoose";
import { studentModel } from "../models/student.model";
import { tutorModel } from "../models/tutor.model";
import { adminModel } from "../models/admin.model";
import { IStudent } from "../types/user.types";
import { ICategory } from "../models/category.model";
import NotificationModel from "../models/notification.model";
import { createNotificationService } from "./notification.service";

// --- HELPER: TẠO TOKEN KÍCH HOẠT ---

export const _toUserResponse = (user: IUser): IUserResponse => {
  // 1. Chuyển Mongoose Document thành plain object
  const userObject = user.toObject();

  // 2. Tách các trường không cần thiết ra
  const {
    password,
    resetToken,
    activationCode,
    activationToken,
    ...userResponseData
  } = userObject;

  // 3. Xử lý các giá trị mặc định cho các trường có thể null/undefined
  return {
    ...userResponseData,
    isVerified: userResponseData.isVerified ?? false,
    avatar: {
      url: userResponseData.avatar?.url ?? "",
    },
    socials: userResponseData.socials ?? {
      facebook: "",
      instagram: "",
      tiktok: "",
    },
  };
};

const createActivationToken = (user: IRegistrationBody): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const token = jwt.sign(
    { user, activationCode },
    process.env.ACTIVATION_SECRET as Secret,
    { expiresIn: "3h" }
  );
  return { token, activationCode };
};

// --- RESET PASSWORD ---

export const createResetPasswordToken = (user: IUser): IResetPasswordToken => {
  // Tạo mã code 4 chữ số ngẫu nhiên
  const resetCode = Math.floor(1000 + Math.random() * 9000).toString();

  // Tạo JWT, chỉ chứa ID của user và mã code
  const token = jwt.sign(
    {
      id: user._id,
    },
    process.env.RESET_PASSWORD_SECRET as Secret, // !! Dùng một SECRET KEY khác để tăng bảo mật
    { expiresIn: "1h" } // Đặt thời gian hết hạn
  );

  return { token, resetCode };
};

export const forgotPasswordService = async (email: string) => {
  const user = await userModel.findOne({ email });

  if (!user) {
    return {
      success: false,
      message: `Email is invalid`,
    };
  }

  // 2. Tạo token và mã code reset
  const resetTokenData = createResetPasswordToken(user);
  const resetToken = resetTokenData.token;

  // cập nhật resetToken
  user.resetToken = resetToken;
  await user.save();

  // 3. Chuẩn bị dữ liệu cho email template
  const data = {
    user: { name: user.name }, // Lấy tên user từ DB
    resetToken: resetToken,
  };

  const templatePath = path.join(__dirname, "../mails/reset-password-mail.ejs");

  // 4. Render và gửi email (logic giống hệt của bạn)
  // Bạn sẽ cần tạo một file template mới là `reset-password-mail.ejs`
  await ejs.renderFile(templatePath, data);

  try {
    await sendMail({
      email,
      subject: "Reset your password",
      template: "reset-password-mail.ejs", // Dùng template mới
      data,
    });

    // 5. Trả về token và thông báo thành công
    // Trả về token tương tự như luồng register
    return {
      success: true,
      message: `Please check your email: ${email} for your password reset code!`,
      resetToken: resetToken, // Trả về JWT chứa thông tin reset
    };
  } catch (error: any) {
    throw new ErrorHandler(error.message, 400);
  }
};

export const resetPasswordService = async (
  resetToken: string, // Đây chính là JWT từ URL
  newPassword: string
): Promise<{ message: string }> => {
  try {
    const decoded = jwt.verify(
      resetToken,
      process.env.RESET_PASSWORD_SECRET as string
    ) as IDecodedPayload;
    const user = await userModel.findOne({ resetToken: resetToken });

    // 2. Nếu không tìm thấy, token không hợp lệ hoặc đã được sử dụng
    if (!user) {
      throw new ErrorHandler(
        "Password reset token is invalid or has already been used.",
        400
      );
    }

    // Cập nhật mật khẩu mới
    user.password = newPassword;
    user.resetToken = undefined;

    // Dòng `user.resetToken = undefined;` đã được XÓA BỎ
    // vì chúng ta không lưu token trong user model nữa.

    await user.save();

    return { message: "Password has been reset successfully." };
  } catch (error) {
    console.log(error);
    throw new ErrorHandler(
      "Password reset token is invalid or has expired.",
      400
    );
  }
};

// --- NGHIỆP VỤ ĐĂNG KÝ ---
export const registerUserService = async (body: IRegistrationBody) => {
  // Destructure các thuộc tính từ body, gán role mặc định là student
  const { name, email, password, role = UserRole.Student } = body;

  // 1. Kiểm tra email tồn tại (nên làm trước khi bắt đầu transaction)
  const isEmailExist = await userModel.findOne({ email });
  if (isEmailExist) {
    throw new ErrorHandler("Email already exists", 400);
  }

  // 2. Bắt đầu một session cho transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 3. Tạo activation token
    const activationTokenData = createActivationToken({
      name,
      email,
      password,
      role,
    });

    // 4. Tạo user và profile tương ứng BÊN TRONG TRANSACTION

    // Tạo user mới, chưa lưu
    const user = {
      name,
      email,
      password, // Mật khẩu sẽ được hash bởi pre-save hook
      role,
      activationCode: activationTokenData.activationCode,
      activationToken: activationTokenData.token,
      isVerified: false,
    };

    // Dùng create với session để đưa hành động này vào transaction
    const newUserArray = await userModel.create([user], { session });
    const newUser = newUserArray[0];

    switch (role) {
      case UserRole.Student: {
        const newStudentDoc = new studentModel({ userId: newUser._id });
        const savedProfile = await newStudentDoc.save({ session });

        if (savedProfile && savedProfile._id) {
          newUser.studentProfile = savedProfile._id as Types.ObjectId;
        } else {
          throw new ErrorHandler("Failed to create student profile.", 500);
        }
        break;
      }

      case UserRole.Tutor: {
        const newTutorDoc = new tutorModel({ userId: newUser._id });
        const savedProfile = await newTutorDoc.save({ session });

        if (savedProfile && savedProfile._id) {
          newUser.tutorProfile = savedProfile._id as Types.ObjectId;
        } else {
          throw new ErrorHandler("Failed to create tutor profile.", 500);
        }
        break;
      }

      default:
        throw new ErrorHandler("Invalid role specified", 400);
    }

    // Lưu lại user với thông tin profile đã được liên kết
    await newUser.save({ session });

    // 5. Nếu mọi thứ thành công, commit transaction
    await session.commitTransaction();

    // 6. Gửi email (chỉ gửi khi transaction đã thành công)
    const data = {
      user: { name: newUser.name },
      activationCode: activationTokenData.activationCode,
    };

    try {
      if (newUser?._id) {
        await createNotificationService({
          userId: newUser._id.toString(),
          title: "Finish your survey",
          message: `Spend less than 1 minute to complete the survey for course recommendation!`,
        });
      }
    } catch (error) {
      console.error("Failed to create registration notification:", error);
    }

    // Render email template (không cần chờ)

    ejs.renderFile(path.join(__dirname, "../mails/activation-mail.ejs"), data);

    try {
      await sendMail({
        email: newUser.email,
        subject: "Activate your account",
        template: "activation-mail.ejs",
        data,
      });

      return {
        success: true,
        message: `Please check your email: ${email} to activate your account!`,
        activationToken: activationTokenData.token, // Trả về token cho FE (nếu cần)
      };
    } catch (error: any) {
      // Nếu gửi mail lỗi, không cần throw lỗi hệ thống, chỉ cần log lại
      console.error("Failed to send activation email:", error);
      // User vẫn được tạo thành công, có thể có chức năng "gửi lại email kích hoạt"
      return {
        success: true,
        message: `Account created, but failed to send activation email. Please try the 'resend activation' feature.`,
      };
    }
  } catch (error: any) {
    // 7. Nếu có bất kỳ lỗi nào trong quá trình, hủy bỏ transaction
    await session.abortTransaction();
    throw new ErrorHandler(error.message, 400);
  } finally {
    // 8. Luôn kết thúc session
    session.endSession();
  }
};

// NGHIỆP VỤ GỬI LẠI ACTIVATION CODE
export const resendCodeService = async (body: IResendCodeRequest) => {
  const { email } = body;

  // 1. Tìm người dùng bằng email
  const user = await userModel.findOne({ email });

  // Nếu không tìm thấy user, ném lỗi
  if (!user) {
    throw new ErrorHandler("User with this email does not exist", 404);
  }

  // 2. Kiểm tra xem tài khoản đã được kích hoạt hay chưa
  if (user.isVerified) {
    throw new ErrorHandler("This account has already been activated.", 400);
  }

  // 3. Tạo lại mã và token kích hoạt mới
  // Giả sử hàm createActivationToken có thể hoạt động chỉ với name và email
  const activationTokenData = createActivationToken(user);

  // 4. Cập nhật mã và token mới vào bản ghi user
  user.activationCode = activationTokenData.activationCode;
  user.activationToken = activationTokenData.token;
  await user.save();

  // 5. Chuẩn bị dữ liệu để gửi email
  const data = {
    user: { name: user.name },
    activationCode: activationTokenData.activationCode,
  };

  // 6. Gửi lại email kích hoạt
  try {
    await sendMail({
      email: user.email,
      subject: "Activate your account - New Code", // Tiêu đề có thể khác để phân biệt
      template: "activation-mail.ejs",
      data,
    });

    return {
      success: true,
      message: `A new activation code has been sent to ${email}. Please check your email!`,
    };
  } catch (error: any) {
    // Xử lý lỗi nếu không gửi được email
    throw new ErrorHandler(error.message, 400);
  }
};

// --- NGHIỆP VỤ KÍCH HOẠT USER ---
export const activateUserService = async (body: IActivationRequest) => {
  const { email, activation_code } = body;

  const user = await userModel
    .findOne({
      email: email,
      activationCode: activation_code,
    })
    .select("+activationCode +activationToken");

  if (!user) {
    throw new ErrorHandler("Invalid activation code or token", 400);
  }

  console.log(user);
  if (!user.activationToken) {
    throw new ErrorHandler("Activation token not found for this user.", 400);
  }

  try {
    const activationSecret = process.env.ACTIVATION_SECRET;
    if (!activationSecret) {
      throw new ErrorHandler("Server configuration error.", 500);
    }
    jwt.verify(user.activationToken, activationSecret);
  } catch (error) {
    throw new ErrorHandler(
      "Your activation token is invalid or has expired.",
      400
    );
  }

  // 3. Cập nhật trạng thái và xóa các trường kích hoạt
  user.isVerified = true;
  user.activationCode = undefined; // Xóa mã sau khi đã sử dụng
  user.activationToken = undefined; // Xóa token sau khi đã sử dụng

  await user.save();
};

// --- NGHIỆP VỤ ĐĂNG NHẬP ---
export const loginUserService = async (
  body: ILoginRequest
): Promise<IUserResponse> => {
  const { email, password } = body;

  if (!email || !password) {
    throw new ErrorHandler("Please enter email and password", 400);
  }

  const userFromDB = await userModel.findOne({ email }).select("+password");

  if (!userFromDB || !(await userFromDB.comparePassword(password))) {
    throw new ErrorHandler("Invalid email or password", 400);
  }

  const baseResponse = _toUserResponse(userFromDB);

  if (userFromDB.role === "tutor") {
    const tutorProfile = await tutorModel
      .findOne({ userId: userFromDB._id })
      .populate<{ expertise: ICategory[] }>("expertise"); // <-- POPULATE Ở ĐÂY

    let expertiseTitles: string[] = [];

    if (tutorProfile && tutorProfile.expertise) {
      // Dùng .map() để tạo một mảng mới chỉ chứa các 'title'
      expertiseTitles = tutorProfile.expertise.map(
        (category) => category.title
      );
    }

    return {
      ...baseResponse,
      expertise: expertiseTitles,
    };
  }

  if (userFromDB.role === "student") {
    // 1. Tìm student profile và populate trường 'interests'
    const studentProfile = await studentModel
      .findOne({ userId: userFromDB._id })
      .populate<{ interests: ICategory[] }>("interests"); // <-- Populate 'interests'
    let interestTitles: string[] = [];

    // 2. Kiểm tra và dùng .map() để lấy ra các title
    if (studentProfile && studentProfile.interests) {
      interestTitles = studentProfile.interests.map(
        (category) => category.title
      );
    }

    // 3. Trả về response với mảng 'interests' chứa các title
    return {
      ...baseResponse,
      interests: interestTitles, // <-- Trả về trường 'interests'
    };
  }

  // 3. Nếu không phải role đặc biệt, trả về response cơ bản
  return baseResponse;
};

// --- NGHIỆP VỤ ĐĂNG NHẬP MẠNG XÃ HỘI ---
export const socialAuthService = async (body: ISocialAuthBody) => {
  const { email, name, avatar } = body;

  let user = await userModel.findOne({ email });

  if (!user) {
    // --- Kịch bản 1: Người dùng mới -> Áp dụng logic tạo profile ---
    // 1. Lấy role TỪ BÊN TRONG KỊCH BẢN NÀY
    const { role } = body;
    // 2. Kiểm tra xem 'role' có được cung cấp không
    if (!role) {
      throw new ErrorHandler(
        "Role is required for new registration",
        400 // 400 Bad Request
      );
    }

    // 3. Kiểm tra 'role' có hợp lệ không
    const isValidRole = Object.values(UserRole).includes(role as UserRole);
    if (!isValidRole) {
      throw new ErrorHandler(
        `Role: "${role}" is invalid`,
        400 // 400 Bad Request
      );
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Dữ liệu người dùng mới
      const newUserPayload = {
        email,
        name,
        avatar: {
          public_id: "social_login", // Đánh dấu đây là avatar từ social
          url: avatar,
        },
        role: role,
        isVerified: true, // User từ social login luôn được xác thực
      };

      // Tạo user mới BÊN TRONG TRANSACTION
      const newUserArray = await userModel.create([newUserPayload], {
        session,
      });
      const newUser = newUserArray[0];

      // Tạo profile tương ứng với vai trò
      switch (role) {
        case UserRole.Student: {
          const newStudentDoc = new studentModel({ userId: newUser._id });
          const savedProfile = await newStudentDoc.save({ session });
          newUser.studentProfile = savedProfile._id as Types.ObjectId;
          break;
        }
        case UserRole.Tutor: {
          const newTutorDoc = new tutorModel({ userId: newUser._id });
          const savedProfile = await newTutorDoc.save({ session });
          newUser.tutorProfile = savedProfile._id as Types.ObjectId;
          break;
        }
        default:
          throw new ErrorHandler("Invalid role", 400);
      }

      // Lưu lại user với thông tin profile đã liên kết
      await newUser.save({ session });

      // Commit transaction khi mọi thứ thành công
      await session.commitTransaction();

      // Gán newUser cho biến user để sử dụng ở bước tạo token
      user = newUser;
    } catch (error: any) {
      // Nếu có lỗi, hủy bỏ mọi thay đổi
      await session.abortTransaction();
      throw new ErrorHandler(
        `There was an error when creating account, please retry`,
        500
      );
    } finally {
      // Luôn kết thúc session
      session.endSession();
    }
  } else {
    // --- Kịch bản 2: Người dùng đã tồn tại -> Chỉ cập nhật avatar nếu cần ---
    if (user.avatar?.url !== avatar) {
      user.avatar = {
        public_id: user.avatar?.public_id || "social_login",
        url: avatar,
      };
      await user.save();
    }
  }

  // Tạo và trả về tokens (dùng cho cả 2 kịch bản)
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return { user: _toUserResponse(user), accessToken, refreshToken };
};

// --- NGHIỆP VỤ ĐĂNG XUẤT ---
export const logoutUserService = async (res: Response, userId: string) => {
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");

  return "Logged out successfully";
};

// --- NGHIỆP VỤ LÀM MỚI TOKEN ---
export const updateAccessTokenService = async (token: string) => {
  if (!token) {
    throw new ErrorHandler("Could not refresh token", 400);
  }
  const decoded = jwt.verify(
    token,
    process.env.REFRESH_TOKEN as string
  ) as JwtPayload;

  const user = await userModel.findById(decoded.id);

  if (!user) {
    throw new ErrorHandler("User not found, please login again", 400);
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return { user, accessToken, refreshToken };
};
