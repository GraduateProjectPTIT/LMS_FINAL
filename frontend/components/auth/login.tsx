"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { signInFailure, signInStart, signInSuccess } from '@/redux/user/userSlice';
import { signIn, useSession } from "next-auth/react";

import makeup2 from "@/assets/makeup2.webp"
import toast from 'react-hot-toast';
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { TfiEmail } from "react-icons/tfi";
import { RiLockPasswordLine } from "react-icons/ri";
import { FaRegEye } from "react-icons/fa6";
import { FaRegEyeSlash } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import Loader from '@/components/Loader';

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters")
})

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {

    const [showPassword, setShowPassword] = useState(false);
    const handleShowPassword = (e: any) => {
        e.preventDefault();
        setShowPassword(!showPassword);
    }

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
        formState: {
            isSubmitting
        }
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (data: LoginFormValues) => {
        dispatch(signInStart());
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/auth/login`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                credentials: 'include',
            });
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
        <div className='w-[400px] md:w-[1000px] h-[550px] p-1 md:p-5 flex justify-center items-center gap-[10px] md:gap-[50px] border dark:border-slate-500 rounded-[10px] shadow-lg '>
            {
                isLoading ? (
                    <Loader />
                ) : (
                    <>
                        <div className='w-[360px] md:w-[400px] h-full flex flex-col justify-center'>
                            <form onSubmit={handleSubmit(onSubmit)} className='w-full flex flex-col justify-center gap-5'>
                                <h1 className='text-3xl font-semibold'>Login into account</h1>
                                <div className='flex gap-1'>
                                    <span>Don't have any account ?</span>
                                    <Link href='/signup' className='underline'>Signup</Link>
                                </div>
                                <div className='flex flex-col items-center justify-center gap-3 mt-4'>
                                    <div className='w-full border border-blue-300 rounded-[20px] flex items-center text-center gap-[10px] p-[5px] '>
                                        <TfiEmail className='text-gray-400 mx-[10px]' />
                                        <input {...register("email")} type="email" required placeholder='Email' className='outline-none bg-transparent w-full backdrop-blur-sm ' />
                                    </div>

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

                                </div>
                                <Button type='submit' disabled={isSubmitting} className='cursor-pointer w-full hover:bg-slate-600 dark:hover:bg-gray-400'>
                                    {isSubmitting ? "Logging in..." : "Login"}
                                </Button>
                            </form>
                            <Separator className='mt-5 mb-2' />
                            <p className='text-center text-xs text'>Or join with</p>
                            <div className='flex flex-col md:flex-row justify-center items-center w-full gap-3 mt-3'>
                                <Button onClick={() => handleOAuthLogin("google")} className=' w-full md:w-[200px] hover:bg-slate-600 dark:hover:bg-gray-400 rounded-[10px] cursor-pointer flex justify-center items-center gap-2'>
                                    <FcGoogle />
                                    Google
                                </Button>
                                <Button onClick={() => handleOAuthLogin("github")} className=' w-full md:w-[200px] hover:bg-slate-600 dark:hover:bg-gray-400 rounded-[10px] cursor-pointer flex justify-center items-center gap-2'>
                                    <FaGithub />
                                    Github
                                </Button>
                            </div>
                        </div>

                        <div className='hidden md:block'>
                            <Image
                                src={makeup2}
                                alt="image"
                                width={400}
                                height={600}
                                className='object-cover w-[400px] h-[500px] rounded-[15px]'
                            />
                        </div>
                    </>
                )
            }
        </div>
    )
}

export default Login