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
    TrendingUp,
    Award,
    X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { isValidImageUrl } from '@/utils/handleImage';

interface IEnrollmentDetails {
    _id: string;
    enrolledAt: string;
    progress: number;
    completedLectures: number;
    totalLecturesInCourse: number;
    isCompleted: boolean;
}

interface IAvatar {
    url: string;
}

interface IStudent {
    _id: string;
    name: string;
    email: string;
    avatar: IAvatar;
    enrollmentDetails: IEnrollmentDetails;
}

interface IStudentDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: string;
    selectedStudentId: string | null;
}

const StudentDetailModal = ({
    isOpen,
    onClose,
    courseId,
    selectedStudentId
}: IStudentDetailModalProps) => {
    const [student, setStudent] = useState<IStudent | null>(null);
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

    const fetchStudentDetails = useCallback(async () => {
        if (!selectedStudentId) return;

        setLoading(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/courses/${courseId}/students/${selectedStudentId}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: 'include',
                }
            );

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Failed to fetch student details");
                return;
            }

            setStudent(data.student);
        } catch (error: any) {
            toast.error("Error fetching student details");
            console.error("Get student detail error:", error?.message || error);
        } finally {
            setLoading(false);
        }
    }, [courseId, selectedStudentId]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';

            if (selectedStudentId) {
                fetchStudentDetails();
            }
        } else {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'auto';
            setStudent(null);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, selectedStudentId, handleEscape, fetchStudentDetails]);



    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getProgressColor = (progress: number) => {
        if (progress === 100) return 'bg-green-500';
        if (progress >= 75) return 'bg-blue-500';
        if (progress >= 50) return 'bg-yellow-500';
        if (progress >= 25) return 'bg-orange-500';
        return 'bg-red-500';
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
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Student Details</h2>
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
                    ) : student ? (
                        <div className="space-y-6">
                            {/* Avatar and Basic Info */}
                            <div className="flex items-start space-x-4">
                                <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                                    {student.avatar?.url && isValidImageUrl(student.avatar.url) ? (
                                        <Image
                                            src={student.avatar.url}
                                            alt={student.name}
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
                                        {student.name}
                                    </h3>
                                    <div className="mt-2 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-gray-500" />
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {student.email}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Course Progress */}
                            <div className="bg-gray-100 dark:bg-gray-800 p-5 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Course Progress
                                    </h4>
                                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {student.enrollmentDetails.progress}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                    <div
                                        className={`h-full ${getProgressColor(student.enrollmentDetails.progress)} transition-all duration-500 rounded-full`}
                                        style={{ width: `${student.enrollmentDetails.progress}%` }}
                                    />
                                </div>
                            </div>

                            {/* Enrollment Statistics */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Completed Lectures</span>
                                    </div>
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {student.enrollmentDetails.completedLectures}
                                    </p>
                                </div>

                                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Total Lectures</span>
                                    </div>
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {student.enrollmentDetails.totalLecturesInCourse}
                                    </p>
                                </div>
                            </div>

                            {/* Completion Status */}
                            <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                    <Award className="h-5 w-5" />
                                    Course Status
                                </span>
                                <div className="flex items-center gap-2">
                                    {student.enrollmentDetails.isCompleted ? (
                                        <>
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                                Completed
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="h-5 w-5 text-orange-500" />
                                            <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                                                In Progress
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Enrollment Date */}
                            <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Enrolled On
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {formatDate(student.enrollmentDetails.enrolledAt)}
                                </span>
                            </div>

                            {/* Student ID */}
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Student ID</span>
                                <p className="text-sm font-mono text-gray-700 dark:text-gray-300 mt-1 break-all">
                                    {student._id}
                                </p>
                            </div>

                            {/* Enrollment ID */}
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Enrollment ID</span>
                                <p className="text-sm font-mono text-gray-700 dark:text-gray-300 mt-1 break-all">
                                    {student.enrollmentDetails._id}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                            No student data available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentDetailModal;