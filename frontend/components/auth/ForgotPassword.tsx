"use client"

import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import Link from 'next/link';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { forgotPasswordStart, forgotPasswordSuccess } from '@/redux/user/userSlice';
import toast from 'react-hot-toast';
import { Button } from "@/components/ui/button"
import { TfiEmail } from "react-icons/tfi";
import { IoAlertCircleOutline } from "react-icons/io5";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { ArrowLeft } from "lucide-react";

const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address")
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
    const dispatch = useDispatch();
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: {
            isSubmitting,
            errors,
            touchedFields
        }
    } = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        mode: "onChange"
    })

    const watchedFields = watch();

    const getFieldStatus = (fieldName: keyof ForgotPasswordFormValues) => {
        const isTouched = touchedFields[fieldName];
        const hasError = errors[fieldName];
        const hasValue = watchedFields[fieldName]?.length > 0;

        if (!isTouched || !hasValue) return 'default';
        if (hasError) return 'error';
        return 'success';
    }

    const getFieldBorderClass = (fieldName: keyof ForgotPasswordFormValues) => {
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

    const getFieldIcon = (fieldName: keyof ForgotPasswordFormValues) => {
        const status = getFieldStatus(fieldName);
        if (status === 'error') {
            return <IoAlertCircleOutline className="text-red-500 text-lg" />;
        }
        if (status === 'success') {
            return <IoCheckmarkCircleOutline className="text-green-500 text-lg" />;
        }
        return null;
    }

    const onSubmit = async (data: ForgotPasswordFormValues) => {
        dispatch(forgotPasswordStart());
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/auth/forgot_password`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                credentials: 'include',
            });
            const responseData = await res.json();
            if (!res.ok) {
                toast.error(responseData.message || "Something went wrong. Please try again.");
                return;
            } else {
                dispatch(forgotPasswordSuccess(responseData.resetToken));
                toast.success("Password reset email sent successfully!");
                setIsSuccess(true);
            }
        } catch (error: any) {
            console.log(error.message);
            toast.error("Something went wrong. Please try again.");
        }
    }

    if (isSuccess) {
        return (
            <div className='w-[400px] md:w-[500px] p-5 flex flex-col justify-center items-center gap-5 border border-slate-300 dark:border-slate-500 rounded-[10px] shadow-lg'>
                <div className="text-center">
                    <div className="mx-auto mb-4 w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <IoCheckmarkCircleOutline className="text-green-600 dark:text-green-400 text-2xl" />
                    </div>
                    <h1 className='text-2xl font-semibold mb-2'>Check Your Email</h1>
                    <p className='text-gray-600 dark:text-gray-400 text-sm mb-6'>
                        If an account with your email exists, you will receive a password reset code shortly.
                    </p>
                </div>

                <div className="flex flex-col gap-3 w-full">
                    <Button
                        onClick={() => setIsSuccess(false)}
                        variant="outline"
                        className='w-full hover:bg-slate-50 dark:hover:bg-slate-800'
                    >
                        Send Another Email
                    </Button>

                    <Link href="/login" className="w-full">
                        <Button className='w-full hover:bg-slate-600 dark:hover:bg-gray-400 flex items-center gap-2'>
                            <ArrowLeft size={16} />
                            Back to Login
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className='w-[400px] md:w-[500px] p-5 flex flex-col justify-center items-center gap-5 border border-slate-300 dark:border-slate-500 rounded-[10px] shadow-md'>
            <form onSubmit={handleSubmit(onSubmit)} className='w-full flex flex-col justify-center gap-5'>
                <div className="text-center mb-4">
                    <h1 className='text-3xl font-semibold mb-2'>Forgot Password</h1>
                    <p className='text-gray-600 dark:text-gray-400 text-sm'>
                        Enter your email address and we'll send you a code to reset your password.
                    </p>
                </div>

                <div className='flex flex-col items-center justify-center gap-3'>
                    {/* Email Field */}
                    <div className='w-full'>
                        <div className={`w-full border ${getFieldBorderClass('email')} rounded-[20px] flex items-center text-center gap-[10px] p-[5px]`}>
                            <TfiEmail className='text-gray-400 mx-[10px]' />
                            <input
                                {...register("email")}
                                type="email"
                                required
                                placeholder='Enter your email address'
                                className='outline-none bg-transparent w-full backdrop-blur-sm'
                            />
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
                </div>

                <button
                    type='submit'
                    disabled={isSubmitting}
                    className='button-disabled'
                >
                    {isSubmitting ? "Sending..." : "Send Reset Code"}
                </button>
            </form>

            <div className='flex flex-col items-center gap-2 mt-2'>
                <Link href="/login" className="flex items-center gap-2 text-slate-400 hover:text-slate-400/70">
                    <ArrowLeft size={16} />
                    Back to Login
                </Link>
            </div>
        </div>
    )
}

export default ForgotPassword