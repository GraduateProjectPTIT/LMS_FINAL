"use client"

import { RootState } from '@/redux/store';
import React, { useState, useRef, KeyboardEvent, ChangeEvent, ClipboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast';

interface VerifyAccountProps {
    email: string | null;
    setRegistrationStep: (step: number) => void;
}

const VerifyAccount = ({ email, setRegistrationStep }: VerifyAccountProps) => {

    const [code, setCode] = useState<string[]>(['', '', '', '']);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    console.log(email)

    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    if (inputRefs.current.length === 0) {
        inputRefs.current = Array(4).fill(null);
    }

    const handleChange = (index: number, value: string): void => {
        // Chỉ cho phép nhập số
        if (value && !/^\d+$/.test(value)) return;

        const newCode = [...code];
        // Chỉ lấy ký tự cuối cùng nếu người dùng dán nhiều số
        newCode[index] = value.slice(-1);
        setCode(newCode);

        // Chuyển sang ô nhập tiếp theo nếu ô hiện tại đã được điền
        if (value && index < 3 && inputRefs.current[index + 1]) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>): void => {
        // Quay lại ô trước nếu nhấn backspace khi ô hiện tại đang trống
        if (e.key === 'Backspace' && !code[index] && index > 0 && inputRefs.current[index - 1]) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>): void => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text/plain').trim();

        // Kiểm tra nếu nội dung dán vào là một số gồm 4 chữ số
        if (/^\d{4}$/.test(pastedData)) {
            const digits = pastedData.split('');
            setCode(digits);

            // Đưa con trỏ đến ô nhập cuối cùng sau khi dán
            if (inputRefs.current[3]) {
                inputRefs.current[3]?.focus();
            }
        }
    };

    const router = useRouter();

    const handleVerify = async (e: any) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/auth/activate`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    activation_code: code.join(''),
                }),
                credentials: 'include',
            });
            const responseData = await res.json();
            if (!res.ok) {
                toast.error(responseData.message);
                setCode(['', '', '', ''])
                return;
            } else {
                toast.success("Verify account success")
                router.push("/login");
            }
        } catch (error: any) {
            console.log(error.message);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    const handleResendCode = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/auth/resend_activation_code`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email
                }),
                credentials: 'include',
            });
            const responseData = await res.json();
            if (!res.ok) {
                toast.error(responseData.message);
                return;
            } else {
                toast.success("Verification code resent successfully!");
                setCode(['', '', '', '']); // Xóa mã hiện tại
            }
        } catch (error: any) {
            console.log(error.message);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md p-8 space-y-8 bg-slate-100 dark:bg-slate-700 rounded-lg shadow-md">
            <div className="text-center">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Verification</h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    Please enter the 4-digit code we sent to your email
                </p>
            </div>

            <div className="mt-8">
                <div className="flex justify-center gap-4">
                    {code.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => { inputRefs.current[index] = el; }}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(index, e.target.value)}
                            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, e)}
                            onPaste={index === 0 ? handlePaste : undefined}
                            disabled={isLoading}
                            className="w-14 h-14 text-center text-2xl font-bold bg-gray-300 dark:bg-gray-400 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    ))}
                </div>

                <div className="mt-8 space-y-4">
                    <button
                        onClick={handleVerify}
                        type="button"
                        disabled={isLoading || code.some(digit => digit === '')}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                    >
                        {isLoading ? (
                            <div className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Verifying...
                            </div>
                        ) : (
                            'Verify Account'
                        )}
                    </button>

                    <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Didn't receive the code?{' '}
                            <button
                                onClick={handleResendCode}
                                type="button"
                                disabled={isLoading}
                                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:underline"
                            >
                                Resend Code
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default VerifyAccount