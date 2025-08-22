"use client"

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import toast from 'react-hot-toast';
import { Button } from "@/components/ui/button"
import { RiLockPasswordLine } from "react-icons/ri";
import { IoAlertCircleOutline } from "react-icons/io5";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { ArrowLeft } from "lucide-react";

const resetPasswordSchema = z.object({
    newPassword: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters long"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [resetToken, setResetToken] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        formState: {
            isSubmitting,
            errors,
            touchedFields
        }
    } = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
        mode: "onChange"
    })

    const watchedFields = watch();

    useEffect(() => {
        const token = searchParams?.get('token');
        if (!token) {
            toast.error("Invalid reset link. Please request a new password reset.");
            router.push('/forgot-password');
            return;
        }
        setResetToken(token);
    }, [searchParams, router]);

    const getFieldStatus = (fieldName: keyof ResetPasswordFormValues) => {
        const isTouched = touchedFields[fieldName];
        const hasError = errors[fieldName];
        const hasValue = watchedFields[fieldName]?.length > 0;

        if (!isTouched || !hasValue) return 'default';
        if (hasError) return 'error';
        return 'success';
    }

    const getFieldBorderClass = (fieldName: keyof ResetPasswordFormValues) => {
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

    const getFieldIcon = (fieldName: keyof ResetPasswordFormValues) => {
        const status = getFieldStatus(fieldName);
        if (status === 'error') {
            return <IoAlertCircleOutline className="text-red-500 text-lg" />;
        }
        if (status === 'success') {
            return <IoCheckmarkCircleOutline className="text-green-500 text-lg" />;
        }
        return null;
    }

    const onSubmit = async (data: ResetPasswordFormValues) => {
        if (!resetToken) {
            toast.error("Invalid reset token. Please request a new password reset.");
            return;
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/auth/reset_password`, {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    resetToken: resetToken,
                    newPassword: data.newPassword
                }),
                credentials: 'include',
            });

            const responseData = await res.json();

            if (!res.ok) {
                toast.error(responseData.message || "Something went wrong. Please try again.");
                return;
            }

            toast.success("Password reset successfully!");

            setTimeout(() => {
                router.push('/login');
            }, 1500);

        } catch (error: any) {
            console.log(error.message);
            toast.error("Something went wrong. Please try again.");
        }
    }

    if (!resetToken) {
        return (
            <div className='w-[400px] md:w-[500px] p-5 flex flex-col justify-center items-center gap-5 border border-slate-300 dark:border-slate-500 rounded-[10px] shadow-lg'>
                <div className="text-center">
                    <div className="mx-auto mb-4 w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                        <IoAlertCircleOutline className="text-red-600 dark:text-red-400 text-2xl" />
                    </div>
                    <h1 className='text-2xl font-semibold mb-2'>Invalid Reset Link</h1>
                    <p className='text-gray-600 dark:text-gray-400 text-sm mb-6'>
                        This password reset link is invalid or has expired.
                    </p>
                </div>

                <Link href="/forgot-password" className="w-full">
                    <Button className='w-full hover:bg-slate-600 dark:hover:bg-gray-400'>
                        Request New Reset Link
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className='w-[400px] md:w-[500px] p-5 flex flex-col justify-center items-center gap-5 border border-slate-300 dark:border-slate-500 rounded-[10px] shadow-md'>
            <form onSubmit={handleSubmit(onSubmit)} className='w-full flex flex-col justify-center gap-5'>
                <div className="text-center mb-4">
                    <h1 className='text-3xl font-semibold mb-2'>Reset Password</h1>
                    <p className='text-gray-600 dark:text-gray-400 text-sm'>
                        Enter your new password below to reset your account password.
                    </p>
                </div>

                <div className='flex flex-col items-center justify-center gap-3'>
                    {/* New Password Field */}
                    <div className='w-full'>
                        <div className={`w-full border ${getFieldBorderClass('newPassword')} rounded-[20px] flex items-center text-center gap-[10px] p-[5px]`}>
                            <RiLockPasswordLine className='text-gray-400 mx-[10px]' />
                            <input
                                {...register("newPassword")}
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder='Enter new password'
                                className='outline-none bg-transparent w-full backdrop-blur-sm'
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className=" text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                            </button>
                            <div className="mx-[5px]">
                                {getFieldIcon('newPassword')}
                            </div>
                        </div>
                        {errors.newPassword && watchedFields.newPassword && (
                            <div className="flex items-center gap-2 mt-1">
                                <IoAlertCircleOutline className="text-red-400 text-sm" />
                                <p className="text-red-400 text-[12px]">{errors.newPassword.message}</p>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password Field */}
                    <div className='w-full'>
                        <div className={`w-full border ${getFieldBorderClass('confirmPassword')} rounded-[20px] flex items-center text-center gap-[10px] p-[5px]`}>
                            <RiLockPasswordLine className='text-gray-400 mx-[10px]' />
                            <input
                                {...register("confirmPassword")}
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                placeholder='Confirm new password'
                                className='outline-none bg-transparent w-full backdrop-blur-sm'
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className=" text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                {showConfirmPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                            </button>
                            <div className="mx-[5px]">
                                {getFieldIcon('confirmPassword')}
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

                <Button
                    type='submit'
                    disabled={isSubmitting}
                    className='cursor-pointer w-full hover:bg-slate-600 dark:hover:bg-gray-400'
                >
                    {isSubmitting ? "Resetting..." : "Reset Password"}
                </Button>
            </form>

            <div className='flex flex-col items-center gap-2 mt-2'>
                <Link href="/login" className="flex items-center gap-2 text-slate-400">
                    <ArrowLeft size={16} />
                    Back to Login
                </Link>
            </div>
        </div>
    )
}

export default ResetPassword