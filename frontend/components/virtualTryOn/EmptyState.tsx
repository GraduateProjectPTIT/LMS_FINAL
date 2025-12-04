'use client'

import React from 'react';
import { ImageIcon } from 'lucide-react';

const EmptyState = () => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-12">
            <div className="text-center text-gray-400 dark:text-gray-600">
                <ImageIcon className="w-16 h-16 mx-auto mb-4" />
                <p className="text-lg">Your result will appear here</p>
            </div>
        </div>
    );
};

export default EmptyState;