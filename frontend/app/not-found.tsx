"use client"
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="theme-mode min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 flex items-center justify-center px-4">
            <div className="relative max-w-lg w-full">
                <div className="bg-white/90 backdrop-blur-lg border border-gray-200 shadow-xl rounded-2xl p-8 text-center">
                    {/* Icon with Animation */}
                    <div className="mb-8">
                        <div className="relative mx-auto w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                            <FileQuestion className="text-white w-12 h-12" />
                            <div className="absolute inset-0 bg-orange-500 rounded-full animate-ping opacity-20"></div>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Oops! Page Not Found
                    </h1>

                    {/* Description */}
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        The page you're looking for seems to have wandered off into the digital void.
                        Don't worry, it happens to the best of us!
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <button
                            onClick={() => window.history.back()}
                            className="group flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg transition-all duration-200 hover:scale-105"
                        >
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            Go Back
                        </button>

                        <Link
                            href="/"
                            className="group flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                            <Home className="w-4 h-4 transition-transform group-hover:scale-110" />
                            Back to Home
                        </Link>
                    </div>

                    {/* Help Text */}
                    <p className="text-gray-500 text-sm mt-6">
                        Need help? Try checking the URL or contact our support team.
                    </p>
                </div>
            </div>
        </div >
    );
}