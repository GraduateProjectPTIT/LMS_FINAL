import React from 'react';
import { Course } from '@/type';
import CourseCard from './CourseCard';
import { BookOpen, Search } from 'lucide-react';

interface CourseGridProps {
    courses: Course[];
    viewMode: 'grid' | 'list';
    onViewDemo: (url: string) => void;
}

const CourseGrid = ({ courses, viewMode, onViewDemo }: CourseGridProps) => {
    if (courses.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="max-w-md mx-auto">
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                        <Search className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                        No courses found
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-lg">
                        Try adjusting your search criteria or filters to find what you're looking for
                    </p>
                </div>
            </div>
        );
    }

    if (viewMode === 'list') {
        return (
            <div className="space-y-6">
                {courses.map((course) => (
                    <CourseCard
                        key={course._id}
                        course={course}
                        viewMode={viewMode}
                        onViewDemo={onViewDemo}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map((course) => (
                <CourseCard
                    key={course._id}
                    course={course}
                    viewMode={viewMode}
                    onViewDemo={onViewDemo}
                />
            ))}
        </div>
    );
};

export default CourseGrid;