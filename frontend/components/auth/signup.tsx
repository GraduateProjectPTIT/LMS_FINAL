"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { resetState, signInSuccess, signUpFailure, signUpStart, signUpSuccess } from '@/redux/user/userSlice';
import { signIn, useSession } from 'next-auth/react';

import makeup1 from "@/assets/makeup.webp"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import toast, { Toaster } from 'react-hot-toast';
import { MdOutlineDriveFileRenameOutline } from "react-icons/md";
import { TfiEmail } from "react-icons/tfi";
import { RiLockPasswordLine } from "react-icons/ri";
import { FaRegEye } from "react-icons/fa6";
import { FaRegEyeSlash } from "react-icons/fa6";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { IoAlertCircleOutline } from "react-icons/io5";
import { IoCheckmarkCircleOutline } from "react-icons/io5";

const registerSchema = z
    .object({
        name: z.string().min(3, "Username must be at least 3 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters")
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"], // Đánh dấu lỗi trên confirmPassword
    });

type RegisterFormValues = z.infer<typeof registerSchema>

const SignUp = () => {
    const [showPassword, setShowPassword] = useState(false);
    const handleShowPassword = (e: any) => {
        e.preventDefault();
        setShowPassword(!showPassword);
    }

    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const handleShowConfirmPassword = (e: any) => {
        e.preventDefault();
        setShowConfirmPassword(!showConfirmPassword);
    }

    const dispatch = useDispatch();
    const router = useRouter();

    const searchParams = useSearchParams();

    const callbackUrl = searchParams?.get("callbackUrl") || "/";

    const { data: session } = useSession();

    const [isLoading, setIsLoading] = useState(false);

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

    const getFieldStatus = (fieldName: keyof RegisterFormValues) => {
        const isTouched = touchedFields[fieldName];
        const hasError = errors[fieldName];
        const hasValue = watchedFields[fieldName]?.length > 0;

        if (!isTouched || !hasValue) return 'default';
        if (hasError) return 'error';
        return 'success';
    }

    const getFieldBorderClass = (fieldName: keyof RegisterFormValues) => {
        const status = getFieldStatus(fieldName);
        switch (status) {
            case 'error':
                return 'border-red-400';
            case 'success':
                return 'border-green-400';
            default:
                return 'border-slate-400';
        }
    }

    const getFieldIcon = (fieldName: keyof RegisterFormValues) => {
        const status = getFieldStatus(fieldName);
        if (status === 'error') {
            return <IoAlertCircleOutline className="text-red-500 text-lg" />;
        }
        if (status === 'success') {
            return <IoCheckmarkCircleOutline className="text-green-500 text-lg" />;
        }
        return null;
    }

    const onSubmit = async (data: RegisterFormValues) => {
        dispatch(signUpStart());

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/auth/register`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                credentials: 'include',
            });
            const responseData = await res.json();
            if (!res.ok) {
                dispatch(signUpFailure("Sign up failed"));
                toast.error(responseData.message);
                return;
            } else {
                dispatch(signUpSuccess(responseData.activationToken))
                router.push("/verification")
            }
        } catch (error: any) {
            console.log(error.message);
            toast.error("Something went wrong. Please try again.");
        }
    }

    // handle login through Github or Google
    const handleOAuthLogin = async (provider: "google" | "github") => {
        try {
            const res = await signIn(provider, { redirect: false });
            if (res?.error) {
                toast.error(`${provider} login failed`);
                return;
            }
        } catch (error: any) {
            toast.error("Something went wrong. Please try again.");
        }
    };

    const isCalled = useRef(false); // Sử dụng useRef để giữ trạng thái qua re-renders

    const sendUserToServer = async () => {

        if (!session?.user || isCalled.current) return; // Ngăn gọi API nếu đã được gọi trước đó
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/auth/social_auth`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: session?.user.email,
                    name: session?.user.name,
                    avatar: session?.user.image
                }),
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Failed to authenticate user");
            }
            setIsLoading(false);
            dispatch(signInSuccess(data));
            router.replace(callbackUrl);
        } catch (error: any) {
            console.log(error.message);
        }
    }

    useEffect(() => {
        if (session?.user && !isCalled.current) {
            sendUserToServer();
            isCalled.current = true;
        }
    }, [session])

    return (
        <div className='w-[400px] md:w-[1000px] h-[600px] p-5 flex justify-center items-center gap-[50px] border border-slate-300 dark:border-slate-500 rounded-[10px] shadow-lg '>

            <div className='hidden md:block'>
                <Image
                    src={makeup1}
                    alt="image"
                    width={400}
                    height={600}
                    className='object-cover w-[400px] h-[500px] rounded-[15px]'
                />
            </div>

            <div className='w-[360px] md:w-[400px] h-full flex flex-col justify-center'>
                <form onSubmit={handleSubmit(onSubmit)} className='w-full flex flex-col justify-center gap-5'>
                    <h1 className='text-3xl font-semibold'>Create an account</h1>
                    <div className='flex gap-1'>
                        <span>Already have an account ?</span>
                        <Link href='/login' className='underline'>Login</Link>
                    </div>
                    <div className='flex flex-col items-center justify-center gap-3 mt-4'>

                        {/* Username Field */}
                        <div className='w-full'>
                            <div className={`w-full border ${getFieldBorderClass('name')} rounded-[20px] flex items-center text-center gap-[10px] p-[5px]`}>
                                <MdOutlineDriveFileRenameOutline className='text-gray-400 mx-[10px]' />
                                <input {...register("name")} type="text" required placeholder='Username' className='outline-none bg-transparent w-full backdrop-blur-sm ' />
                                <div className="mx-[10px]">
                                    {getFieldIcon('name')}
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
                            <div className={`w-full border ${getFieldBorderClass('email')} rounded-[20px] flex items-center text-center gap-[10px] p-[5px]`}>
                                <TfiEmail className='text-gray-400 mx-[10px]' />
                                <input {...register("email")} type="email" required placeholder='Email' className='outline-none bg-transparent w-full backdrop-blur-sm ' />
                                <div className="mx-[10px]">
                                    {getFieldIcon('email')}
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
                            <div className={`w-full border ${getFieldBorderClass('password')} rounded-[20px] flex justify-between items-center text-center gap-[10px] p-[5px]`}>
                                <div className='flex items-center w-[500px]'>
                                    <RiLockPasswordLine className='text-gray-400 mx-[10px] text-[20px]' />
                                    <input {...register("password")} type={showPassword ? 'text' : 'password'} required placeholder='Password' className='mx-[10px] outline-none bg-transparent w-full backdrop-blur-sm' />
                                </div>
                                <div className="flex items-center gap-2 mx-[10px]">
                                    {getFieldIcon('password')}
                                    <button onClick={handleShowPassword}>
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
                            <div className={`w-full border ${getFieldBorderClass('confirmPassword')} rounded-[20px] flex justify-between items-center text-center gap-[10px] p-[5px]`}>
                                <div className='flex items-center w-[500px]'>
                                    <RiLockPasswordLine className='text-gray-400 mx-[10px] text-[20px]' />
                                    <input {...register("confirmPassword")} type={showConfirmPassword ? 'text' : 'password'} required placeholder='Confirm Password' className='mx-[10px] outline-none bg-transparent w-full backdrop-blur-sm' />
                                </div>
                                <div className="flex items-center gap-2 mx-[10px]">
                                    {getFieldIcon('confirmPassword')}
                                    <button onClick={handleShowConfirmPassword}>
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
                    <Button type='submit' disabled={isSubmitting} className='cursor-pointer w-full hover:bg-slate-600 dark:hover:bg-gray-400'>
                        {isSubmitting ? "Signing up..." : "Sign up"}
                    </Button>
                </form>
                <Separator className='mt-5 mb-2' />
                <p className='text-center text-xs text'>Or register with</p>
                <div className='flex flex-col md:flex-row justify-center items-center w-full gap-3 mt-3'>
                    <Button onClick={() => handleOAuthLogin("google")} className='w-full md:w-[200px] rounded-[10px] hover:bg-slate-600 dark:hover:bg-gray-400 cursor-pointer flex justify-center items-center gap-2'>
                        <FcGoogle />
                        Google
                    </Button>
                    <Button onClick={() => handleOAuthLogin("github")} className='w-full md:w-[200px] rounded-[10px] hover:bg-slate-600 dark:hover:bg-gray-400 cursor-pointer flex justify-center items-center gap-2'>
                        <FaGithub />
                        Github
                    </Button>
                </div>
            </div>

        </div>
    )
}

export default SignUp