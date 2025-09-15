"use client"
import { useRouter } from 'next/navigation';
import { Construction, RefreshCw, Home, Clock } from 'lucide-react';
import React, { useState, useEffect } from 'react';

const MaintenancePage = () => {
    const router = useRouter();
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString());
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="theme-mode min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
            <div className="relative max-w-lg w-full">
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl rounded-2xl p-8 text-center">
                    {/* Icon with Animation */}
                    <div className="mb-8">
                        <div className="relative mx-auto w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                            <Construction className="text-white w-12 h-12" />
                            <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-white mb-4">
                        Scheduled Maintenance
                    </h1>

                    {/* Description */}
                    <p className="text-gray-300 mb-8 leading-relaxed">
                        We're currently performing scheduled maintenance to improve our services.
                        Our team is working hard to get everything back online shortly.
                    </p>

                    {/* Status Info Box */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-8">
                        <div className="flex items-center justify-center gap-2 text-blue-300 mb-2">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-medium">Current Time</span>
                        </div>
                        <p className="text-white font-mono text-lg">
                            {currentTime}
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                            We appreciate your patience during this brief maintenance window.
                        </p>
                    </div>

                    {/* Progress Indicator */}
                    <div className="mb-8">
                        <div className="flex justify-between text-sm text-gray-400 mb-2">
                            <span>Maintenance Progress</span>
                            <span>In Progress...</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                            <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full animate-pulse" style={{ width: '65%' }}></div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="group flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm"
                        >
                            <RefreshCw className="w-4 h-4 transition-transform group-hover:rotate-180" />
                            Check Again
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
                        Follow us on social media for real-time updates on maintenance progress.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MaintenancePage;