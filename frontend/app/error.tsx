'use client'
import { useEffect } from 'react';
import { ServerCrash, RefreshCw, Home } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="theme-mode min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
            <div className="relative max-w-lg w-full">
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl rounded-2xl p-8 text-center">
                    {/* Icon with Animation */}
                    <div className="mb-8">
                        <div className="relative mx-auto w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                            <ServerCrash className="text-white w-12 h-12" />
                            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-white mb-4">
                        Oops! Something Went Wrong
                    </h1>

                    {/* Description */}
                    <p className="text-gray-300 mb-8 leading-relaxed">
                        An unexpected error occurred while processing your request.
                        Our team has been notified and is working to fix the issue.
                    </p>

                    {/* Development Error Details */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mb-8">
                            <details className="text-left bg-white/5 rounded-lg p-4 border border-white/10">
                                <summary className="cursor-pointer text-sm text-gray-300 hover:text-white transition-colors mb-2">
                                    🔍 Error Details (Development Only)
                                </summary>
                                <div className="mt-3 p-3 bg-black/20 rounded border border-red-500/20">
                                    <pre className="text-xs text-red-200 overflow-auto max-h-32 whitespace-pre-wrap">
                                        {error.message}
                                        {error.digest && `\nDigest: ${error.digest}`}
                                    </pre>
                                </div>
                            </details>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <button
                            onClick={reset}
                            className="group flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm"
                        >
                            <RefreshCw className="w-4 h-4 transition-transform group-hover:rotate-180" />
                            Try Again
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="group flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                            <Home className="w-4 h-4 transition-transform group-hover:scale-110" />
                            Back to Home
                        </button>
                    </div>

                    {/* Help Text */}
                    <p className="text-gray-400 text-sm mt-6">
                        If the problem persists, please contact our support team with the error details.
                    </p>
                </div>
            </div>
        </div>
    );
}