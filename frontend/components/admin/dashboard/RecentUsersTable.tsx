import React from "react";
import { Calendar, User } from "lucide-react";
import { isValidImageUrl } from '@/utils/handleImage';
import Image from "next/image";

interface IAvatar {
    public_id?: string;
    url: string;
}

interface IRecentUser {
    _id: string;
    name: string;
    email: string;
    role: string;
    avatar: IAvatar;
    createdAt: string;
}

interface RecentUsersTableProps {
    users: IRecentUser[];
}

const RecentUsersTable = ({ users }: RecentUsersTableProps) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        }).format(date);
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role.toLowerCase()) {
            case 'tutor':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            case 'student':
                return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'admin':
                return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    return (
        <div className="theme-mode rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recent Users
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Latest registered users on the platform
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Joined
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                    No recent users found
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {
                                                user.avatar?.url && isValidImageUrl(user.avatar.url) ? (
                                                    <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                                                        <Image
                                                            src={user.avatar.url}
                                                            alt={user.name}
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
                                                    {user.name}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            {user.email}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                            <Calendar className="w-4 h-4 mr-1.5" />
                                            {formatDate(user.createdAt)}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecentUsersTable;