"use client"
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Home, Timer } from 'lucide-react';
import React, { useState, useEffect } from 'react';

const RateLimitedErrorPage = () => {
    const router = useRouter();
    const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
    const [isTimerActive, setIsTimerActive] = useState(true);

    useEffect(() => {
        if (!isTimerActive || timeRemaining <= 0) return;

        const interval = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    setIsTimerActive(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isTimerActive, timeRemaining]);

    const formatTime = (seconds: any) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progressPercentage = ((300 - timeRemaining) / 300) * 100;

    return (
        <div className="theme-mode min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
            <div className="relative max-w-lg w-full">
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl rounded-2xl p-8 text-center">
                    {/* Icon with Animation */}
                    <div className="mb-8">
                        <div className="relative mx-auto w-24 h-24 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                            <ShieldAlert className="text-white w-12 h-12 animate-pulse" />
                            <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-20"></div>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-white mb-4">
                        Rate Limit Exceeded
                    </h1>

                    {/* Description */}
                    <p className="text-gray-300 mb-8 leading-relaxed">
                        You've made too many requests in a short period. Our system has temporarily
                        limited your access to ensure optimal performance for all users.
                    </p>

                    {/* Rate Limit Info Box */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-8">
                        <div className="flex items-center justify-center gap-2 text-purple-300 mb-3">
                            <Timer className="w-5 h-5" />
                            <span className="text-sm font-medium">Cooldown Timer</span>
                        </div>

                        {/* Countdown Timer */}
                        <div className="mb-4">
                            <div className="text-2xl font-mono text-white font-bold mb-2">
                                {isTimerActive ? formatTime(timeRemaining) : "00:00"}
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full transition-all duration-1000"
                                    style={{ width: `${progressPercentage}%` }}
                                ></div>
                            </div>
                        </div>

                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <button
                            onClick={() => window.history.back()}
                            className="group flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm"
                        >
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            Go Back
                        </button>
                        <button
                            onClick={() => router.replace("/")}
                            className="group flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                            <Home className="w-4 h-4 transition-transform group-hover:scale-110" />
                            Back to Home
                        </button>
                    </div>

                    {/* Help Text */}
                    <p className="text-gray-400 text-sm mt-6">
                        {isTimerActive
                            ? "Please wait for the timer to complete before making new requests."
                            : "You can now try making requests again. Thank you for your patience!"
                        }
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RateLimitedErrorPage;