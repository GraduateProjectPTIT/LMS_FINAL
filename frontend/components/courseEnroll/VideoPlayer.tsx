"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { SectionLecture } from "@/type";
import { FaRegPlayCircle, FaCheck } from "react-icons/fa";
import LectureQuestions from './LectureQuestions';
import LectureResources from './LectureResources';

interface VideoPlayerProps {
    lecture: SectionLecture | null;
    course: any;
    onLectureCompleted: (lectureId: string) => void; // Callback để update completion status
    completedLectures: string[]; // Array of completed lecture IDs
}

const VideoPlayer = ({ lecture, course, onLectureCompleted, completedLectures }: VideoPlayerProps) => {
    const [activeTab, setActiveTab] = useState<'description' | 'resources' | 'questions'>('description');
    const [watchedPercentage, setWatchedPercentage] = useState(0);
    const [isMarkingCompleted, setIsMarkingCompleted] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const { currentUser } = useSelector((state: RootState) => state.user);

    const isAdmin = currentUser?.role === 'admin';
    const isCreator = currentUser?._id === course?.creatorId?._id;
    const canBypass = isAdmin || isCreator;

    // Check if current lecture is completed
    const isLectureCompleted = lecture ? completedLectures.includes(lecture._id) : false;

    // Reset watched percentage when lecture changes
    useEffect(() => {
        setWatchedPercentage(0);
    }, [lecture?._id]);

    // Handle video time update to track progress
    const handleTimeUpdate = () => {
        if (videoRef.current && !isLectureCompleted) {
            const video = videoRef.current;
            const percentage = (video.currentTime / video.duration) * 100;
            setWatchedPercentage(Math.round(percentage));
        }
    };

    // Handle marking lecture as completed
    const handleMarkAsCompleted = async () => {
        if (!lecture || isLectureCompleted) return;

        setIsMarkingCompleted(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/complete_lecture`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    courseId: course._id,
                    lectureId: lecture._id
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                onLectureCompleted(lecture._id);
                console.log('Lecture marked as completed successfully');
            } else {
                console.error('Failed to mark lecture as completed:', data.message);
            }
        } catch (error) {
            console.error('Error marking lecture as completed:', error);
        } finally {
            setIsMarkingCompleted(false);
        }
    };

    if (!lecture) {
        return (
            <div className="flex flex-col h-full">
                <div className="bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center aspect-video">
                    <div className="text-center p-6">
                        <FaRegPlayCircle className="text-gray-400 dark:text-gray-500 mx-auto" size={50} />
                        <p className="mt-4 text-gray-500 dark:text-gray-400">Select a video to start learning</p>
                    </div>
                </div>
            </div>
        );
    }

    const showMarkAsCompletedButton = !isLectureCompleted && (watchedPercentage >= 80 || canBypass);

    return (
        <div className="flex flex-col h-screen overflow-y-scroll pb-20">
            {/* Video display */}
            <div className="bg-black rounded-lg overflow-hidden w-full aspect-video flex-shrink-0">
                <video
                    ref={videoRef}
                    src={lecture.video.url}
                    controls
                    className="w-full h-full"
                    key={lecture._id} // Force re-render when lecture changes
                    onTimeUpdate={handleTimeUpdate}
                >
                    Your browser does not support the video tag.
                </video>
            </div>

            <div className="flex-1 w-full max-w-full mt-4">
                {/* Title and Mark as Completed button */}
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex-1">
                        {lecture.videoTitle}
                    </h2>

                    {/* Mark as Completed button */}
                    {showMarkAsCompletedButton && (
                        <button
                            onClick={handleMarkAsCompleted}
                            disabled={isMarkingCompleted}
                            className="ml-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center transition-colors duration-200 flex-shrink-0"
                        >
                            <FaCheck className="mr-2" />
                            {isMarkingCompleted ? 'Marking...' : 'Mark as Completed'}
                        </button>
                    )}

                    {/* Completed indicator */}
                    {isLectureCompleted && (
                        <div className="ml-4 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg font-medium text-sm flex items-center flex-shrink-0">
                            <FaCheck className="mr-2" />
                            Completed
                        </div>
                    )}
                </div>

                {/* Progress indicator (only show for non-bypass users and incomplete lectures) */}
                {!canBypass && !isLectureCompleted && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <span>Progress</span>
                            <span>{watchedPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all duration-300 ${watchedPercentage >= 80 ? 'bg-green-500' : 'bg-blue-500'
                                    }`}
                                style={{ width: `${Math.min(watchedPercentage, 100)}%` }}
                            ></div>
                        </div>
                        {watchedPercentage >= 80 && (
                            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                ✓ You can now mark this lecture as completed
                            </p>
                        )}
                    </div>
                )}

                {/* Tabs */}
                <div className="border-b border-gray-300 dark:border-slate-700 mb-4">
                    <nav className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('description')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'description'
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                                }`}
                        >
                            Description
                        </button>
                        <button
                            onClick={() => setActiveTab('resources')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'resources'
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                                }`}
                        >
                            Resources {lecture.videoLinks.length > 0 && `(${lecture.videoLinks.length})`}
                        </button>
                        <button
                            onClick={() => setActiveTab('questions')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'questions'
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                                }`}
                        >
                            Q&A {lecture.lectureComments.length > 0 && `(${lecture.lectureComments.length})`}
                        </button>
                    </nav>
                </div>

                {/* Tab content */}
                <div className="pb-8">
                    {activeTab === 'description' && (

                        <div className="mb-8 p-4 bg-gray-100 dark:bg-slate-800 rounded-lg border-l-4 border-blue-500">
                            <p className="text-gray-700 dark:text-gray-300">
                                {lecture.videoDescription}
                            </p>
                        </div>
                    )}

                    {activeTab === 'resources' && (
                        <div>
                            {lecture.videoLinks && lecture.videoLinks.length > 0 ? (
                                <LectureResources lecture={lecture} />
                            ) : (
                                <div className="text-center py-8 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                    <p className="text-gray-500 dark:text-gray-400">No resources available for this video</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'questions' && (
                        <div>
                            {lecture.lectureComments && lecture.lectureComments.length > 0 ? (
                                <LectureQuestions
                                    courseId={course._id}
                                    contentId={lecture._id}

                                />
                            ) : (
                                <div className="text-center py-8 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                    <p className="text-gray-500 dark:text-gray-400">No questions available for this video</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div >
        </div >
    );
};

export default VideoPlayer;