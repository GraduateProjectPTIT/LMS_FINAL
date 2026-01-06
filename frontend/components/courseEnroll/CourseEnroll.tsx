"use client"

import React, { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { RootState } from '@/redux/store';
import Loader from '@/components/Loader';
import CourseHeader from './CourseHeader';
import VideoPlayer from './VideoPlayer';
import CourseSidebar from './CourseSidebar';
import { CourseEnrollResponse, SectionLecture, Assessment } from "@/type";
import CourseAssessment from '@/components/courseEnroll/CourseAssessment';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const CourseEnroll = ({ courseId }: { courseId: string }) => {
    const searchParams = useSearchParams();

    const focusLectureId = searchParams?.get("focusLecture");
    const focusQuestionId = searchParams?.get("focusQuestion");

    const [isLoading, setIsLoading] = useState(false);
    const [course, setCourse] = useState<CourseEnrollResponse | null>(null);
    const [selectedLecture, setSelectedLecture] = useState<SectionLecture | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [completedLectures, setCompletedLectures] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'video' | 'assessment'>('video');
    const [assessment, setAssessment] = useState<Assessment | undefined>(undefined);

    const { currentUser } = useSelector((state: RootState) => state.user);
    const router = useRouter();

    const isAdmin = currentUser?.role === 'admin';
    const isCreator = course ? currentUser?._id === course.creatorId?._id : false;
    const canBypass = isAdmin || isCreator;

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    useEffect(() => {
        // Nếu chưa có course hoặc không có focusLectureId thì bỏ qua
        if (!course || !focusLectureId) return;

        const allLectures: SectionLecture[] = [];

        course.courseData.forEach(section => {
            section.sectionContents.forEach(lecture => {
                allLectures.push(lecture);
            });
        });

        const targetLecture = allLectures.find(l => l._id === focusLectureId);

        if (targetLecture) {
            setSelectedLecture(targetLecture);
        }
    }, [course, focusLectureId]);

    // Helper function to get all lectures from course data
    const getAllLecturesFromCourse = useCallback((courseData: CourseEnrollResponse) => {
        const allLectures: SectionLecture[] = [];
        courseData.courseData.forEach(section => {
            section.sectionContents.forEach(lecture => {
                allLectures.push(lecture);
            });
        });
        return allLectures;
    }, []);

    const handleEnrollCourse = useCallback(async () => {
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

            // Set các lecture đã hoàn thành từ API response
            if (data.completedLectures && Array.isArray(data.completedLectures)) {
                setCompletedLectures(data.completedLectures);
            } else {
                setCompletedLectures([]);
            }
            if (data.assessment) {
                setAssessment(data.assessment);
            }

            // Tìm lecture đầu tiên chưa hoàn thành hoặc lecture cuối cùng nếu tất cả đã hoàn thành
            const allLectures = getAllLecturesFromCourse(data.course);
            const completedSet = new Set(data.completedLectures || []);

            let lectureToSelect = null;

            // Tìm lecture chưa hoàn thành đầu tiên
            for (const lecture of allLectures) {
                if (!completedSet.has(lecture._id)) {
                    lectureToSelect = lecture;
                    break;
                }
            }

            // Nếu tất cả đã hoàn thành, chọn lecture cuối cùng
            if (!lectureToSelect && allLectures.length > 0) {
                lectureToSelect = allLectures[allLectures.length - 1];
            }

            // Nếu vẫn không có lecture (không nên xảy ra), chọn lecture đầu tiên
            if (!lectureToSelect && data.course.courseData.length > 0 && data.course.courseData[0].sectionContents.length > 0) {
                lectureToSelect = data.course.courseData[0].sectionContents[0];
            }

            if (lectureToSelect) {
                setSelectedLecture(lectureToSelect);
            }
        } catch (error: any) {
            console.log(error.message);
        } finally {
            setIsLoading(false);
        }
    }, [courseId, getAllLecturesFromCourse]);

    // Tạo một flat array tất cả các lecture với thứ tự
    const getAllLecturesInOrder = useCallback(() => {
        if (!course) return [];

        const allLectures: (SectionLecture & { order: number })[] = [];
        let order = 0;

        course.courseData.forEach(section => {
            section.sectionContents.forEach(lecture => {
                allLectures.push({ ...lecture, order });
                order++;
            });
        });

        return allLectures;
    }, [course]);

    // Kiểm tra xem một lecture có thể truy cập được không
    const isLectureAccessible = useCallback((lecture: SectionLecture) => {
        if (canBypass) return true;

        // Nếu lecture này đã hoàn thành rồi, cho phép xem lại
        if (completedLectures.includes(lecture._id)) {
            return true;
        }

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
    }, [canBypass, completedLectures, getAllLecturesInOrder]);

    useEffect(() => {
        const checkAndFetch = async () => {
            if (!courseId) return;

            // Kiểm tra quyền truy cập trước
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/${courseId}/has-purchased`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                });
                const data = await res.json();
                if (!res.ok || !data.hasPurchased) {
                    router.replace("/error/unauthorized");
                    return;
                }
                // Nếu hợp lệ, mới gọi API lấy dữ liệu khóa học
                handleEnrollCourse();
            } catch (error: any) {
                router.replace("/error/unauthorized");
            }
        };

        checkAndFetch();
    }, [courseId, handleEnrollCourse, router]);

    const setSelectedVideo = (lecture: SectionLecture) => {
        // Only allow selection of accessible lectures
        if (!isLectureAccessible(lecture)) {
            return;
        }

        setSelectedLecture(lecture);
        setViewMode('video');
        // Close sidebar on mobile after selecting video
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    // Handle when a lecture is marked as completed
    const handleLectureCompleted = (lectureId: string) => {
        setCompletedLectures(prev => {
            if (!prev.includes(lectureId)) {
                return [...prev, lectureId];
            }
            return prev;
        });
    };

    // Auto-select next accessible lecture when current one is completed
    useEffect(() => {
        if (selectedLecture && completedLectures.includes(selectedLecture._id)) {
            const allLectures = getAllLecturesInOrder();
            const currentIndex = allLectures.findIndex(l => l._id === selectedLecture._id);

            // Find next accessible lecture
            for (let i = currentIndex + 1; i < allLectures.length; i++) {
                if (isLectureAccessible(allLectures[i])) {
                    // Optional: Auto-advance to next lecture
                    // setSelectedLecture(allLectures[i]);
                    break;
                }
            }
        }
    }, [completedLectures, selectedLecture, getAllLecturesInOrder, isLectureAccessible]);

    const courseCategories = course?.categories.map(cat => cat.title).join(', ') || '';

    return (
        <>
            {isLoading ? (
                <Loader />
            ) : course ? (
                <div className="flex flex-col h-screen">
                    <CourseHeader
                        name={course.name}
                        level={course.level}
                        categories={courseCategories}
                        toggleSidebar={toggleSidebar}
                        isSidebarOpen={isSidebarOpen}
                    />
                    <div className="flex flex-1 overflow-hidden relative">
                        {/* Main content area */}
                        <div
                            className={`transition-all duration-300 p-4 h-full overflow-y-auto ${isSidebarOpen
                                ? 'w-full md:w-[calc(100%-24rem)]' // 24rem = 384px = w-96
                                : 'w-full'
                                }`}
                            style={{ maxWidth: isSidebarOpen ? '100%' : '100%' }}
                        >
                             {viewMode === 'video' ? (
                                <VideoPlayer
                                    lecture={selectedLecture}
                                    course={course}
                                    onLectureCompleted={handleLectureCompleted}
                                    completedLectures={completedLectures}
                                    focusQuestionId={focusQuestionId}
                                />
                             ) : (
                                <CourseAssessment
                                    courseId={courseId}
                                    assessment={assessment}
                                    isCourseCompleted={completedLectures.length === getAllLecturesInOrder().length}
                                    onAssessmentUpdate={(newAssessment) => setAssessment(newAssessment)}
                                    courseName={course.name}
                                    tutorName={course.creatorId?.name || "Instructor"}
                                    studentName={currentUser?.name || "Student"}
                                />
                             )}
                        </div>

                        {/* Desktop sidebar - with transition */}
                        <div
                            className={`hidden md:block border-l border-gray-300 dark:border-slate-600 bg-white dark:bg-[#1f2227] overflow-auto transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-96' : 'w-0'}`}
                        >
                            {isSidebarOpen && (
                                <CourseSidebar
                                    courseData={course.courseData}
                                    setSelectedVideo={setSelectedVideo}
                                    selectedVideoId={viewMode === 'video' ? selectedLecture?._id : undefined}
                                    completedLectures={completedLectures}
                                    course={course}
                                    isAssessmentSelected={viewMode === 'assessment'}
                                    onAssessmentSelect={() => {
                                        setViewMode('assessment');
                                        if (window.innerWidth < 768) {
                                            setIsSidebarOpen(false);
                                        }
                                    }}
                                    isAssessmentAccessible={completedLectures.length === getAllLecturesInOrder().length}
                                />
                            )}
                        </div>

                        {/* Mobile sidebar panel */}
                        <div
                            className={`md:hidden fixed inset-y-0 right-0 z-50 w-80 bg-white dark:bg-[#1f2227] shadow-xl transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
                            style={{ top: '61px' }} // Adjust based on header height
                        >
                            <CourseSidebar
                                courseData={course.courseData}
                                setSelectedVideo={setSelectedVideo}
                                selectedVideoId={viewMode === 'video' ? selectedLecture?._id : undefined}
                                completedLectures={completedLectures}
                                course={course}
                                isAssessmentSelected={viewMode === 'assessment'}
                                onAssessmentSelect={() => {
                                    setViewMode('assessment');
                                    setIsSidebarOpen(false);
                                }}
                                isAssessmentAccessible={completedLectures.length === getAllLecturesInOrder().length}
                            />
                        </div>

                        {/* Mobile overlay */}
                        {isSidebarOpen && (
                            <div
                                className="md:hidden fixed inset-0 bg-black/50 z-40"
                                style={{ top: '64px' }} // Adjust based on header height
                                onClick={() => setIsSidebarOpen(false)}
                            />
                        )}

                        {/* Desktop toggle sidebar button */}
                        <button
                            onClick={toggleSidebar}
                            className="hidden md:block absolute right-0 top-1/2 transform -translate-y-1/2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-l-md p-2 shadow-md hover:bg-gray-50 dark:hover:bg-slate-600 z-10"
                        >
                            {isSidebarOpen ? (
                                <ChevronRight className='w-4 h-4' />
                            ) : (
                                <ChevronLeft className='w-4 h-4' />
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