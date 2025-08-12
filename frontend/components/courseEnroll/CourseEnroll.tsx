"use client"

import React, { useEffect, useState } from 'react'
import Loader from '../Loader';
import CourseHeader from './CourseHeader';
import VideoPlayer from './VideoPlayer';
import CourseSidebar from './CourseSidebar';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Course {
    name: string;
    description: string;
    level: string;
    categories: string;
    courseData: CourseSection[];
}

interface CourseSection {
    _id: string;
    sectionTitle: string;
    sectionContents: LectureContent[];
}

interface LectureContent {
    _id: string;
    videoTitle: string;
    videoDescription: string;
    videoUrl: string;
    videoLength: number;
    videoLinks: VideoLink[];
    questions: LectureQuestions[];
}

interface LectureQuestionsReply {
    _id: string;
    user: string;
    answer: string;
    createdAt: string;
    updatedAt: string;
}

interface LectureQuestions {
    _id: string;
    user: string;
    question: string;
    replies: LectureQuestionsReply[];
    createdAt: string;
    updatedAt: string;
}

interface VideoLink {
    _id: string;
    title: string;
    url: string;
}

const CourseEnroll = ({ courseId }: { courseId: string }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [course, setCourse] = useState<Course | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<LectureContent | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleGetCourse = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/get_course_content/${courseId}`, {
                method: "GET",
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) {
                console.log(data.message);
                return;
            } else {
                setCourse(data.course);

                // Set first video as selected by default if there are videos
                if (data.course.courseData && data.course.courseData.length > 0 &&
                    data.course.courseData[0].sectionContents.length > 0) {
                    setSelectedVideo(data.course.courseData[0].sectionContents[0]);
                }
            }
        } catch (error: any) {
            console.log(error.message);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (courseId) {
            handleGetCourse();
        }
    }, [courseId]);

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
                        categories={course.categories}
                    />
                    <div className="flex flex-1 overflow-hidden relative">
                        {/* Main content area */}
                        <div className="flex-grow p-4 overflow-auto">
                            <VideoPlayer video={selectedVideo} />
                        </div>

                        {/* Right sidebar - with transition */}
                        <div
                            className={`border-l border-gray-300 dark:border-slate-600 bg-white dark:bg-[#1f2227] overflow-auto transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-96' : 'w-0'}`}
                        >
                            {isSidebarOpen && (
                                <CourseSidebar
                                    courseData={course.courseData}
                                    setSelectedVideo={setSelectedVideo}
                                    selectedVideoId={selectedVideo?._id}
                                />
                            )}
                        </div>
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