'use client'

import React from 'react';
import { BookOpen, Download, X, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Course {
    id: string;
    name: string;
    price: string;
    tags: string[];
    thumbnail?: string;
}

interface GenerateResult {
    result_url: string;
    tutorials: string[];
    courses: Course[];
}

interface ResultHistoryItem {
    id: string;
    styleName: string;
    result: GenerateResult;
    timestamp: Date;
}

interface ResultDisplayProps {
    history: ResultHistoryItem[];
    activeIndex: number;
    onTabChange: (index: number) => void;
    onRemove: (index: number) => void;
    onClearAll: () => void;
}

const ResultDisplay = ({
    history,
    activeIndex,
    onTabChange,
    onRemove,
    onClearAll
}: ResultDisplayProps) => {
    const router = useRouter();

    if (history.length === 0) {
        return null;
    }

    const currentResult = history[activeIndex];

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = currentResult.result.result_url;
        link.download = `makeup-result-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCourseClick = (courseId: string) => {
        router.push(`/course-overview/${courseId}`);
    };

    const formatTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            {/* History Tabs */}
            {history.length > 1 && (
                <div className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between px-4 py-2">
                        <div className="flex items-center gap-2 overflow-x-auto flex-1 scrollbar-thin">
                            {history.map((item, index) => (
                                <div
                                    key={item.id}
                                    onClick={() => onTabChange(index)}
                                    className={`relative flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${activeIndex === index
                                            ? 'bg-blue-500 text-white shadow-sm'
                                            : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="truncate max-w-[100px]">
                                            {item.styleName}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemove(index);
                                            }}
                                            className={`p-1 rounded hover:bg-red-500/20 transition-colors ${activeIndex === index
                                                    ? 'text-white hover:text-red-200'
                                                    : 'text-gray-400 hover:text-red-500'
                                                }`}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <span className="text-xs opacity-75 block mt-0.5">
                                        {formatTime(item.timestamp)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {history.length > 1 && (
                            <button
                                onClick={onClearAll}
                                className="flex-shrink-0 ml-2 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-1"
                            >
                                <Trash2 className="w-3 h-3" />
                                Clear All
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Result Image */}
            <div className="relative w-full aspect-square bg-gray-100 dark:bg-slate-900">
                <Image
                    src={currentResult.result.result_url}
                    alt="Makeup result"
                    fill
                    className="object-contain"
                    priority
                />
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                <div className="flex gap-3">
                    <button
                        onClick={handleDownload}
                        className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Download
                    </button>
                </div>
            </div>

            {/* Style Name Badge */}
            <div className="px-6 pt-6 pb-3 border-b border-gray-200 dark:border-slate-700">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full border border-blue-200 dark:border-blue-800">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {currentResult.styleName}
                    </span>
                </div>
            </div>

            {/* Tutorial Section */}
            {currentResult.result.tutorials && currentResult.result.tutorials.length > 0 && (
                <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="w-5 h-5 text-blue-500" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Makeup Tutorial
                        </h3>
                    </div>
                    <ol className="space-y-4">
                        {currentResult.result.tutorials.map((step, index) => (
                            <li key={index} className="flex gap-3">
                                <span className="flex-shrink-0 w-7 h-7 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold">
                                    {index + 1}
                                </span>
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pt-0.5">
                                    {step}
                                </p>
                            </li>
                        ))}
                    </ol>
                </div>
            )}

            {/* Recommended Courses */}
            {currentResult.result.courses && currentResult.result.courses.length > 0 && (
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="text-2xl">📚</span>
                        Recommended Courses
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        {currentResult.result.courses.map((course) => (
                            <button
                                key={course.id}
                                onClick={() => handleCourseClick(course.id)}
                                className="flex gap-3 p-3 border border-gray-200 dark:border-slate-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all text-left group"
                            >
                                {/* Course Thumbnail */}
                                <div className="relative w-20 h-20 flex-shrink-0 bg-gray-200 dark:bg-slate-700 rounded-lg overflow-hidden">
                                    {course.thumbnail ? (
                                        <Image
                                            src={course.thumbnail}
                                            alt={course.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <BookOpen className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                                        </div>
                                    )}
                                </div>

                                {/* Course Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                                        {course.name}
                                    </h4>
                                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">
                                        {course.price}
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {course.tags.slice(0, 3).map((tag, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                        {course.tags.length > 3 && (
                                            <span className="px-2 py-0.5 text-xs text-gray-500 dark:text-gray-500">
                                                +{course.tags.length - 3}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResultDisplay;