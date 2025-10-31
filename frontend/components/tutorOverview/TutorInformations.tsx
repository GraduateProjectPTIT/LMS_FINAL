"use client";

import React from 'react';
import Image from 'next/image';
import { User, Users, BookOpen, Star, Award, Facebook, Instagram, Video } from 'lucide-react';
import { isValidImageUrl } from "@/utils/handleImage";

interface ITutorInformation {
    name: string;
    avatar: {
        url: string;
    };
    bio?: string;
    socials: {
        facebook?: string;
        instagram?: string;
        tiktok?: string;
    };
    totalStudents: number;
    totalCourses: number;
    totalReviews: number;
    averageRating: number;
}

interface ITutorInformationsProps {
    tutorData: ITutorInformation | null;
    loading: boolean;
}

const TutorInformations = ({ tutorData, loading }: ITutorInformationsProps) => {
    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <div className="animate-pulse">
                    <div className="w-32 h-32 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>
                    <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
                        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
                        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!tutorData) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <p className="text-center text-gray-600 dark:text-gray-400">No tutor information available</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-100 dark:border-blue-900 shadow-md mb-4">
                    {tutorData.avatar?.url && isValidImageUrl(tutorData.avatar.url) ? (
                        <Image
                            src={tutorData.avatar.url}
                            alt={tutorData.name}
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

                {/* Name */}
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 text-center">
                    {tutorData.name}
                </h2>

                {/* Bio/Tagline */}
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                    {tutorData.bio || "Passionate educator dedicated to student success."}
                </p>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                size={16}
                                className={`${star <= Math.floor(tutorData.averageRating)
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300 dark:text-gray-600'
                                    }`}
                            />
                        ))}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {tutorData.averageRating.toFixed(1)}
                    </span>
                </div>
            </div>

            {/* Stats */}
            <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <Users className="text-indigo-600 dark:text-indigo-400" size={20} />
                        <span className="text-gray-700 dark:text-gray-200">Students</span>
                    </div>
                    <span className="font-semibold text-gray-800 dark:text-white">
                        {tutorData.totalStudents}
                    </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <BookOpen className="text-indigo-600 dark:text-indigo-400" size={20} />
                        <span className="text-gray-700 dark:text-gray-200">Courses</span>
                    </div>
                    <span className="font-semibold text-gray-800 dark:text-white">
                        {tutorData.totalCourses}
                    </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <Star className="text-indigo-600 dark:text-indigo-400" size={20} />
                        <span className="text-gray-700 dark:text-gray-200">Reviews</span>
                    </div>
                    <span className="font-semibold text-gray-800 dark:text-white">
                        {tutorData.totalReviews}
                    </span>
                </div>

                <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                        <Award className="text-indigo-600 dark:text-indigo-400" size={20} />
                        <span className="text-gray-700 dark:text-gray-200">Member Since</span>
                    </div>
                    <span className="font-semibold text-gray-800 dark:text-white">
                        6 years
                    </span>
                </div>
            </div>

            {/* Social Links */}
            {(tutorData.socials?.facebook || tutorData.socials?.instagram || tutorData.socials?.tiktok) && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Connect
                    </h3>
                    <div className="flex gap-3">
                        {tutorData.socials?.facebook && (
                            <a
                                href={tutorData.socials.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                            >
                                <Facebook size={20} />
                            </a>
                        )}
                        {tutorData.socials?.instagram && (
                            <a
                                href={tutorData.socials.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors"
                            >
                                <Instagram size={20} />
                            </a>
                        )}
                        {tutorData.socials?.tiktok && (
                            <a
                                href={tutorData.socials.tiktok}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                <Video size={20} />
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TutorInformations;