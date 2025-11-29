"use client"

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image';
import Loader from '../Loader';
import { useDispatch, useSelector } from 'react-redux';
import { addItemToCartStart, addItemToCartSuccess, addItemToCartFailure } from '@/redux/cart/cartSlice';
import { RootState } from '@/redux/store';
import RelatedCourse from './RelatedCourse';
import CourseReview from './CourseReview';
import CallToActionCourse from './CallToActionCourse';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { getValidThumbnail, isValidImageUrl } from "@/utils/handleImage";
import { formatDuration } from '@/utils/convertToMinutes';

import { Clock, Award, CheckCircle, BookOpen, Play, Users, Star, User, Globe, MessageCircle } from 'lucide-react';
import { BiCategoryAlt } from "react-icons/bi";
import { BsCameraVideo } from "react-icons/bs";

interface IOverviewBenefit {
    _id: string;
    title: string;
}

interface IOverviewPrerequisite {
    _id: string;
    title: string;
}

interface IOverviewCategory {
    _id: string;
    title: string;
}

interface IOverviewMedia {
    public_id?: string;
    url: string;
}

interface IOverviewCreator {
    _id: string;
    name: string;
    email: string;
    avatar: {
        public_id?: string;
        url: string;
    };
    bio?: string;
}

interface IOverviewSectionLecture {
    _id: string;
    videoTitle: string;
    videoDescription: string;
    videoLength: number;
}

interface IOverviewCourseSection {
    _id: string;
    sectionTitle: string;
    sectionContents: IOverviewSectionLecture[];
}

interface ICourseData {
    _id: string;
    name: string;
    overview: string;
    description: string;
    categories: IOverviewCategory[];
    price: number;
    estimatedPrice: number;
    thumbnail: IOverviewMedia;
    tags: string;
    level: string;
    videoDemo: IOverviewMedia;
    benefits: IOverviewBenefit[];
    prerequisites: IOverviewPrerequisite[];
    totalSections: number;
    totalLectures: number;
    totalTime: number;
    reviews: any[];
    courseData: IOverviewCourseSection[];
    ratings: number;
    purchased: number;
    creatorId: IOverviewCreator;
    createdAt: string;
    updatedAt: string;
}

interface IProcessedSection {
    sectionTitle: string;
    totalLectures: number;
    totalTime: string;
    lectures: {
        title: string;
        description: string;
        time: string;
    }[];
}

