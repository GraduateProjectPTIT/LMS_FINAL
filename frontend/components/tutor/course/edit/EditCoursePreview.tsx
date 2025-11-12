"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import PreviewVideoModal from './PreviewVideoModal';
import { formatDuration } from '@/utils/convertToMinutes';

import { CheckCheck, ShieldAlert, CirclePlay, Clock, FileVideo, Bookmark, Play, Link } from 'lucide-react';

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
    courseStatus: string;
    setCourseStatus: React.Dispatch<React.SetStateAction<string>>;
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
    courseId,
    courseStatus,
    setCourseStatus
}: EditCoursePreviewProps) => {

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

    const calculateTotalDurationSeconds = () => {
        let totalSeconds = 0;
        courseData.forEach(section => {
            section.sectionContents.forEach(lecture => {
                totalSeconds += lecture.videoLength || 0;
            });
        });
        return totalSeconds;
    };

    const totalVideos = courseData.reduce((acc, section) => acc + section.sectionContents.length, 0);

    const formData = {
        _id: courseInfo._id,
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
        })),
        status: courseStatus
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
                                {hasThumbnail() ? (
                                    <img
                                        src={getThumbnailUrl()}
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
                            <span className="font-medium text-gray-800 dark:text-white">{formatDuration(calculateTotalDurationSeconds())}</span>
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
                                                        {formatDuration(lecture.videoLength)}
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

            <div className='flex flex-col gap-4'>
                {/* Status Selection */}
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCourseStatus('draft')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${courseStatus === 'draft'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            Draft
                        </button>
                        <button
                            onClick={() => setCourseStatus('published')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${courseStatus === 'published'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            Published
                        </button>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-row justify-between gap-4 mt-8">
                    <Button
                        onClick={() => setActive(active - 1)}
                        className="w-[200px] bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-black dark:text-white rounded-lg cursor-pointer transition-colors"
                    >
                        Back to Course Content
                    </Button>

                    <Button
                        onClick={handleUpdateCourse}
                        disabled={isUpdating}
                        className={`w-[200px] bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium cursor-pointer rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                Updating...
                            </div>
                        ) : (
                            "Update Course"
                        )}
                    </Button>
                </div>
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

export default EditCoursePreview;