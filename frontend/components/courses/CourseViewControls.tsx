import React from 'react';
import { Button } from '@/components/ui/button';
import { Grid, List, LayoutGrid } from 'lucide-react';

interface CourseViewControlsProps {
    viewMode: 'grid' | 'list';
    onViewModeChange: (mode: 'grid' | 'list') => void;
    totalResults: number;
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
}

const CourseViewControls = ({
    viewMode,
    onViewModeChange,
    totalResults,
    currentPage,
    totalPages,
    itemsPerPage,
}: CourseViewControlsProps) => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalResults);

    return (
        <div className="flex flex-row justify-between items-center gap-6">
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
                <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-1">
                    <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => onViewModeChange('grid')}
                        className={`flex items-center gap-2 rounded-md transition-all ${viewMode === 'grid'
                            ? 'bg-slate-600 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400'
                            }`}
                    >
                        <LayoutGrid className="h-4 w-4" />
                        <span className="hidden sm:inline">Grid</span>
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => onViewModeChange('list')}
                        className={`flex items-center gap-2 rounded-md transition-all ${viewMode === 'list'
                            ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                    >
                        <List className="h-4 w-4" />
                        <span className="hidden sm:inline">List</span>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CourseViewControls;