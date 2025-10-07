import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { FaRegPlayCircle, FaCheckCircle, FaLock } from "react-icons/fa";
import { RiArrowDropDownLine } from "react-icons/ri";
import { CourseSection, SectionLecture } from "@/type";
import { formatDuration } from '@/utils/convertToMinutes';

interface CourseSidebarProps {
    courseData: CourseSection[];
    setSelectedVideo: (lecture: SectionLecture) => void;
    selectedVideoId: string | undefined;
    completedLectures: string[]; // Array of completed lecture IDs
    course: any; // Course data để check creator
}

interface RootState {
    user: {
        currentUser: any;
    };
}

const CourseSidebar = ({ courseData, setSelectedVideo, selectedVideoId, completedLectures, course }: CourseSidebarProps) => {
    const [expandedSections, setExpandedSections] = useState<{ [key: number]: boolean }>(
        courseData.reduce((acc, _, index) => ({ ...acc, [index]: index === 0 }), {}) // First section expanded by default
    );

    const { currentUser } = useSelector((state: RootState) => state.user);

    // Check if current user is admin or creator
    const isAdmin = currentUser?.role === 'admin';
    const isCreator = currentUser?._id === course?.creatorId?._id;
    const canBypass = isAdmin || isCreator;

    const toggleSection = (sectionIndex: number) => {
        setExpandedSections((prev) => ({
            ...prev,
            [sectionIndex]: !prev[sectionIndex],
        }));
    };

    // Create flat array of all lectures with their order
    const getAllLecturesInOrder = () => {
        const allLectures: (SectionLecture & { order: number })[] = [];
        let order = 0;

        courseData.forEach(section => {
            section.sectionContents.forEach(lecture => {
                allLectures.push({ ...lecture, order });
                order++;
            });
        });

        return allLectures;
    };

    // Check if lecture is accessible (previous lectures completed or user can bypass)
    const isLectureAccessible = (lecture: SectionLecture) => {
        if (canBypass) return true;

        const allLectures = getAllLecturesInOrder();
        const currentLectureIndex = allLectures.findIndex(l => l._id === lecture._id);

        if (currentLectureIndex === 0) return true; // First lecture is always accessible

        // Check if all previous lectures are completed
        for (let i = 0; i < currentLectureIndex; i++) {
            if (!completedLectures.includes(allLectures[i]._id)) {
                return false;
            }
        }

        return true;
    };

    // Check if lecture is completed
    const isLectureCompleted = (lectureId: string) => {
        return completedLectures.includes(lectureId);
    };

    // Handle lecture selection
    const handleLectureSelect = (lecture: SectionLecture) => {
        if (isLectureAccessible(lecture)) {
            setSelectedVideo(lecture);
        }
    };

    const totalLectures = getAllLecturesInOrder().length;
    const completedCount = completedLectures.length;
    const progressPercentage = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            <div className="p-4 border-b border-gray-300 dark:border-slate-700 bg-white dark:bg-[#1f2227] sticky top-0 z-10">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Course Content</h2>

                {/* Progress summary */}
                <div className="mb-2">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>Overall Progress</span>
                        <span>{completedCount}/{totalLectures} completed</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                    {progressPercentage === 100 && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                            🎉 Course completed!
                        </p>
                    )}
                </div>
            </div>

            {/* Course sections */}
            <div className="flex-1 bg-white dark:bg-[#1f2227]">
                {courseData.map((section, index) => (
                    <div key={section._id} className="border-b border-gray-300 dark:border-slate-700">
                        {/* Section header */}
                        <button
                            className="w-full px-4 py-3 flex justify-between items-center focus:outline-none hover:bg-gray-50 dark:hover:bg-black/20 cursor-pointer transition-colors duration-150"
                            onClick={() => toggleSection(index)}
                        >
                            <span className="font-semibold text-sm md:text-base text-gray-900 dark:text-white text-left leading-tight">
                                {index + 1}. {section.sectionTitle}
                            </span>
                            <RiArrowDropDownLine
                                className={`text-3xl md:text-4xl text-gray-500 dark:text-gray-400 transform ${expandedSections[index] ? 'rotate-180' : 'rotate-0'} transition-transform duration-200 flex-shrink-0 ml-2`}
                            />
                        </button>

                        {/* Section content */}
                        {expandedSections[index] && (
                            <div className="bg-gray-50/30 dark:bg-black/10">
                                {section.sectionContents.map((lecture) => {
                                    const isAccessible = isLectureAccessible(lecture);
                                    const isCompleted = isLectureCompleted(lecture._id);
                                    const isSelected = selectedVideoId === lecture._id;

                                    return (
                                        <div
                                            key={lecture._id}
                                            className={`px-4 py-3 border-t border-gray-200 dark:border-slate-600 flex justify-between items-center transition-colors duration-150
                                                ${isSelected
                                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-500'
                                                    : isAccessible
                                                        ? 'hover:bg-gray-100 dark:hover:bg-black/20 cursor-pointer'
                                                        : 'bg-gray-100/50 dark:bg-black/5 cursor-not-allowed opacity-60'
                                                }`}
                                            onClick={() => handleLectureSelect(lecture)}
                                        >
                                            <div className='flex gap-3 items-start flex-1 min-w-0'>
                                                {/* Lecture status icon */}
                                                {!isAccessible ? (
                                                    <FaLock className='text-sm text-gray-400 dark:text-gray-500 mt-1 flex-shrink-0' />
                                                ) : isCompleted ? (
                                                    <FaCheckCircle className='text-sm text-green-500 mt-1 flex-shrink-0' />
                                                ) : (
                                                    <FaRegPlayCircle className='text-sm text-gray-400 dark:text-gray-500 mt-1 flex-shrink-0' />
                                                )}

                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className={`text-sm leading-tight line-clamp-2 ${isSelected
                                                        ? 'text-indigo-700 dark:text-indigo-300 font-medium'
                                                        : isAccessible
                                                            ? 'text-gray-900 dark:text-white'
                                                            : 'text-gray-500 dark:text-gray-500'
                                                        }`}>
                                                        {lecture.videoTitle}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {formatDuration(lecture.videoLength)}
                                                    </span>

                                                    {/* Status text */}
                                                    {!isAccessible && !canBypass && (
                                                        <span className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                                            Complete previous lectures to unlock
                                                        </span>
                                                    )}
                                                    {isCompleted && (
                                                        <span className="text-xs text-green-600 dark:text-green-400 mt-1">
                                                            Completed
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Additional completion indicator */}
                                            {isCompleted && (
                                                <FaCheckCircle className='text-green-500 flex-shrink-0 ml-2' />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CourseSidebar;