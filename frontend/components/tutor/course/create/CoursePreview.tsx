"use client"

import React, { useState } from 'react';
import Image from 'next/image';
import { ICreateCourseInformation, ICreateBenefits, ICreatePrerequisites, ICreateSection } from "@/type";
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import PreviewVideoModal from './PreviewVideoModal';

import { CheckCheck, ShieldAlert, CirclePlay, Clock, FileVideo, Bookmark, Play, Link } from 'lucide-react';


interface CoursePreviewProps {
    active: number;
    setActive: (active: number) => void;
    courseInfo: ICreateCourseInformation;
    benefits: ICreateBenefits[];
    prerequisites: ICreatePrerequisites[];
    courseData: ICreateSection[];
    thumbnailPreview: string;
    setThumbnailPreview: (thumbnailPreview: string) => void;
}

const CoursePreview = ({
    active,
    setActive,
    courseInfo,
    benefits,
    prerequisites,
    courseData,
    thumbnailPreview,
    setThumbnailPreview
}: CoursePreviewProps) => {

    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewVideoUrl, setPreviewVideoUrl] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);

    const handleVideoPreview = (videoUrl: string) => {
        setPreviewVideoUrl(videoUrl);
        setShowPreviewModal(true);
    };

    const closePreviewModal = () => {
        setShowPreviewModal(false);
        setPreviewVideoUrl('');
    };

    const calculateTotalDuration = () => {
        let totalMinutes = 0;
        courseData.forEach(section => {
            section.sectionContents.forEach(lecture => {
                totalMinutes += lecture.videoLength || 0;
            });
        });

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
    };

    const totalVideos = courseData.reduce((acc, section) => acc + section.sectionContents.length, 0);

    const formData = {
        name: courseInfo.name,
        overview: courseInfo.overview,
        description: courseInfo.description,
        categories: courseInfo.categories,
        price: courseInfo.price,
        estimatedPrice: courseInfo.estimatedPrice,
        tags: courseInfo.tags,
        level: courseInfo.level,
        videoDemo: courseInfo.videoDemo,
        thumbnail: courseInfo.thumbnail,
        benefits: benefits.map(benefit => ({
            title: benefit.title
        })),
        prerequisites: prerequisites.map(prerequisite => ({
            title: prerequisite.title
        })),
        courseData: courseData.map((section) => ({
            sectionTitle: section.sectionTitle,
            sectionContents: section.sectionContents.map(lecture => ({
                videoTitle: lecture.videoTitle,
                videoDescription: lecture.videoDescription,
                video: lecture.video,
                videoLength: lecture.videoLength,
                videoLinks: lecture.videoLinks?.map(link => ({
                    title: link.title,
                    url: link.url
                })) || []
            }))
        }))
    }

    const router = useRouter();

    const [isCreating, setIsCreating] = useState(false);

    const handleCreateCourse = async (e: any) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/create_course`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error("Creating Course Failed");
                console.log("Create Course Failed: ", data.message);
            } else {
                router.replace("/tutor/data/courses");
                toast.success("Course Created Successfully");
            }
        } catch (error: any) {
            console.log(error.message);
        } finally {
            setIsCreating(false);
        }
    }

    return (
        <div className="w-full flex flex-col gap-8">
            {/* Course Thumbnail with Video Demo */}
            <div className="w-full">
                <div className="rounded-2xl overflow-hidden shadow-2xl relative group transition-all hover:shadow-blue-200/50 dark:hover:shadow-blue-400/30 border border-white/50 dark:border-blue-400/30 backdrop-blur-sm">
                    <div className="aspect-video relative">
                        {isPlaying && courseInfo.videoDemo?.url ? (
                            <video
                                src={courseInfo.videoDemo.url}
                                controls
                                autoPlay
                                className="w-full h-full rounded-2xl object-cover"
                            />
                        ) : (
                            <>
                                {courseInfo.thumbnail ? (
                                    <img
                                        src={thumbnailPreview}
                                        alt={courseInfo.name || "Course Image"}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                                        <p className="text-white text-xl">No thumbnail uploaded</p>
                                    </div>
                                )}

                                {/* Play button if demo available */}
                                {courseInfo.videoDemo?.url && (
                                    <button
                                        onClick={() => setIsPlaying(true)}
                                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                                    >
                                        <div className="bg-white text-blue-600 dark:bg-blue-600 dark:text-white rounded-full p-5 shadow-xl transform group-hover:scale-110 transition-all duration-300">
                                            <Play size={34} fill="currentColor" />
                                        </div>
                                    </button>
                                )}

                                {/* Course Preview Badge */}
                                <div className="absolute top-4 left-4 flex justify-center items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                                    <FileVideo className="w-4 h-4" />
                                    <p>Preview</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Course Information */}
            <div className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm flex flex-col gap-5'>
                {/* Title */}
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white leading-tight">
                    {courseInfo.name || "Course Title"}
                </h1>

                {/* Price Section */}
                <div className="flex items-center gap-3">
                    <div className="flex items-baseline gap-2">
                        <span className="font-medium text-gray-600 dark:text-gray-400">Price:</span>
                        <h2 className="text-[18px] font-bold text-gray-800 dark:text-white">
                            ${courseInfo.price || 0}
                        </h2>
                        {courseInfo.estimatedPrice && courseInfo.estimatedPrice > 0 && courseInfo.estimatedPrice !== courseInfo.price && (
                            <span className="text-[16px] text-gray-500 dark:text-gray-400 line-through">
                                ${courseInfo.estimatedPrice}
                            </span>
                        )}
                    </div>
                </div>

                {/* Level */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Level:</span>
                    <span className="text-gray-800 dark:text-white font-semibold">{courseInfo.level || "N/A"}</span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Tags:</span>
                    <span className="text-gray-800 dark:text-white font-semibold">{courseInfo.tags || "N/A"}</span>
                </div>

                {/* Course Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 block">Duration</span>
                            <span className="font-medium text-gray-800 dark:text-white">{calculateTotalDuration()}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <FileVideo className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 block">Videos</span>
                            <span className="font-medium text-gray-800 dark:text-white">{totalVideos}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <Bookmark className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 block">Sections</span>
                            <span className="font-medium text-gray-800 dark:text-white">{courseData.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Overview */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Course Overview</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {courseInfo.overview || "No overview provided"}
                </p>
            </div>

            {/* Course Details */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* Benefits */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                    <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">What You'll Learn</h3>
                    {benefits.length > 0 ? (
                        <ul className="space-y-3">
                            {benefits.map((benefit, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <CheckCheck className="h-5 w-5 flex-shrink-0 text-green-500 mt-0.5" />
                                    <span className="text-gray-600 dark:text-gray-300 leading-relaxed">{benefit.title}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 italic">No benefits added yet</p>
                    )}
                </div>

                {/* Prerequisites */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                    <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">Prerequisites</h3>
                    {prerequisites.length > 0 ? (
                        <ul className="space-y-3">
                            {prerequisites.map((prerequisite, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <ShieldAlert className="h-5 w-5 flex-shrink-0 text-blue-500 mt-0.5" />
                                    <span className="text-gray-600 dark:text-gray-300 leading-relaxed">{prerequisite.title}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 italic">No prerequisites added yet</p>
                    )}
                </div>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Course Description</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {courseInfo.description || "No description provided"}
                </p>
            </div>

            {/* Course Content */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Course Content</h3>

                {courseData.length > 0 ? (
                    <div className="space-y-6">
                        {courseData.map((section, sectionIndex) => (
                            <div key={sectionIndex} className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 p-4 flex justify-between items-center">
                                    <h4 className="font-semibold text-gray-800 dark:text-white text-lg">
                                        Section {sectionIndex + 1}: {section.sectionTitle}
                                    </h4>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full">
                                        {section.sectionContents.length} lectures
                                    </span>
                                </div>

                                <div className="divide-y divide-gray-200 dark:divide-gray-600">
                                    {section.sectionContents.map((lecture, lectureIndex) => (
                                        <div key={lectureIndex} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            {/* Title, Preview Button and Time */}
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="flex items-center gap-3">
                                                    <CirclePlay className="h-5 w-5 text-red-500 flex-shrink-0" />
                                                    <span className="font-medium text-gray-800 dark:text-white">{lecture.videoTitle}</span>

                                                    {/* Preview Button */}
                                                    {lecture.video && (
                                                        <button
                                                            onClick={() => handleVideoPreview(lecture.video.url)}
                                                            className="flex items-center gap-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-700 dark:text-blue-200 px-2 py-1 rounded-md transition-colors"
                                                        >
                                                            <Play className="w-3 h-3" />
                                                            Preview
                                                        </button>
                                                    )}
                                                </div>

                                                {lecture.videoLength > 0 && (
                                                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                                                        {Math.floor(lecture.videoLength / 60)}:{String(lecture.videoLength % 60).padStart(2, '0')}
                                                    </span>
                                                )}
                                            </div>

                                            {lecture.videoDescription && (
                                                <p className="text-sm text-gray-600 dark:text-gray-300 ml-8 mb-3 leading-relaxed">
                                                    {lecture.videoDescription}
                                                </p>
                                            )}

                                            {lecture.videoLinks && lecture.videoLinks.length > 0 && (
                                                <div className="ml-8 flex flex-col gap-2">
                                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Additional Resources:</p>
                                                    <ul className="space-y-1">
                                                        {lecture.videoLinks.map((link, linkIndex) => (
                                                            <li key={linkIndex} className="text-sm">
                                                                <a
                                                                    href={link.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors flex items-center gap-1 "
                                                                >
                                                                    <Link className='w-4 h-4' />
                                                                    {link.title}
                                                                </a>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <FileVideo className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500 dark:text-gray-400 text-lg">No course content added yet</p>
                    </div>
                )}
            </div>

            {/* Buttons */}
            <div className="flex flex-row justify-between gap-4 mt-8">
                <Button
                    onClick={() => setActive(active - 1)}
                    className="w-[200px] bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-black dark:text-white rounded-lg cursor-pointer transition-colors"
                >
                    Back to Course Content
                </Button>

                <Button
                    onClick={handleCreateCourse}
                    disabled={isCreating}
                    className={`w-[200px] bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium cursor-pointer rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isCreating ? (
                        <div className="flex items-center justify-center">
                            <svg
                                className="animate-spin h-5 w-5 mr-2"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            Creating...
                        </div>
                    ) : (
                        "Create & Publish Course"
                    )}
                </Button>
            </div>

            {/* Video Preview Modal */}
            <PreviewVideoModal
                showPreviewModal={showPreviewModal}
                videoUrl={previewVideoUrl}
                onClose={closePreviewModal}
            />
        </div>
    );
};

export default CoursePreview;