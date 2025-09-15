"use client"
import { useRouter } from 'next/navigation';
import { UserX, MessageCircle, Home, Mail } from 'lucide-react';
import React from 'react';

const AccountSuspendedPage = () => {
    const router = useRouter();

    return (
        <div className="theme-mode min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
            <div className="relative max-w-lg w-full">
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl rounded-2xl p-8 text-center">
                    {/* Icon with Animation */}
                    <div className="mb-8">
                        <div className="relative mx-auto w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
                            <UserX className="text-white w-12 h-12" />
                            <div className="absolute inset-0 bg-amber-500 rounded-full animate-ping opacity-20"></div>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-white mb-4">
                        Account Temporarily Suspended
                    </h1>

                    {/* Description */}
                    <p className="text-gray-300 mb-8 leading-relaxed">
                        Your account has been temporarily suspended for security or policy reasons.
                        Please contact our support team for assistance or check your email for more details.
                    </p>

                    {/* Info Box */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-8">
                        <div className="flex items-center justify-center gap-2 text-amber-300 mb-2">
                            <Mail className="w-4 h-4" />
                            <span className="text-sm font-medium">Check Your Email</span>
                        </div>
                        <p className="text-gray-400 text-sm">
                            We've sent detailed information about your account suspension to your registered email address.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <button
                            onClick={() => router.push("/contact")}
                            className="group flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm"
                        >
                            <MessageCircle className="w-4 h-4 transition-transform group-hover:scale-110" />
                            Contact Support
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
                        Account suspensions are typically temporary and can be resolved quickly with our support team.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AccountSuspendedPage;