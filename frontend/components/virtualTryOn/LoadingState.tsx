'use client'

import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingState = () => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-12">
            <div className="text-center">
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Applying Makeup...
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                    This may take 20-30 seconds. AI is working its magic!
                </p>
                <div className="mt-6 w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                        className="h-full bg-blue-500 rounded-full animate-pulse"
                        style={{ width: '60%' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default LoadingState;