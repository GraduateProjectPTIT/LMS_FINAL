"use client"
import React, { useEffect, useState } from 'react'
import Loader from '@/components/Loader';
import CourseHeader from './CourseHeader';
import VideoPlayer from './VideoPlayer';
import CourseSidebar from './CourseSidebar';
import { CourseEnrollResponse, SectionLecture } from "@/type";

const CourseEnroll = ({ courseId }: { courseId: string }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [course, setCourse] = useState<CourseEnrollResponse | null>(null);
    const [selectedLecture, setSelectedLecture] = useState<SectionLecture | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleEnrollCourse = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/enroll/${courseId}`, {
                method: "GET",
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) {
                console.log("Fetching course data failed: ", data.message);
                return;
            }
            setCourse(data.course);

            // Auto-select first lecture if available
            if (data.course.courseData.length > 0 && data.course.courseData[0].sectionContents.length > 0) {
                setSelectedLecture(data.course.courseData[0].sectionContents[0]);
            }
        } catch (error: any) {
            console.log(error.message);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (courseId) {
            handleEnrollCourse();
        }
    }, [courseId]);

    const setSelectedVideo = (lecture: SectionLecture) => {
        setSelectedLecture(lecture);
    };

    const courseCategories = course?.categories.map(cat => cat.title).join(', ') || '';

    return (
        <>
            {isLoading ? (
                <Loader />
            ) : course ? (
                <div className="flex flex-col h-screen bg-white dark:bg-[#272a31]">
                    <CourseHeader
                        courseId={courseId}
                        name={course.name}
                        level={course.level}
                        categories={courseCategories}
                    />
                    <div className="flex flex-1 overflow-hidden relative">
                        {/* Main content area */}
                        <div className="flex-grow p-4 overflow-auto">
                            <VideoPlayer lecture={selectedLecture} />
                        </div>

                        {/* Right sidebar - with transition */}
                        <div
                            className={`border-l border-gray-300 dark:border-slate-600 bg-white dark:bg-[#1f2227] overflow-auto transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-96' : 'w-0'}`}
                        >
                            {isSidebarOpen && (
                                <CourseSidebar
                                    courseData={course.courseData}
                                    setSelectedVideo={setSelectedVideo}
                                    selectedVideoId={selectedLecture?._id}
                                />
                            )}
                        </div>

                        {/* Toggle sidebar button */}
                        <button
                            onClick={toggleSidebar}
                            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-l-md p-2 shadow-md hover:bg-gray-50 dark:hover:bg-slate-600 z-10"
                        >
                            {isSidebarOpen ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center h-screen bg-white dark:bg-[#272a31]">
                    <p className="text-gray-500 dark:text-gray-400">No course data available</p>
                </div>
            )}
        </>
    );
};

export default CourseEnroll;