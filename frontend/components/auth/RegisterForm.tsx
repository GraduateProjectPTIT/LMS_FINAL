"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { signUpFailure, signUpStart, signUpSuccess } from '@/redux/user/userSlice';
import { signIn, useSession, signOut } from 'next-auth/react';
import { getFieldStatus, getFieldBorderClass, getFieldIcon } from "@/utils/formFieldHelpers";
import toast from 'react-hot-toast';

import { Separator } from "@/components/ui/separator"
import { MdOutlineDriveFileRenameOutline } from "react-icons/md";
import { TfiEmail } from "react-icons/tfi";
import { RiLockPasswordLine } from "react-icons/ri";
import { FaRegEye } from "react-icons/fa6";
import { FaRegEyeSlash } from "react-icons/fa6";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { IoAlertCircleOutline } from "react-icons/io5";

const registerSchema = z
    .object({
        name: z.string().min(3, "Username must be at least 3 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters")
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

type RegisterFormValues = z.infer<typeof registerSchema>

interface RegisterFormProps {
    selectedRole: 'student' | 'tutor' | null;
    setRegistrationStep: (step: number) => void;
    setUserRegisteredEmail: (email: string | null) => void;
}

const RegisterForm = ({ selectedRole, setRegistrationStep, setUserRegisteredEmail }: RegisterFormProps) => {

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleTogglePassword = (e: any) => {
        e.preventDefault();
        setShowPassword(!showPassword);
    }

    const handleToggleConfirmPassword = (e: any) => {
        e.preventDefault();
        setShowConfirmPassword(!showConfirmPassword);
    }

    const dispatch = useDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();

    // Flag: có phải đang quay về từ social không?
    const isSocialLogin = searchParams?.get("social") === "1";
    const callbackUrl = searchParams?.get("callbackUrl") || "/";

    const {
        register,
        handleSubmit,
        watch,
        formState: {
            isSubmitting,
            errors,
            touchedFields
        }
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        mode: "onChange"
    })

    const watchedFields = watch();

    // Nếu đã có session mà KHÔNG phải đang quay về từ OAuth, thì signOut trước khi đăng ký
    useEffect(() => {
        if (session?.user && !isSocialLogin) {
            signOut({ redirect: false });
            console.log("[RegisterForm] Found existing session; signing out before new registration.");
        }
    }, []); // chỉ chạy 1 lần

    // Xử lý logic khi người dùng submit form đăng ký thông thường.
    const onSubmit = async (data: RegisterFormValues) => {
        dispatch(signUpStart());

        try {
            const { confirmPassword, ...registrationData } = data; // Loại bỏ confirmPassword khỏi dữ liệu gửi đi

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/auth/register`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...registrationData,
                    role: selectedRole
                }),
                credentials: 'include',
            });
            const responseData = await res.json();
            if (!res.ok) {
                dispatch(signUpFailure("Sign up failed"));
                toast.error(responseData.message);
                return;
            } else {
                dispatch(signUpSuccess());
                setUserRegisteredEmail(data.email);
                setRegistrationStep(3);
            }
        } catch (error: any) {
            console.log(error.message);
            toast.error("Something went wrong. Please try again.");
        }
    }

    // ===== Resolve role (ưu tiên session.user.role đã gắn ở NextAuth callbacks) =====
    const getResolvedRole = (): string | null => {
        const roleFromSession = (session?.user as any)?.role ?? null;
        const cookieMatch =
            typeof document !== "undefined"
                ? document.cookie.match(/(?:^|;\s*)pending_role=([^;]+)/)
                : null;
        const roleFromCookie = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
        const roleFromLocal = typeof window !== "undefined" ? localStorage.getItem("pending_role") : null;
        const roleFromQuery = searchParams?.get("role");

        const resolved =
            roleFromSession ?? selectedRole ?? roleFromCookie ?? roleFromLocal ?? roleFromQuery ?? null;

        console.log("[RegisterForm] Role sources:", {
            roleFromSession,
            selectedRole,
            roleFromCookie,
            roleFromLocal,
            roleFromQuery,
            resolved,
        });
        return resolved;
    };

    // Xử lý đăng nhập thông qua Google hoặc Github.
    const handleOAuthLogin = async (provider: "google" | "github") => {
        try {
            if (!selectedRole) {
                toast.error("Please choose account type first.");
                return;
            }

            setIsLoading(true); // Set loading state

            // Lưu role tạm (cookie 10 phút + localStorage fallback)
            document.cookie = `pending_role=${selectedRole}; Max-Age=600; Path=/; SameSite=Lax`;
            localStorage.setItem("pending_role", selectedRole);

            console.log("[RegisterForm] Starting OAuth login for:", provider, "with role:", selectedRole);

            // Quay về đúng trang hiện tại để component này render lại
            await signIn(provider, {
                callbackUrl: `${window.location.origin}${pathname}?social=1`,
                redirect: true
            });
        } catch (err) {
            console.error("[RegisterForm] OAuth error:", err);
            toast.error("OAuth login failed.");
            setIsLoading(false);
        }
    };

    // 1. Sử dụng localStorage thay vì useRef để persist qua page reload
    const getCallStatus = () => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem('oauth_processing') === 'true';
    };

    const setCallStatus = (status: boolean) => {
        if (typeof window === 'undefined') return;
        if (status) {
            localStorage.setItem('oauth_processing', 'true');
        } else {
            localStorage.removeItem('oauth_processing');
        }
    };

    // 2. Thay đổi useEffect chính
    useEffect(() => {
        console.log("[RegisterForm] useEffect triggered:", {
            sessionExists: !!session?.user,
            sessionStatus: status,
            isSocialLogin,
            alreadyProcessing: getCallStatus()
        });

        // Chỉ xử lý khi có đủ điều kiện và chưa processing
        if (isSocialLogin && status === "authenticated" && session?.user && !getCallStatus()) {
            console.log("[RegisterForm] All conditions met, calling sendUserToServer");
            setCallStatus(true); // Đánh dấu đang xử lý
            sendUserToServer();
        }
    }, [session, status, isSocialLogin]);

    // 3. Cập nhật sendUserToServer để clear status
    const sendUserToServer = async () => {
        if (!session?.user) {
            console.log("[RegisterForm] No session user; abort sendUserToServer.");
            setCallStatus(false); // Clear status nếu không có session
            return;
        }

        const resolvedRole = getResolvedRole();
        if (!resolvedRole) {
            toast.error("Missing account type. Please select Student or Tutor again.");
            setRegistrationStep(1);
            setCallStatus(false); // Clear status
            return;
        }

        console.log("[RegisterForm] Sending user to server:", session.user, "with role:", resolvedRole);
        setIsLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/auth/social_auth`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    email: session.user.email,
                    name: session.user.name,
                    avatar: (session.user as any).image,
                    role: resolvedRole,
                }),
            });

            const data = await res.json();
            console.log("[RegisterForm] Server response:", data);

            if (!res.ok) {
                throw new Error(data?.message || "Failed to authenticate user");
            }

            // dọn tạm
            document.cookie = "pending_role=; Max-Age=0; Path=/; SameSite=Lax";
            localStorage.removeItem("pending_role");
            setCallStatus(false); // Clear processing status

            toast.success("Registration successful!");
            router.replace(callbackUrl);
        } catch (err: any) {
            console.error("[RegisterForm] sendUserToServer error:", err?.message || err);
            toast.error(err?.message || "Something went wrong.");
            setCallStatus(false); // Clear status on error
        } finally {
            setIsLoading(false);
        }
    };

    // 4. Cleanup khi component unmount
    useEffect(() => {
        return () => {
            // Nếu không phải social login, clear processing status
            if (!isSocialLogin) {
                setCallStatus(false);
            }
        };
    }, [isSocialLogin]);

    const handlePrevious = () => {
        setRegistrationStep(1);
    }

    const field = (name: keyof RegisterFormValues) => {
        const status = getFieldStatus(name, touchedFields, errors, watchedFields);
        return {
            border: getFieldBorderClass(status),
            icon: getFieldIcon(status),
        };
    };

    return (
        <div className='flex flex-col justify-center gap-2'>
            <div className='w-[400px] md:w-lg p-5 flex flex-col justify-center items-center border border-slate-300 dark:border-slate-500 rounded-[10px] shadow-lg'>
                <form onSubmit={handleSubmit(onSubmit)} className='w-full flex flex-col justify-center gap-5'>
                    <h1 className='text-xl md:text-2xl font-semibold text-center'>
                        Create {selectedRole === 'tutor' ? 'Tutor' : 'Student'} Account
                    </h1>
                    <div className='flex flex-col items-center justify-center gap-3 mt-4'>

                        {/* Username Field */}
                        <div className='w-full'>
                            <div className={`w-full border ${field("name").border} rounded-[20px] flex items-center text-center gap-[10px] p-[5px]`}>
                                <MdOutlineDriveFileRenameOutline className='text-gray-400 mx-[10px]' />
                                <input {...register("name")} type="text" required placeholder='Username' className='outline-none bg-transparent w-full backdrop-blur-sm ' />
                                <div className="mx-[10px]">
                                    {field("name").icon}
                                </div>
                            </div>
                            {errors.name && watchedFields.name && (
                                <div className="flex items-center gap-2 mt-1">
                                    <IoAlertCircleOutline className="text-red-400 text-sm" />
                                    <p className="text-red-400 text-[12px]">{errors.name.message}</p>
                                </div>
                            )}
                        </div>

                        {/* Email Field */}
                        <div className='w-full'>
                            <div className={`w-full border ${field("email").border} rounded-[20px] flex items-center text-center gap-[10px] p-[5px]`}>
                                <TfiEmail className='text-gray-400 mx-[10px]' />
                                <input {...register("email")} type="email" required placeholder='Email' className='outline-none bg-transparent w-full backdrop-blur-sm ' />
                                <div className="mx-[10px]">
                                    {field("email").icon}
                                </div>
                            </div>
                            {errors.email && watchedFields.email && (
                                <div className="flex items-center gap-2 mt-1">
                                    <IoAlertCircleOutline className="text-red-400 text-sm" />
                                    <p className="text-red-400 text-[12px]">{errors.email.message}</p>
                                </div>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className='w-full'>
                            <div className={`w-full border ${field("password").border} rounded-[20px] flex justify-between items-center text-center gap-[10px] p-[5px]`}>
                                <div className='flex items-center w-[500px]'>
                                    <RiLockPasswordLine className='text-gray-400 mx-[10px] text-[20px]' />
                                    <input {...register("password")} type={showPassword ? 'text' : 'password'} required placeholder='Password' className='mx-[10px] outline-none bg-transparent w-full backdrop-blur-sm' />
                                </div>
                                <div className="flex items-center gap-2 mx-[10px]">
                                    {field("password").icon}
                                    <button onClick={handleTogglePassword}>
                                        {showPassword ? (
                                            <FaRegEyeSlash className='text-gray-400' />
                                        ) : (
                                            <FaRegEye className='text-gray-400' />
                                        )}
                                    </button>
                                </div>
                            </div>
                            {errors.password && watchedFields.password && (
                                <div className="flex items-center gap-2 mt-1">
                                    <IoAlertCircleOutline className="text-red-400 text-sm" />
                                    <p className="text-red-400 text-[12px]">{errors.password.message}</p>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password Field */}
                        <div className='w-full'>
                            <div className={`w-full border ${field("confirmPassword").border} rounded-[20px] flex justify-between items-center text-center gap-[10px] p-[5px]`}>
                                <div className='flex items-center w-[500px]'>
                                    <RiLockPasswordLine className='text-gray-400 mx-[10px] text-[20px]' />
                                    <input {...register("confirmPassword")} type={showConfirmPassword ? 'text' : 'password'} required placeholder='Confirm Password' className='mx-[10px] outline-none bg-transparent w-full backdrop-blur-sm' />
                                </div>
                                <div className="flex items-center gap-2 mx-[10px]">
                                    {field("confirmPassword").icon}
                                    <button onClick={handleToggleConfirmPassword}>
                                        {showConfirmPassword ? (
                                            <FaRegEyeSlash className='text-gray-400' />
                                        ) : (
                                            <FaRegEye className='text-gray-400' />
                                        )}
                                    </button>
                                </div>
                            </div>
                            {errors.confirmPassword && watchedFields.confirmPassword && (
                                <div className="flex items-center gap-2 mt-1">
                                    <IoAlertCircleOutline className="text-red-400 text-sm" />
                                    <p className="text-red-400 text-[12px]">{errors.confirmPassword.message}</p>
                                </div>
                            )}
                        </div>

                    </div>
                    <button type='submit' disabled={isSubmitting} className='button-disabled'>
                        {isSubmitting ? "Signing up..." : "Sign up"}
                    </button>
                </form>
                <Separator className='mt-5 mb-2' />
                <p className='text-center text-xs text'>Or register with</p>
                <div className='flex justify-center items-center w-full gap-3 mt-3'>
                    <button onClick={() => handleOAuthLogin("google")} className='button gap-2'>
                        <FcGoogle />
                        Google
                    </button>
                    <button onClick={() => handleOAuthLogin("github")} className='button gap-2'>
                        <FaGithub />
                        Github
                    </button>
                </div>
                <Separator className='mt-5 mb-2' />
                <button
                    type="button"
                    onClick={handlePrevious}
                    className="button"
                >
                    Back
                </button>
            </div>
        </div>
    )
}

export default RegisterForm