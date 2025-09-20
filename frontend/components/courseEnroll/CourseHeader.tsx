import React from 'react';
import { useRouter } from 'next/navigation';
import { IoReturnUpBackOutline } from "react-icons/io5";
import { HiMenu, HiX } from "react-icons/hi";

interface CourseHeaderProps {
    name: string;
    level: string;
    categories: string;
    toggleSidebar: () => void;
    isSidebarOpen: boolean;
}

const CourseHeader = ({ name, level, categories, toggleSidebar, isSidebarOpen }: CourseHeaderProps) => {

    const router = useRouter();

    return (
        <div className="border-b border-gray-300 dark:border-slate-700 p-4 flex items-center justify-between bg-white dark:bg-[#1f2227] sticky top-0 z-10">
            <div className="flex justify-center items-center gap-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className='flex items-center justify-center gap-2 px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-400/40 dark:hover:bg-blue-800/40 rounded-full cursor-pointer transition-colors duration-200'
                >
                    <IoReturnUpBackOutline className='text-[16px]' />
                    <span className='text-sm'>Back</span>
                </button>
                <div className="hidden md:block">
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate max-w-lg" title={name}>
                        {name}
                    </h1>
                </div>
                {/* Mobile course title */}
                <div className="block md:hidden">
                    <h1 className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[150px]" title={name}>
                        {name}
                    </h1>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                {/* Desktop course info */}
                <div className="hidden md:flex items-center space-x-2">
                    <span className="px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                        {level}
                    </span>
                    {categories && (
                        <span className="px-3 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
                            {categories}
                        </span>
                    )}
                </div>

                {/* Mobile menu button */}
                <button
                    onClick={toggleSidebar}
                    className="md:hidden "
                    aria-label="Toggle course menu"
                >
                    {isSidebarOpen ? (
                        <HiX className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    ) : (
                        <HiMenu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    )}
                </button>
            </div>
        </div>
    );
};

export default CourseHeader;