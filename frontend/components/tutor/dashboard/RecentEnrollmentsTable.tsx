import React from "react";
import { Calendar, UserPlus, User } from "lucide-react";
import { isValidImageUrl } from '@/utils/handleImage';
import Image from "next/image";

interface IAvatar {
    public_id?: string;
    url: string;
}

interface IEnrolledUser {
    avatar: IAvatar;
    _id: string;
    name: string;
    email: string;
}

interface IRecentEnrollment {
    _id: string;
    userId: IEnrolledUser;
    courseId: string;
    enrolledAt: string;
}

interface RecentEnrollmentsTableProps {
    enrollments: IRecentEnrollment[];
}

const RecentEnrollmentsTable = ({ enrollments }: RecentEnrollmentsTableProps) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInMins = Math.floor(diffInMs / 60000);
        const diffInHours = Math.floor(diffInMins / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInMins < 60) {
            return `${diffInMins} minute${diffInMins !== 1 ? 's' : ''} ago`;
        } else if (diffInHours < 24) {
            return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
        } else if (diffInDays < 7) {
            return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
        } else {
            return formatDate(dateString);
        }
    };

    return (
        <div className="theme-mode rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Recent Enrollments
                    </h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Latest students who enrolled in your courses
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Student
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Enrollment Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Time
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {enrollments.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                    <div className="flex flex-col items-center justify-center">
                                        <UserPlus className="w-12 h-12 mb-3 opacity-50" />
                                        <p>No recent enrollments found</p>
                                        <p className="text-sm mt-1">Students will appear here once they enroll in your courses</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            enrollments.map((enrollment) => (
                                <tr key={enrollment._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {
                                                enrollment.userId.avatar?.url && isValidImageUrl(enrollment.userId.avatar.url) ? (
                                                    <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                                                        <Image
                                                            src={enrollment.userId.avatar.url}
                                                            alt={enrollment.userId.name}
                                                            fill
                                                            className="object-cover"
                                                            sizes="40px"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                        <User className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                )
                                            }
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {enrollment.userId.name}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            {enrollment.userId.email}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                            <Calendar className="w-4 h-4 mr-1.5" />
                                            {formatDate(enrollment.enrolledAt)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                            {getTimeAgo(enrollment.enrolledAt)}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div >
    );
};

export default RecentEnrollmentsTable;