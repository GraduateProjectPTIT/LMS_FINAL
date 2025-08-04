"use client"

import { RootState } from '@/redux/store';
import React, { useState, useRef, KeyboardEvent, ChangeEvent, ClipboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast';


const VerificationPage = () => {
    const [code, setCode] = useState<string[]>(['', '', '', '']);

    // Properly typed refs array
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    // Initialize the refs array
    if (inputRefs.current.length === 0) {
        inputRefs.current = Array(4).fill(null);
    }

    const handleChange = (index: number, value: string): void => {
        // Only allow digits
        if (value && !/^\d+$/.test(value)) return;

        const newCode = [...code];
        // Take only the last character if user pastes multiple digits
        newCode[index] = value.slice(-1);
        setCode(newCode);

        // Move to next input if current one is filled
        if (value && index < 3 && inputRefs.current[index + 1]) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>): void => {
        // Move to previous input on backspace if current is empty
        if (e.key === 'Backspace' && !code[index] && index > 0 && inputRefs.current[index - 1]) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>): void => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text/plain').trim();

        // Check if pasted content is a 4-digit number
        if (/^\d{4}$/.test(pastedData)) {
            const digits = pastedData.split('');
            setCode(digits);

            // Focus the last input after paste
            if (inputRefs.current[3]) {
                inputRefs.current[3]?.focus();
            }
        }
    };

    const router = useRouter();

    const { activationToken } = useSelector((state: RootState) => state.user);

    const handleVerify = async (e: any) => {
        e.preventDefault();

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/auth/activate`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    activation_token: activationToken,
                    activation_code: code.join(''),
                }),
                credentials: 'include',
            });
            const responseData = await res.json();
            if (!res.ok) {
                toast.error(responseData.message);
                return;
            } else {
                router.replace("/login");
            }
        } catch (error: any) {
            console.log(error.message);
            toast.error("Something went wrong. Please try again.");
        }
    }


    return (
        <div className="flex items-center justify-center min-h-screen light-mode dark:dark-mode">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900">Verification</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Please enter the 4-digit code we sent to your device
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
                                className="w-14 h-14 text-center text-2xl font-bold bg-gray-400 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                            />
                        ))}
                    </div>

                    <div className="mt-8">
                        <button
                            onClick={handleVerify}
                            type="button"
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-lg font-medium"
                        >
                            Verify
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default VerificationPage;