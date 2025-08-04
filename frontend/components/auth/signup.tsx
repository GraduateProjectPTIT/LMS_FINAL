"use client"

import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { resetState, signUpFailure, signUpStart, signUpSuccess } from '@/redux/user/userSlice';


const registerSchema = z
    .object({
        name: z.string().min(3, "Username must be at least 3 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string().min(6, "Password must be at least 6 characters")
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

    const {
        register,
        handleSubmit,
        formState: {
            isSubmitting,
            errors
        }
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema)
    })

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



    return (
        <div className='w-[400px] md:w-[1000px] h-[550px] p-5 flex justify-center items-center gap-[50px] border dark:border-slate-500 rounded-[10px] shadow-lg '>

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
                        <div className='w-full border border-blue-300 rounded-[20px] flex items-center text-center gap-[10px] p-[5px] '>
                            <MdOutlineDriveFileRenameOutline className='text-gray-400 mx-[10px]' />
                            <input {...register("name")} type="text" required placeholder='Username' className='outline-none bg-transparent w-full backdrop-blur-sm ' />
                        </div>
                        <p className="text-red-400 text-[12px]">{errors.name?.message}</p>
                        <div className='w-full border border-blue-300 rounded-[20px] flex items-center text-center gap-[10px] p-[5px] '>
                            <TfiEmail className='text-gray-400 mx-[10px]' />
                            <input {...register("email")} type="email" required placeholder='Email' className='outline-none bg-transparent w-full backdrop-blur-sm ' />
                        </div>
                        <p className="text-red-400 text-[12px]">{errors.email?.message}</p>

                        <div className='w-full border border-blue-300 rounded-[20px] flex justify-between items-center text-center gap-[10px] p-[5px] '>
                            <div className='flex items-center w-[500px]'>
                                <RiLockPasswordLine className='text-gray-400 mx-[10px] text-[20px]' />
                                <input {...register("password")} type={showPassword ? 'text' : 'password'} required placeholder='Password' className='mx-[10px] outline-none bg-transparent w-full backdrop-blur-sm' />
                            </div>
                            <button onClick={handleShowPassword} className='mx-[10px]'>
                                {showPassword ? (
                                    <FaRegEyeSlash className='text-gray-400' />
                                ) : (
                                    <FaRegEye className='text-gray-400' />
                                )}
                            </button>
                        </div>
                        <p className="text-red-400 text-[12px]">{errors.password?.message}</p>
                        <div className='w-full border border-blue-300 rounded-[20px] flex justify-between items-center text-center gap-[10px] p-[5px] '>
                            <div className='flex items-center w-[500px]'>
                                <RiLockPasswordLine className='text-gray-400 mx-[10px] text-[20px]' />
                                <input {...register("confirmPassword")} type={showConfirmPassword ? 'text' : 'password'} required placeholder='Confirm Password' className='mx-[10px] outline-none bg-transparent w-full backdrop-blur-sm' />
                            </div>
                            <button onClick={handleShowConfirmPassword} className='mx-[10px]'>
                                {showConfirmPassword ? (
                                    <FaRegEyeSlash className='text-gray-400' />
                                ) : (
                                    <FaRegEye className='text-gray-400' />
                                )}
                            </button>
                        </div>
                        <p className="text-red-400 text-[12px]">{errors.confirmPassword?.message}</p>

                    </div>
                    <Button type='submit' disabled={isSubmitting} className='cursor-pointer w-full hover:bg-slate-600 dark:hover:bg-gray-400'>
                        {isSubmitting ? "Signing up..." : "Sign up"}
                    </Button>
                </form>
                <Separator className='mt-5 mb-2' />
                <p className='text-center text-xs text'>Or register with</p>
                <div className='flex flex-col md:flex-row justify-center items-center w-full gap-3 mt-3'>
                    <Button className='w-full md:w-[200px] rounded-[10px] hover:bg-slate-600 dark:hover:bg-gray-400 cursor-pointer flex justify-center items-center gap-2'>
                        <FcGoogle />
                        Google
                    </Button>
                    <Button className='w-full md:w-[200px] rounded-[10px] hover:bg-slate-600 dark:hover:bg-gray-400 cursor-pointer flex justify-center items-center gap-2'>
                        <FaGithub />
                        Github
                    </Button>
                </div>
            </div>

        </div>
    )
}

export default SignUp