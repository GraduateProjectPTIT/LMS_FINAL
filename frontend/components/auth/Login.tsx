"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  signInFailure,
  signInStart,
  signInSuccess,
} from "@/redux/user/userSlice";
import { signIn, useSession } from "next-auth/react";
import Loader from "@/components/Loader";
import {
  getFieldStatus,
  getFieldBorderClass,
  getFieldIcon,
} from "@/utils/formFieldHelpers";

import makeup2 from "@/assets/makeup2.webp";
import toast from "react-hot-toast";
import { Separator } from "@/components/ui/separator";
import { TfiEmail } from "react-icons/tfi";
import { RiLockPasswordLine } from "react-icons/ri";
import { FaRegEye } from "react-icons/fa6";
import { FaRegEyeSlash } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { IoAlertCircleOutline } from "react-icons/io5";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const handleShowPassword = (e: any) => {
    e.preventDefault();
    setShowPassword(!showPassword);
  };

  // handle login logic when user want to navigate to page before login
  const dispatch = useDispatch();
  const router = useRouter();

  const searchParams = useSearchParams();

  // Check if there's a callbackUrl from middleware
  const callbackUrl = searchParams?.get("callbackUrl") || "/"; // Default to homepage

  const { currentUser } = useSelector((state: any) => state.user);

  // Redirect logged-in users
  useEffect(() => {
    if (currentUser) {
      router.replace(callbackUrl);
    }
  }, [currentUser, callbackUrl, router]);

  const { data: session } = useSession();

  const [isLoading, setIsLoading] = useState(false);

  // handle login form
  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting, errors, touchedFields },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const watchedFields = watch();

  const onSubmit = async (data: LoginFormValues) => {
    dispatch(signInStart());
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
          credentials: "include",
        }
      );
      const responseData = await res.json();
      if (!res.ok) {
        dispatch(signInFailure("Login failed"));
        toast.error(responseData.message);
        return;
      } else {
        dispatch(signInSuccess(responseData));
        toast.success("Login successfully");
        router.replace(callbackUrl);
      }
    } catch (error: any) {
      console.log(error.message);
      toast.error("Something went wrong. Please try again.");
    }
  };

  // Login qua OAuth
  const handleOAuthLogin = async (provider: "google" | "github") => {
    try {
      // Redirect to /login?social=1 after OAuth
      await signIn(provider, { callbackUrl: "/login?social=1" });
    } catch (error: any) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const isCalled = useRef(false); // Sử dụng useRef để giữ trạng thái qua re-renders

  const sendUserToServer = useCallback(async () => {
    if (!session?.user || isCalled.current) return; // Ngăn gọi API nếu đã được gọi trước đó

    setIsLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/auth/social_check`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: session?.user.email,
            name: session?.user.name,
            avatar: session?.user.image,
          }),
          credentials: "include",
        }
      );

      const data = await res.json().catch(() => ({}));

      // Nếu tài khoản chưa đăng ký, chuyển hướng đến trang đăng ký
      if (data?.status === "ROLE_REQUIRED") {
        toast("Account not registered yet. Please complete registration.");
        setIsLoading(false);
        router.replace(`/signup`);
        return;
      }

      // Nếu đăng nhập thành công
      if (res.ok && data?.success === true) {
        dispatch(signInSuccess(data));
        setIsLoading(false);
        router.replace(callbackUrl || "/");
        return;
      }

      // Xử lý lỗi khác
      toast.error(data?.message || "Failed to authenticate user.");
      setIsLoading(false);
    } catch (error: any) {
      console.log(error.message);
    }
  }, [session, dispatch, router, callbackUrl]);

  // Only trigger social login effect if coming from OAuth (social=1)
  const isSocialLogin = searchParams?.get("social") === "1";
  useEffect(() => {
    if (session?.user && isSocialLogin && !isCalled.current) {
      sendUserToServer();
      isCalled.current = true;
    }
  }, [session, isSocialLogin, sendUserToServer]);

  const field = (name: keyof LoginFormValues) => {
    const status = getFieldStatus(name, touchedFields, errors, watchedFields);
    return {
      border: getFieldBorderClass(status),
      icon: getFieldIcon(status),
    };
  };

  return (
    <div className="w-[400px] md:w-[1000px] h-[600px] p-1 md:p-5 flex justify-center items-center gap-[10px] md:gap-[50px] border border-slate-300 dark:border-slate-500 rounded-[10px] shadow-lg ">
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <div className="w-[360px] md:w-[400px] h-full flex flex-col justify-center">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="w-full flex flex-col justify-center gap-5"
            >
              <h1 className="text-3xl font-semibold">Login into account</h1>
              <div className="flex gap-1">
                <span>Don't have any account ?</span>
                <Link href="/signup" className="underline">
                  Signup
                </Link>
              </div>
              <div className="flex flex-col items-center justify-center gap-3 mt-4">
                {/* Email Field */}
                <div className="w-full">
                  <div
                    className={`w-full border ${
                      field("email").border
                    } rounded-[20px] flex items-center text-center gap-[10px] p-[5px]`}
                  >
                    <TfiEmail className="text-gray-400 mx-[10px]" />
                    <input
                      {...register("email")}
                      type="email"
                      required
                      placeholder="Email"
                      className="outline-none bg-transparent w-full backdrop-blur-sm "
                    />
                    <div className="mx-[10px]">{field("email").icon}</div>
                  </div>
                  {errors.email && watchedFields.email && (
                    <div className="flex items-center gap-2 mt-1">
                      <IoAlertCircleOutline className="text-red-400 text-sm" />
                      <p className="text-red-400 text-[12px]">
                        {errors.email.message}
                      </p>
                    </div>
                  )}
                </div>

                {/* Password Field */}
                <div className="w-full">
                  <div
                    className={`w-full border ${
                      field("password").border
                    } rounded-[20px] flex justify-between items-center text-center gap-[10px] p-[5px]`}
                  >
                    <div className="flex items-center w-[500px]">
                      <RiLockPasswordLine className="text-gray-400 mx-[10px] text-[20px]" />
                      <input
                        {...register("password")}
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Password"
                        className="mx-[10px] outline-none bg-transparent w-full backdrop-blur-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2 mx-[10px]">
                      {field("password").icon}
                      <button type="button" onClick={handleShowPassword}>
                        {showPassword ? (
                          <FaRegEyeSlash className="text-gray-400" />
                        ) : (
                          <FaRegEye className="text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  {errors.password && watchedFields.password && (
                    <div className="flex items-center gap-2 mt-1">
                      <IoAlertCircleOutline className="text-red-400 text-sm" />
                      <p className="text-red-400 text-[12px]">
                        {errors.password.message}
                      </p>
                    </div>
                  )}
                </div>

                {/* Forgot Password Link */}
                <div className="w-full flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-gray-400 hover:text-gray-400/70 underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="button-disabled"
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </button>
            </form>
            <Separator className="mt-5 mb-2" />
            <p className="text-center text-xs text">Or join with</p>
            <div className="flex flex-col md:flex-row justify-center items-center w-full gap-3 mt-3">
              <button
                onClick={() => handleOAuthLogin("google")}
                className="button gap-2"
              >
                <FcGoogle />
                Google
              </button>
              <button
                onClick={() => handleOAuthLogin("github")}
                className="button gap-2"
              >
                <FaGithub />
                Github
              </button>
            </div>
          </div>

          <div className="hidden md:block">
            <Image
              src={makeup2}
              alt="image"
              width={400}
              height={600}
              className="object-cover w-[400px] h-[500px] rounded-[15px]"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Login;
