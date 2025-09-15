"use client"
import { useRouter } from 'next/navigation';
import { CircleAlert, ArrowLeft, Home, Shield, Lock } from 'lucide-react';
import React from 'react';

const UnauthorizedErrorPage = () => {
    const router = useRouter();

    return (
        <div className="theme-mode min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
            <div className="relative max-w-lg w-full">
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl rounded-2xl p-8 text-center">
                    {/* Icon with Animation */}
                    <div className="mb-8">
                        <div className="relative mx-auto w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                            <CircleAlert className="text-white w-12 h-12" />
                            <div className="absolute inset-0 bg-yellow-500 rounded-full animate-ping opacity-20"></div>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-white mb-4">
                        Access Denied
                    </h1>

                    {/* Description */}
                    <p className="text-gray-300 mb-8 leading-relaxed">
                        You don't have the necessary permissions to access this resource.
                        Please contact your administrator if you believe this is an error.
                    </p>

                    {/* Security Info Box */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-8">
                        <div className="flex items-center justify-center gap-2 text-yellow-300 mb-3">
                            <Shield className="w-5 h-5" />
                            <span className="text-sm font-medium">Protected Resource</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="bg-white/5 rounded-lg p-3">
                                <Lock className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                                <p className="text-xs text-gray-400">Restricted Access</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3">
                                <CircleAlert className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                                <p className="text-xs text-gray-400">Authorization Required</p>
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
                        Need different permissions? Contact your system administrator or team lead.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UnauthorizedErrorPage;