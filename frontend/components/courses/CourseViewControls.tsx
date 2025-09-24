import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Grid, List, LayoutGrid } from 'lucide-react';

interface CourseViewControlsProps {
    viewMode: 'grid' | 'list';
    onViewModeChange: (mode: 'grid' | 'list') => void;
    totalResults: number;
    currentPage: number;
    itemsPerPage: number;
}

const CourseViewControls = ({
    viewMode,
    onViewModeChange,
    totalResults,
    currentPage,
    itemsPerPage,
}: CourseViewControlsProps) => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalResults);

    const [isMobile, setIsMobile] = useState(false);
    const hasSwitchedRef = useRef(false);

    useEffect(() => {
        const checkScreenSize = () => {
            const mobile = window.innerWidth < 768; // md breakpoint
            setIsMobile(mobile);

            if (mobile && viewMode === 'list' && !hasSwitchedRef.current) {
                hasSwitchedRef.current = true;
                onViewModeChange('grid');
            }
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, [viewMode, onViewModeChange])

    return (
        <div className="hidden md:flex flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
                <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Showing{' '}
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                            {startItem.toLocaleString()}-{endItem.toLocaleString()}
                        </span>{' '}
                        of{' '}
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                            {totalResults.toLocaleString()}
                        </span>{' '}
                        courses
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    View Mode:
                </span>
                <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-2">
                    <button
                        onClick={() => onViewModeChange('grid')}
                        className={`flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer transition-all ${viewMode === 'grid'
                            ? 'bg-blue-500 dark:bg-slate-100 text-white dark:text-black shadow-sm'
                            : 'text-slate-600 dark:text-slate-500 hover:bg-blue-100 dark:hover:bg-blue-100'
                            }`}
                    >
                        <LayoutGrid className="h-4 w-4" />
                        <span className="hidden sm:inline">Grid</span>
                    </button>
                    <button
                        onClick={() => onViewModeChange('list')}
                        className={`flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer transition-all ${viewMode === 'list'
                            ? 'bg-blue-500 dark:bg-slate-100 text-white dark:text-black shadow-sm'
                            : ' text-slate-600 dark:text-slate-500 hover:bg-blue-100 dark:hover:bg-blue-100'
                            }`}
                    >
                        <List className="h-4 w-4" />
                        <span className="hidden sm:inline">List</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CourseViewControls;