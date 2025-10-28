"use client"

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import {
    User,
    Mail,
    Calendar,
    CheckCircle,
    XCircle,
    BookOpen,
    Users,
    Star,
    DollarSign,
    Facebook,
    Instagram,
    ExternalLink,
    X
} from 'lucide-react';
import { FaTiktok } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { isValidImageUrl } from '@/utils/handleImage';

interface IMedia {
    public_id?: string;
    url: string;
}

interface ISocial {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
}

interface BaseUser {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'tutor' | 'student';
    isVerified: boolean;
    isSurveyCompleted: boolean;
    avatar: IMedia;
    socials: ISocial;
    createdAt: string;
    updatedAt: string;
}

interface AdminUser extends BaseUser {
    role: 'admin';
}

interface TutorUser extends BaseUser {
    role: 'tutor';
    tutorProfile: string;
    totalStudents: number;
    totalCourses: number;
    totalReviews: number;
    averageRating: number;
}

interface StudentUser extends BaseUser {
    role: 'student';
    studentProfile: string;
    enrolledCoursesCount: number;
    totalSpent: number;
}

type UserDetail = AdminUser | TutorUser | StudentUser;

interface UserDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string | null;
}

const UserDetailModal = ({ isOpen, onClose, userId }: UserDetailModalProps) => {
    const [user, setUser] = useState<UserDetail | null>(null);
    const [loading, setLoading] = useState(false);

    const handleEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    const handleModalClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const fetchUserDetail = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/admin/get_user_detail/${userId}`,
                {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    credentials: 'include',
                }
            );

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Failed to fetch user details");
                return;
            }

            setUser(data.user);
        } catch (error: any) {
            toast.error("Error fetching user details");
            console.error("Get user detail error:", error?.message || error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';

            if (userId) {
                fetchUserDetail();
            }
        } else {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'auto';
            setUser(null);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, userId, handleEscape, fetchUserDetail]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const renderSocialLinks = (socials: ISocial) => {
        const socialLinks = [
            { name: 'Facebook', url: socials.facebook, icon: Facebook },
            { name: 'Instagram', url: socials.instagram, icon: Instagram },
            { name: 'TikTok', url: socials.tiktok, icon: FaTiktok },
        ];

        const activeSocials = socialLinks.filter(social => social.url);

        if (activeSocials.length === 0) {
            return <p className="text-sm text-gray-500 dark:text-gray-400">No social links</p>;
        }

        return (
            <div className="flex flex-wrap gap-2">
                {activeSocials.map((social) => (
                    <a
                        key={social.name}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors text-sm"
                    >
                        <social.icon className="h-4 w-4" />
                        <span>{social.name}</span>
                        <ExternalLink className="h-3 w-3" />
                    </a>
                ))}
            </div>
        );
    };

    const renderRoleSpecificInfo = () => {
        if (!user) return null;

        if (user.role === 'tutor') {
            return (
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Total Students</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {user.totalStudents}
                        </p>
                    </div>

                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Total Courses</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {user.totalCourses}
                        </p>
                    </div>

                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <Star className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Average Rating</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {user.averageRating > 0 ? user.averageRating.toFixed(1) : 'N/A'}
                        </p>
                    </div>

                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <Star className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Total Reviews</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {user.totalReviews}
                        </p>
                    </div>
                </div>
            );
        }

        if (user.role === 'student') {
            return (
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Enrolled Courses</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {user.enrolledCoursesCount}
                        </p>
                    </div>

                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Total Spent</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            ${user.totalSpent.toFixed(2)}
                        </p>
                    </div>
                </div>
            );
        }

        return null;
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={handleModalClick}
        >
            <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Details</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="space-y-6">
                            <div className="flex items-center space-x-4">
                                <div className="h-24 w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                                <div className="flex-1 space-y-3">
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                ))}
                            </div>
                        </div>
                    ) : user ? (
                        <div className="space-y-6">
                            {/* Avatar and Basic Info */}
                            <div className="flex items-start space-x-4">
                                <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                                    {user.avatar?.url && isValidImageUrl(user.avatar.url) ? (
                                        <Image
                                            src={user.avatar.url}
                                            alt={user.name}
                                            fill
                                            className="object-cover"
                                            sizes="96px"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center">
                                            <User className="h-12 w-12 text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {user.name}
                                    </h3>
                                    <div className="mt-2 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-gray-500" />
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {user.email}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                {user.role.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Status Information */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Verified</span>
                                    <div className="flex items-center gap-2">
                                        {user.isVerified ? (
                                            <>
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                                <span className="text-sm font-medium text-green-600 dark:text-green-400">Yes</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="h-5 w-5 text-red-500" />
                                                <span className="text-sm font-medium text-red-600 dark:text-red-400">No</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Survey Completed</span>
                                    <div className="flex items-center gap-2">
                                        {user.isSurveyCompleted ? (
                                            <>
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                                <span className="text-sm font-medium text-green-600 dark:text-green-400">Yes</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="h-5 w-5 text-red-500" />
                                                <span className="text-sm font-medium text-red-600 dark:text-red-400">No</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Role Specific Information */}
                            {renderRoleSpecificInfo()}

                            {/* Social Links */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    Social Links
                                </h4>
                                {renderSocialLinks(user.socials)}
                            </div>

                            {/* Dates */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Joined
                                    </span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {formatDate(user.createdAt)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Last Updated
                                    </span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {formatDate(user.updatedAt)}
                                    </span>
                                </div>
                            </div>

                            {/* User ID */}
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                <span className="text-xs text-gray-500 dark:text-gray-400">User ID</span>
                                <p className="text-sm font-mono text-gray-700 dark:text-gray-300 mt-1 break-all">
                                    {user._id}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                            No user data available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDetailModal;