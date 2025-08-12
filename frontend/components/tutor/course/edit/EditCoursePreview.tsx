"use client"

import React, { useState } from 'react';
import Image from 'next/image';
import { CourseInfoProps, BenefitsProps, PrerequisitesProps, CourseDataProps } from "@/type";
import { Button } from '@/components/ui/button';
import { CheckCheck, ShieldAlert, CirclePlay, Clock, FileVideo, Bookmark } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface EditCoursePreviewProps {
    active: number;
    setActive: (active: number) => void;
    courseInfo: CourseInfoProps;
    benefits: BenefitsProps[];
    prerequisites: PrerequisitesProps[];
    courseData: CourseDataProps[];
    thumbnailPreview: string,
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
    courseId
}: EditCoursePreviewProps) => {

    const calculateTotalDuration = () => {
        let totalMinutes = 0;
        courseData.forEach(section => {
            section.sectionContents.forEach(content => {
                totalMinutes += content.videoLength || 0;
            });
        });

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
    };

    const totalVideos = courseData.reduce((acc, section) => acc + section.sectionContents.length, 0);

    const formData = {
        name: courseInfo.name,
        description: courseInfo.description,
        categories: courseInfo.categories,
        price: courseInfo.price,
        estimatedPrice: courseInfo.estimatedPrice,
        tags: courseInfo.tags,
        level: courseInfo.level,
        demoUrl: courseInfo.demoUrl,
        thumbnail: courseInfo.thumbnail,
        benefits: benefits.map(benefit => ({
            title: benefit.title
        })),
        prerequisites: prerequisites.map(prerequisite => ({
            title: prerequisite.title
        })),
        courseData: courseData.map((section) => ({
            sectionTitle: section.sectionTitle,
            sectionContents: section.sectionContents.map(content => ({
                videoTitle: content.videoTitle,
                videoDescription: content.videoDescription,
                videoUrl: content.videoUrl,
                videoLength: content.videoLength,
                videoLinks: content.videoLinks.map(link => ({
                    title: link.title,
                    url: link.url
                }))
            }))
        }))
    }

    console.log("Form Data: ", formData);

    const router = useRouter();

    const [isEditing, setIsEditing] = useState(false);

    const handleEditCourse = async (e: any) => {
        e.preventDefault();
        setIsEditing(true);
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
                toast.error("Editing Course Failed");
                console.log("Edit Course Failed: ", data.message);
            } else {
                router.replace("/admin/data/courses");
                toast.success("Course Edit Successfully");
            }
        } catch (error: any) {
            console.log(error.message);
        } finally {
            setIsEditing(false);
        }

    }

    const getStreamableEmbedUrl = (url: string) => {
        if (!url) return null;
        const videoId = url.split("/").pop(); // Get the last part of the URL (e.g., "abc123" from "https://streamable.com/abc123")
        return videoId ? `https://streamable.com/e/${videoId}?autoplay=0` : null;
    };

    return (
        <div className="w-full flex flex-col gap-8">

            {/* Course Hero Section */}
            <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-200 dark:to-indigo-500 rounded-lg p-4 md:p-6">
                <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                    {/* Course Thumbnail */}
                    <div className="w-full md:w-1/3 max-w-[500px]">
                        {courseInfo.thumbnail ? (
                            <div className="aspect-video md:aspect-square w-full">
                                <img
                                    src={courseInfo?.thumbnail as string || thumbnailPreview}
                                    alt={courseInfo.name}
                                    className="w-full h-full object-cover rounded-xl"
                                />
                            </div>
                        ) : (
                            <div className="aspect-video md:aspect-square w-full bg-gray-200 rounded-lg flex items-center justify-center">
                                <p className="text-gray-500">No thumbnail uploaded</p>
                            </div>
                        )}
                    </div>

                    {/* Course Info */}
                    <div className="w-full md:w-2/3 max-w-[600px] space-y-4">
                        <div className="flex flex-col gap-4">
                            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold line-clamp-2">
                                {courseInfo.name || "Course Title"}
                            </h2>

                            <div className="flex flex-col gap-3">
                                <div className='flex gap-3 items-center'>
                                    <h3 className="text-xl md:text-2xl lg:text-3xl font-bold">
                                        ${courseInfo.price || 0}
                                    </h3>
                                    {courseInfo.estimatedPrice > 0 && courseInfo.estimatedPrice !== courseInfo.price && (
                                        <p className="text-sm text-gray-500 line-through">
                                            ${courseInfo.estimatedPrice}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {courseInfo.level && (
                                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                            {courseInfo.level}
                                        </span>
                                    )}
                                    {courseInfo.tags && courseInfo.tags.split(',').map((tag, index) => (
                                        <span
                                            key={index}
                                            className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded"
                                        >
                                            {tag.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
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

            {/* Course demo URL */}
            {courseInfo.demoUrl && (
                <div className="w-full aspect-video">
                    {getStreamableEmbedUrl(courseInfo.demoUrl) ? (
                        <iframe
                            src={getStreamableEmbedUrl(courseInfo.demoUrl) as string}
                            width="100%"
                            height="100%"
                            allow="fullscreen"
                            allowFullScreen
                            className="rounded-lg"
                            style={{ border: "none", overflow: "hidden" }}
                            title="Course Demo Video"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                            <p className="text-gray-500">Invalid demo URL</p>
                        </div>
                    )}
                </div>
            )}

            {/* Course Description */}
            <div className="light-theme dark:dark-theme border border-gray-300 dark:border-slate-500 rounded-lg p-4">
                <h3 className="text-xl font-bold mb-4">Description</h3>
                <p className="text-gray-600 dark:text-gray-300">{courseInfo.description || "No description provided"}</p>
            </div>

            {/* Course Details */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* Benefits */}
                <div className="light-theme dark:dark-theme border border-gray-300 dark:border-slate-500 rounded-lg p-4">
                    <h3 className="text-xl font-bold mb-4">What You'll Learn</h3>
                    {benefits.length > 0 ? (
                        <ul className="space-y-2">
                            {benefits.map((benefit, index) => (
                                <li key={index} className="flex items-start">
                                    <CheckCheck className='h-5 w-5 text-green-500 mr-2 mt-0.5' />
                                    <span className='text-gray-600 dark:text-gray-300'>{benefit.title}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-600 dark:text-gray-300">No benefits added yet</p>
                    )}
                </div>

                {/* Prerequisites */}
                <div className="light-theme dark:dark-theme border border-gray-300 dark:border-slate-500 rounded-lg p-4">
                    <h3 className="text-xl font-bold mb-4">Prerequisites</h3>
                    {prerequisites.length > 0 ? (
                        <ul className="space-y-2">
                            {prerequisites.map((prerequisite, index) => (
                                <li key={index} className="flex items-start">
                                    <ShieldAlert className='h-5 w-5 text-blue-500 mr-2 mt-0.5' />
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
            <div className="light-theme dark:dark-theme border border-gray-300 dark:border-slate-500 rounded-lg p-4">
                <h3 className="text-xl font-bold mb-4">Course Content</h3>

                {courseData.length > 0 ? (
                    <div className="space-y-4">
                        {courseData.map((section, sectionIndex) => (
                            <div key={sectionIndex} className="border border-gray-300 dark:border-slate-500 rounded-lg overflow-hidden">
                                <div className="bg-gray-100 dark:bg-slate-400 p-4 flex justify-between items-center">
                                    <h4 className="font-semibold">
                                        Section {sectionIndex + 1}: {section.sectionTitle}
                                    </h4>
                                    <span className="text-sm text-gray-500 dark:text-gray-200">
                                        {section.sectionContents.length} videos
                                    </span>
                                </div>

                                <div className="divide-y divide-gray-300">
                                    {section.sectionContents.map((content, contentIndex) => (
                                        <div key={contentIndex} className="p-4 flex flex-col gap-4">
                                            {/* title + time */}
                                            <div className="flex justify-between items-center ">
                                                <div className="flex items-center">
                                                    <CirclePlay className="h-5 w-5 text-red-500 mr-2" />
                                                    <span className="font-medium">{content.videoTitle}</span>
                                                </div>

                                                {content.videoLength > 0 && (
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                                        {Math.floor(content.videoLength / 60)}:{String(content.videoLength % 60).padStart(2, '0')}
                                                    </span>
                                                )}
                                            </div>

                                            {content.videoDescription && (
                                                <p className="text-sm text-gray-600 dark:text-gray-300 ml-7 ">{content.videoDescription}</p>
                                            )}

                                            {content.videoLinks && content.videoLinks.length > 0 && (
                                                <div className="ml-7 flex gap-3">
                                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Additional Resources:</p>
                                                    <ul className="space-y-1">
                                                        {content.videoLinks.map((link, linkIndex) => (
                                                            <li key={linkIndex} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                                                <a href={link.url} target="_blank" rel="noopener noreferrer">
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
                    onClick={handleEditCourse}
                    disabled={isEditing}
                    className={`w-[200px] bg-blue-500 text-white font-medium hover:bg-blue-600 cursor-pointer ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isEditing ? (
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
                            Editing...
                        </div>
                    ) : (
                        "Edit Course"
                    )}
                </Button>
            </div>
        </div>
    );
};

export default EditCoursePreview;