const CourseOverview = ({ courseId }: { courseId: string }) => {

    const router = useRouter();
    const searchParams = useSearchParams();
    const focusReviewId = searchParams?.get("focusReview") || undefined;

    const dispatch = useDispatch();
    const { currentUser } = useSelector((state: RootState) => state.user);
    const { loading } = useSelector((state: RootState) => state.cart);

    const [courseData, setCourseData] = useState<ICourseData | null>(null);
    const [sections, setSections] = useState<IProcessedSection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeSections, setActiveSections] = useState<number[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loadingEnroll, setLoadingEnroll] = useState(false);
    const [isAllowed, setIsAllowed] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);
    const [isCreator, setIsCreator] = useState(false);

    const handleFetchCourseOverview = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/overview/${courseId}`, {
                method: 'GET',
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) {
                console.log("Fetching course data failed: ", data.message);
                return;
            }

            const course = data?.course;

            setCourseData(course);
            setReviews(course.reviews || []);

            // Process sections data
            const processedSections: IProcessedSection[] = course?.courseData?.map((section: IOverviewCourseSection) => ({
                sectionTitle: section.sectionTitle,
                totalLectures: section.sectionContents.length,
                totalTime: formatDuration(section.sectionContents.reduce((acc, content) => acc + content.videoLength, 0)),
                lectures: section.sectionContents.map(content => ({
                    title: content.videoTitle,
                    description: content.videoDescription,
                    time: formatDuration(content.videoLength)
                }))
            })) || [];

            setSections(processedSections);

        } catch (error: any) {
            console.log(error.message);
        } finally {
            setIsLoading(false);
        }
    }, [courseId]);

    const handleCheckPurchasedCourses = useCallback(async () => {
        if (!currentUser) {
            setIsAllowed(false);
            return;
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/${courseId}/has-purchased`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) {
                console.log("Fetching purchased courses failed: ", data.message);
                return;
            }

            setIsAllowed(data.hasPurchased);
        } catch (error: any) {
            console.log(error.message);
        }
    }, [currentUser, courseId]);

    useEffect(() => {
        handleFetchCourseOverview();
        handleCheckPurchasedCourses();
    }, [courseId, handleFetchCourseOverview, handleCheckPurchasedCourses]);

    useEffect(() => {
        if (currentUser && courseData) {
            setIsCreator(currentUser._id === courseData.creatorId._id);
        }
    }, [currentUser, courseData]);

    const toggleSection = (index: number) => {
        setActiveSections(prevSections =>
            prevSections.includes(index)
                ? prevSections.filter(i => i !== index)
                : [...prevSections, index]
        );
    };

    const handleEnroll = (courseId: string) => {
        setLoadingEnroll(true);
        router.push(`/course-enroll/${courseId}`)
    }

    const getCategoriesString = (categories: IOverviewCategory[]) => {
        return categories?.map(cat => cat.title).join(', ') || '';
    }

    if (isLoading) {
        return <Loader />;
    }

    if (!courseData) {
        return <div>Course not found</div>;
    }

    const handleAddToCart = async () => {

        if (!currentUser) {
            toast("Please login to add the course");
            router.push(`/login?callbackUrl=/course-overview/${courseId}`);
            return;
        }

        try {
            dispatch(addItemToCartStart());
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/cart/add/${courseId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) {
                dispatch(addItemToCartFailure(data.message || "Failed to add item to cart"));
                toast.error(data.message || "Failed to add item to cart");
                return;
            }
            dispatch(addItemToCartSuccess(data.cart));
            toast.success("Course added to cart");
        } catch (error: any) {
            dispatch(addItemToCartFailure(error.message || "Failed to add item to cart"));
            toast.error(error.message || "Failed to add item to cart");
        }
    }

    return (
        <div className='theme-mode min-h-screen'>
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:bg-gradient-to-br dark:from-blue-950 dark:via-blue-900  dark:to-blue-950 overflow-x-clip">
                <div className="container">
                    <div className="flex flex-col md:flex-row gap-8 py-4 md:gap-12 relative">
                        {/* Course Basic Information */}
                        <div className="md:w-1/2 flex flex-col justify-center">
                            {/* Course Title */}
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-slate-800 dark:text-white leading-tight">
                                {courseData.name}
                            </h1>

                            {/* Course Category Badge - Moved below title */}
                            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-600/30 text-blue-800 dark:text-blue-100 text-sm font-medium mb-4 self-start border border-blue-200 dark:border-blue-400/40">
                                <BiCategoryAlt className="mr-2 w-6 md:w-4 h-6 md:h-4" />
                                {getCategoriesString(courseData.categories)}
                            </div>

                            {/* Course Overview */}
                            <p className="text-lg mb-6 text-slate-600 dark:text-slate-300 leading-relaxed">
                                {courseData.overview}
                            </p>

                            {/* Reviews and Rating */}
                            <div className="flex flex-wrap items-center mb-6">
                                <div className="flex items-center">
                                    <div className="flex mr-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star key={star} size={18} className="text-yellow-400 fill-yellow-400" />
                                        ))}
                                    </div>
                                    <span className="text-slate-800 dark:text-white font-medium">
                                        {courseData.ratings}
                                    </span>
                                    <span className="mx-2 text-slate-400 dark:text-slate-400">•</span>
                                    <span className="text-slate-700 dark:text-slate-300">
                                        ({courseData.reviews.length} reviews)
                                    </span>
                                </div>
                                <div className="flex items-center ml-auto md:ml-4 text-slate-600 dark:text-slate-300 text-sm mt-2 md:mt-0">
                                    <User size={16} className="mr-1" />
                                    <span>{courseData.purchased} students enrolled</span>
                                </div>
                            </div>

                            {/* Course Stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                                <div className="flex items-center gap-2 bg-white/80 dark:bg-blue-800/40 text-slate-700 dark:text-blue-50 px-3 py-2 rounded-lg shadow-sm border border-blue-200 dark:border-blue-400/40 backdrop-blur-sm">
                                    <Award size={18} className="text-blue-600 dark:text-blue-300" />
                                    <span>{courseData.level}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/80 dark:bg-blue-800/40 text-slate-700 dark:text-blue-50 px-3 py-2 rounded-lg shadow-sm border border-blue-200 dark:border-blue-400/40 backdrop-blur-sm">
                                    <Clock size={18} className="text-blue-600 dark:text-blue-300" />
                                    <span>{formatDuration(courseData.totalTime)}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/80 dark:bg-blue-800/40 text-slate-700 dark:text-blue-50 px-3 py-2 rounded-lg shadow-sm border border-blue-200 dark:border-blue-400/40 backdrop-blur-sm">
                                    <BookOpen size={18} className="text-blue-600 dark:text-blue-300" />
                                    <span>{courseData.totalLectures} lectures</span>
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="flex items-center gap-2 mb-6 flex-wrap">
                                {courseData.tags?.split(',').map((tag: string, index: number) => (
                                    <div key={index} className="text-xs px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-600/30 text-indigo-800 dark:text-indigo-100 border border-indigo-200 dark:border-indigo-400/40 cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-500/40 transition-colors">
                                        {tag.trim()}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Course Thumbnail with Play Button */}
                        <div className="md:w-1/2 md:my-[20px]">
                            <div className="rounded-2xl overflow-hidden shadow-2xl relative group transition-all hover:shadow-blue-200/50 dark:hover:shadow-blue-400/30 border border-white/50 dark:border-blue-400/30 backdrop-blur-sm">
                                <div className="aspect-video relative">
                                    {isPlaying && courseData.videoDemo ? (
                                        <video
                                            src={courseData.videoDemo.url}
                                            controls
                                            autoPlay
                                            className="w-full h-full rounded-2xl object-cover"
                                        />
                                    ) : (
                                        <>
                                            <Image
                                                src={getValidThumbnail(courseData.thumbnail?.url)}
                                                alt={courseData.name || "Course Image"}
                                                fill
                                                sizes="(max-width: 768px) 100vw, 50vw"
                                                style={{ objectFit: "cover" }}
                                                priority
                                                className="group-hover:scale-105 transition-transform duration-500"
                                                quality={100}
                                            />

                                            {/* Play button if demo available */}
                                            {courseData.videoDemo && (
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
                                                <BsCameraVideo className='' />
                                                <p className=''>Preview</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container">
                <div className="flex flex-col md:flex-row gap-8 md:mt-12">
                    <div className="md:w-8/12">
                        {/* What You'll Learn */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">What You'll Learn</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {courseData.benefits.map((benefit, index) => (
                                    <div key={index} className="flex items-start gap-3 group">
                                        <CheckCircle className="text-green-500 dark:text-green-400 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" size={20} />
                                        <span className="text-gray-700 dark:text-gray-200">{benefit.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Course Content */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Course Content</h2>
                            <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-300 mb-6">
                                <span>{courseData.totalSections} sections</span>
                                <span>•</span>
                                <span>{courseData.totalLectures} lectures</span>
                                <span>•</span>
                                <span>{formatDuration(courseData.totalTime)} total length</span>
                            </div>

                            {sections.map((section, sIndex) => (
                                <div key={sIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg mb-4 overflow-hidden hover:shadow-md transition-shadow duration-300">
                                    <div
                                        className="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                        onClick={() => toggleSection(sIndex)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`transition-transform duration-300 ${activeSections.includes(sIndex) ? 'rotate-90' : ''}`}>
                                                <Play size={16} className="text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <h3 className="font-medium text-gray-800 dark:text-white">{section.sectionTitle}</h3>
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                            {section.totalLectures} lectures • {section.totalTime}
                                        </div>
                                    </div>

                                    {activeSections.includes(sIndex) && (
                                        <div className="p-2 bg-white dark:bg-slate-600">
                                            {section.lectures.map((lecture, lIndex: number) => (
                                                <div key={lIndex} className="flex justify-between items-center gap-2 py-3 px-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center h-6">
                                                            <Play size={14} className="text-gray-400 dark:text-gray-500" />
                                                        </div>
                                                        <div className='flex flex-col gap-2'>
                                                            <span className="text-gray-700 dark:text-gray-200">{lecture.title}</span>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">{lecture.description}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{lecture.time}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Requirements */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Requirements</h2>
                            <ul className="space-y-4">
                                {courseData.prerequisites.map((prerequisite, index) => (
                                    <li key={index} className="flex items-start gap-3 group">
                                        <div className="mt-1 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                            <CheckCircle size={20} />
                                        </div>
                                        <span className="text-gray-700 dark:text-gray-200">{prerequisite.title}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Description */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Description</h2>
                            <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
                                {courseData.description || "No description provided"}
                            </p>
                        </div>

                        {/* Instructor Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Meet Your Instructor</h2>

                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="md:w-1/4 flex flex-col items-center md:items-start">
                                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-100 dark:border-blue-900 shadow-md mb-3">
                                        {courseData.creatorId?.avatar?.url && isValidImageUrl(courseData.creatorId.avatar.url) ? (
                                            <Image
                                                src={courseData.creatorId.avatar.url}
                                                alt={courseData.creatorId.name || "Instructor"}
                                                fill
                                                sizes="128px"
                                                style={{ objectFit: "cover" }}
                                                className="rounded-full"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
                                                <User size={48} className="text-indigo-600 dark:text-indigo-300" />
                                            </div>
                                        )}
                                    </div>
                                    <h4 className="text-md text-indigo-600 dark:text-indigo-400 mb-4">Course Instructor</h4>
                                </div>

                                <div className="md:w-3/4">
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{courseData.creatorId?.name || "Instructor Name"}</h3>

                                    <div className="prose prose-sm dark:prose-invert mb-4">
                                        <p className="text-gray-700 dark:text-gray-300">
                                            {courseData.creatorId?.bio ||
                                                "An experienced instructor with a passion for teaching and helping students achieve their learning goals. Specializing in creating comprehensive and engaging educational content that makes complex topics accessible to learners of all levels."}
                                        </p>
                                    </div>

                                    <div className="flex gap-3 mt-4">
                                        <button
                                            onClick={() => router.push(`/tutor-overview/${courseData.creatorId._id}`)}
                                            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                                        >
                                            <Globe size={16} className="mr-2" />
                                            View Profile
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="md:w-4/12">
                        {/* Sticky Course Features */}
                        <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">Course Features</h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <Users className="text-blue-600 dark:text-blue-400" size={18} />
                                        <span className="text-gray-700 dark:text-gray-200">Skill Level</span>
                                    </div>
                                    <span className="font-medium text-gray-800 dark:text-white">{courseData.level}</span>
                                </div>

                                <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <BookOpen className="text-blue-600 dark:text-blue-400" size={18} />
                                        <span className="text-gray-700 dark:text-gray-200">Lectures</span>
                                    </div>
                                    <span className="font-medium text-gray-800 dark:text-white">{courseData.totalLectures}</span>
                                </div>

                                <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <Clock className="text-blue-600 dark:text-blue-400" size={18} />
                                        <span className="text-gray-700 dark:text-gray-200">Duration</span>
                                    </div>
                                    <span className="font-medium text-gray-800 dark:text-white">{formatDuration(courseData.totalTime)}</span>
                                </div>
                            </div>

                            <button
                                className={`w-full bg-blue-500 dark:bg-blue-700 hover:opacity-75 cursor-pointer text-white font-bold py-3 px-4 rounded-lg transition-all mt-6 shadow-md hover:shadow-lg transform hover:-translate-y-0.5
        ${loadingEnroll || isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
                                onClick={isAllowed ? () => handleEnroll(courseId) : handleAddToCart}
                                disabled={loadingEnroll || isLoading}
                            >
                                {isAllowed
                                    ? (loadingEnroll ? "Enrolling..." : "Enter to course")
                                    : (loading ? "Adding..." : "Add to cart")}
                            </button>

                            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-100 dark:border-yellow-900/50">
                                <div className="flex gap-2 items-center text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                                    <Star size={18} className="fill-yellow-500" />
                                    <span>Limited time offer</span>
                                </div>
                                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                    This course is currently discounted! Enroll now to secure this special price.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <div className='container'>
                <CourseReview
                    isCreator={isCreator}
                    courseId={courseId}
                    focusReviewId={focusReviewId}
                />
            </div>

            <div className='container'>
                <RelatedCourse
                    courseId={courseId}
                    categories={courseData.categories}
                />
            </div>

            <div className="relative bg-[radial-gradient(ellipse_200%_100%_at_bottom_left,#183EC2,#EAEEFE_100%)] dark:bg-[radial-gradient(ellipse_200%_100%_at_bottom_left,#0A1D56,#0D1B2A_100%)] overflow-x-clip">
                <div className="container">
                    <CallToActionCourse />
                </div>
            </div>
        </div>
    )
}

export default CourseOverview