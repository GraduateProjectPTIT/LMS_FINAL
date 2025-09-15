"use client"

import React, { useState } from 'react';
import Image from 'next/image';
import { ICreateCourseInformation, ICreateBenefits, ICreatePrerequisites, ICreateSection } from "@/type";
import { Button } from '@/components/ui/button';
import { CheckCheck, ShieldAlert, CirclePlay, Clock, FileVideo, Bookmark } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface IEditSection {
    _id?: string; // MongoDB ID cho sections có sẵn
    id?: string;  // Temp ID cho sections mới
    sectionTitle: string;
    sectionContents: IEditLecture[];
}

interface IEditLecture {
    _id?: string; // MongoDB ID cho lectures có sẵn
    id?: string;  // Temp ID cho lectures mới
    videoTitle: string;
    videoDescription: string;
    video: { public_id?: string; url: string };
    videoLength: number;
    videoLinks?: { title: string; url: string }[];
    isUploading?: boolean;
    uploadProgress?: number;
}

interface EditCoursePreviewProps {
    active: number;
    setActive: (active: number) => void;
    courseInfo: any;
    benefits: any[];
    prerequisites: any[];
    courseData: IEditSection[];
    thumbnailPreview: string;
    setThumbnailPreview: (thumbnailPreview: string) => void;
    courseId: string;
}

