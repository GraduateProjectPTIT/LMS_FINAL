import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IoReturnUpBackOutline } from "react-icons/io5";

interface CourseHeaderProps {
    courseId: string;
    name: string;
    level: string;
    categories: string;
}

const CourseHeader = ({ courseId, name, level, categories }: CourseHeaderProps) => {
    return (
        <div className="border-b border-gray-300 dark:border-slate-700 p-4 flex items-center justify-between">
            <div className="flex justify-center items-center gap-4">
                <Link href={`/course/${courseId}`}>
                    <div className='flex items-center justify-center gap-2 px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-400/40 dark:hover:bg-blue-800/40 rounded-full cursor-pointer'>
                        <IoReturnUpBackOutline className='text-[16px]' />
                        <span className='text-sm'>Back</span>
                    </div>
                </Link>
                <div className="hidden md:block">
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate max-w-lg">{name}</h1>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <span className="px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                    {level}
                </span>
                <span className="px-3 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
                    {categories}
                </span>
            </div>
        </div>
    );
};

export default CourseHeader;