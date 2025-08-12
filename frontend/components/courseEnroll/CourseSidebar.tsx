import React, { useState } from 'react';
import { FaRegPlayCircle, FaCheckCircle } from "react-icons/fa";
import { RiArrowDropDownLine } from "react-icons/ri";

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

interface CourseSidebarProps {
    courseData: CourseSection[];
    setSelectedVideo: (video: LectureContent) => void;
    selectedVideoId: string | undefined;
}

const CourseSidebar = ({ courseData, setSelectedVideo, selectedVideoId }: CourseSidebarProps) => {
    const [expandedSections, setExpandedSections] = useState<{ [key: number]: boolean }>(
        courseData.reduce((acc, _, index) => ({ ...acc, [index]: false }), {})
    );

    const toggleSection = (sectionIndex: number) => {
        setExpandedSections((prev) => ({
            ...prev,
            [sectionIndex]: !prev[sectionIndex],
        }));
    };

    const formatTime = (minutes: number) => {
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hrs > 0 ? `${hrs}h ` : ''}${mins}m`;
    };

    // Calculate progress (could be stored in state or fetched from backend)
    const calculateProgress = () => {
        const totalVideos = courseData.reduce(
            (total, section) => total + section.sectionContents.length, 0
        );

        // In a real app, this would be based on completed videos
        const completedVideos = 0;

        return Math.round((completedVideos / totalVideos) * 100);
    };

    return (
        <div className="flex flex-col h-screen overflow-y-scroll">
            <div className="p-4 border-b border-gray-300 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Course Content</h2>
                <div className="mt-2">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 dark:text-gray-300">{calculateProgress()}% complete</span>
                        <span className="text-gray-700 dark:text-gray-300">
                            {courseData.reduce((total, section) => total + section.sectionContents.length, 0)} lectures
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${calculateProgress()}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="flex-1">
                {courseData.map((section, index) => (
                    <div key={section._id} className="border-b border-gray-300 dark:border-slate-700 ">
                        <button
                            className="w-full px-4 py-3 flex justify-between items-center focus:outline-none hover:bg-gray-100 dark:hover:bg-black/20 cursor-pointer"
                            onClick={() => toggleSection(index)}
                        >
                            <span className="font-semibold text-[16px] text-gray-900 dark:text-white text-left">
                                {index + 1}. {section.sectionTitle}
                            </span>
                            <RiArrowDropDownLine className={`text-4xl mr-2 text-gray-500 dark:text-gray-400 transform ${expandedSections[index] ? 'rotate-180' : 'rotate-0'} transition-transform duration-200`} />
                        </button>

                        {expandedSections[index] && (
                            <>
                                {section.sectionContents.map((content) => (
                                    <div
                                        key={content._id}
                                        className={`px-4 py-3 cursor-pointer border-t border-gray-300 dark:border-slate-600 flex justify-between items-center
                                            ${selectedVideoId === content._id
                                                ? 'bg-gray-200/60 dark:bg-indigo-900/20 border-l-4'
                                                : 'hover:bg-gray-100 dark:hover:bg-black/20'}`}
                                        onClick={() => setSelectedVideo(content)}
                                    >
                                        <div className='flex gap-3 items-center'>
                                            <FaRegPlayCircle className='text-sm text-gray-400 dark:text-gray-500' />

                                            <div className="flex flex-col">
                                                <span className={`text-[14px] ${selectedVideoId === content._id
                                                    ? 'text-indigo-700 dark:text-indigo-300'
                                                    : 'text-black dark:text-white'
                                                    }`}>
                                                    {content.videoTitle}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatTime(content.videoLength)}
                                                </span>
                                            </div>
                                        </div>
                                        <FaCheckCircle className='text-green-500' />

                                    </div>

                                ))}
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CourseSidebar;