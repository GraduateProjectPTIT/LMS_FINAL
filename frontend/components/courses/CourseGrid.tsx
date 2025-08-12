import React from 'react';
import { Course } from '@/type';
import CourseCard from './CourseCard';

interface CourseGridProps {
    courses: Course[];
    viewMode: 'grid' | 'list';
    setShowPreviewModal: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedCourse: React.Dispatch<React.SetStateAction<{}>>
}

const CourseGrid = ({ courses, viewMode, setShowPreviewModal, setSelectedCourse }: CourseGridProps) => {

    return (
        <div className={`${viewMode === 'list'
            ? 'space-y-6'
            : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            }`}
        >
            {courses.map((course) => (
                <CourseCard
                    key={course._id}
                    course={course}
                    viewMode={viewMode}
                    setShowPreviewModal={setShowPreviewModal}
                    setSelectedCourse={setSelectedCourse}
                />
            ))}
        </div>
    );
};

export default CourseGrid;