const EditCoursePreview = ({
    active,
    setActive,
    courseInfo,
    benefits,
    prerequisites,
    courseData,
    thumbnailPreview,
    setThumbnailPreview,
    courseId
}: EditCoursePreviewProps) => {

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
        _id: courseInfo._id,
        name: courseInfo.name,
        description: courseInfo.description,
        categories: courseInfo.categories,
        price: courseInfo.price,
        estimatedPrice: courseInfo.estimatedPrice,
        tags: courseInfo.tags,
        level: courseInfo.level,
        videoDemo: courseInfo.videoDemo,
        thumbnail: courseInfo.thumbnail,
        benefits: benefits.map(benefit => ({
            ...(benefit._id && { _id: benefit._id }), // Include _id if it exists (for existing benefits)
            title: benefit.title
        })),
        prerequisites: prerequisites.map(prerequisite => ({
            ...(prerequisite._id && { _id: prerequisite._id }), // Include _id if it exists (for existing prerequisites)
            title: prerequisite.title
        })),
        courseData: courseData.map((section) => ({
            ...(section._id && { _id: section._id }), // Include _id if it exists
            sectionTitle: section.sectionTitle,
            sectionContents: section.sectionContents.map(lecture => ({
                ...(lecture._id && { _id: lecture._id }), // Include _id if it exists
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

    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdateCourse = async (e: any) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/update_course/${courseId}`, {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error("Updating Course Failed");
                console.log("Update Course Failed: ", data.message);
            } else {
                router.replace("/tutor/data/courses");
                toast.success("Course Updated Successfully");
            }
        } catch (error: any) {
            console.log(error.message);
        } finally {
            setIsUpdating(false);
        }
    }

    const getThumbnailUrl = () => {
        if (thumbnailPreview) {
            return thumbnailPreview;
        }

        if (courseInfo?.thumbnail) {
            if (typeof courseInfo.thumbnail === 'object' && courseInfo.thumbnail?.url) {
                return courseInfo.thumbnail.url;
            }
        }
        return '';
    }

    const hasThumbnail = () => {
        if (thumbnailPreview) return true;

        if (courseInfo?.thumbnail) {
            if (typeof courseInfo.thumbnail === 'object' && courseInfo.thumbnail?.url) {
                return true;
            }
        }

        return false;
    };

    return (
        <div className="w-full flex flex-col gap-8">

            {/* Course Hero Section */}
            <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-200 dark:from-blue-900 dark:to-indigo-800 rounded-lg p-4 md:p-6">
                <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                    {/* Course Thumbnail */}
                    <div className="w-full md:w-1/3 max-w-[500px]">
                        {hasThumbnail() ? (
                            <div className="aspect-video md:aspect-square w-full">
                                <img
                                    src={getThumbnailUrl()}
                                    alt={courseInfo.name || 'Course thumbnail'}
                                    className="w-full h-full object-cover rounded-xl"
                                />
                            </div>
                        ) : (
                            <div className="aspect-video md:aspect-square w-full bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                <p className="text-gray-500 dark:text-gray-400">No thumbnail uploaded</p>
                            </div>
                        )}
                    </div>

                    {/* Course Info */}
                    <div className="w-full md:w-2/3 max-w-[600px] space-y-4">
                        <div className="flex flex-col gap-4">
                            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold line-clamp-2 text-gray-800 dark:text-white">
                                {courseInfo.name || "Course Title"}
                            </h2>

                            <div className="flex flex-col gap-3">
                                <div className='flex gap-3 items-center'>
                                    <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">
                                        ${courseInfo.price || 0}
                                    </h3>
                                    {courseInfo.estimatedPrice && courseInfo.estimatedPrice > 0 && courseInfo.estimatedPrice !== courseInfo.price && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 line-through">
                                            ${courseInfo.estimatedPrice}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {courseInfo.level && (
                                        <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded">
                                            {courseInfo.level}
                                        </span>
                                    )}
                                    {courseInfo.tags && courseInfo.tags.split(',').map((tag: string, index: number) => (
                                        <span
                                            key={index}
                                            className="bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 text-xs font-medium px-2.5 py-0.5 rounded"
                                        >
                                            {tag.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                                <div className="flex items-center gap-1">
                                    <Clock className='w-4 h-4' />
                                    <span>{calculateTotalDuration()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <FileVideo className='w-4 h-4' />
                                    <span>{totalVideos} videos</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Bookmark className='w-4 h-4' />
                                    <span>{courseData.length} sections</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Course demo video */}
            {(!courseInfo.videoDemo || !courseInfo.videoDemo.url) ? (
                <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400">No demo video uploaded</p>
                </div>
            ) : (
                <div className="w-full">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Course Demo</h3>
                    <div className="w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
                        <video
                            src={courseInfo.videoDemo.url}
                            controls
                            className="w-full h-full object-contain"
                            preload="metadata"
                        >
                            <p className="text-white text-center p-4">
                                Your browser does not support the video tag.
                            </p>
                        </video>
                    </div>
                </div>

            )}


            {/* Course Description */}
            <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Description</h3>
                <p className="text-gray-600 dark:text-gray-300">{courseInfo.description || "No description provided"}</p>
            </div>

            {/* Course Details */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* Benefits */}
                <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">What You'll Learn</h3>
                    {benefits.length > 0 ? (
                        <ul className="space-y-2">
                            {benefits.map((benefit, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <CheckCheck className='h-5 w-5 flex-shrink-0 text-green-500' />
                                    <span className='text-gray-600 dark:text-gray-300'>{benefit.title}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-600 dark:text-gray-300">No benefits added yet</p>
                    )}
                </div>

                {/* Prerequisites */}
                <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Prerequisites</h3>
                    {prerequisites.length > 0 ? (
                        <ul className="space-y-2">
                            {prerequisites.map((prerequisite, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <ShieldAlert className='h-5 w-5 flex-shrink-0 text-blue-500' />
                                    <span className='text-gray-600 dark:text-gray-300'>{prerequisite.title}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-600 dark:text-gray-300">No prerequisites added yet</p>
                    )}
                </div>
            </div>

            {/* Course Content */}
            <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Course Content</h3>

                {courseData.length > 0 ? (
                    <div className="space-y-4">
                        {courseData.map((section, sectionIndex) => (
                            <div key={sectionIndex} className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                                <div className="bg-gray-100 dark:bg-gray-700 p-4 flex justify-between items-center">
                                    <h4 className="font-semibold text-gray-800 dark:text-white">
                                        Section {sectionIndex + 1}: {section.sectionTitle}
                                    </h4>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {section.sectionContents.length} lectures
                                    </span>
                                </div>

                                <div className="divide-y divide-gray-300 dark:divide-gray-600">
                                    {section.sectionContents.map((lecture, lectureIndex) => (
                                        <div key={lectureIndex} className="p-4 flex flex-col gap-4">
                                            {/* title + time */}
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center">
                                                    <CirclePlay className="h-5 w-5 text-red-500 mr-2" />
                                                    <span className="font-medium text-gray-800 dark:text-white">{lecture.videoTitle}</span>
                                                </div>

                                                {lecture.videoLength > 0 && (
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                                        {Math.floor(lecture.videoLength / 60)}:{String(lecture.videoLength % 60).padStart(2, '0')}
                                                    </span>
                                                )}
                                            </div>

                                            {lecture.videoDescription && (
                                                <p className="text-sm text-gray-600 dark:text-gray-300 ml-7">{lecture.videoDescription}</p>
                                            )}

                                            {lecture.videoLinks && lecture.videoLinks.length > 0 && (
                                                <div className="ml-7 flex flex-col gap-2">
                                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Additional Resources:</p>
                                                    <ul className="space-y-1">
                                                        {lecture.videoLinks.map((link, linkIndex) => (
                                                            <li key={linkIndex} className="text-sm">
                                                                <a
                                                                    href={link.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                                                >
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
                    <p className="text-gray-600 dark:text-gray-300">No course content added yet</p>
                )}
            </div>

            {/* Buttons */}
            <div className="flex flex-row justify-between gap-4 mt-8">
                <Button
                    onClick={() => setActive(active - 1)}
                    className="w-[200px] bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-black dark:text-white rounded-lg cursor-pointer"
                >
                    Back to Course Content
                </Button>

                <Button
                    onClick={handleUpdateCourse}
                    disabled={isUpdating}
                    className={`w-[200px] bg-blue-500 text-white font-medium hover:bg-blue-600 cursor-pointer ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isUpdating ? (
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
        </div>
    );
};

export default EditCoursePreview;