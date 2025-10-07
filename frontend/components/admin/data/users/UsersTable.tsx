"use client"

import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Image from 'next/image';
import { Calendar, CheckCircle, XCircle, User, Ellipsis } from 'lucide-react';
import { HiOutlineUsers } from "react-icons/hi";
import { isValidImageUrl } from '@/utils/handleImage';
import UsersActions from './UsersActions';

interface IMedia {
    public_id?: string;
    url: string;
}

interface ISocial {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
}

interface IUserResponse {
    _id: string;
    name: string;
    email: string;
    role: string;
    isVerified: boolean;
    isSurveyCompleted: boolean;
    avatar: IMedia;
    socials: ISocial;
    createdAt: string;
    updatedAt: string;
}

interface UsersTableProps {
    users: IUserResponse[];
    onDelete: (user: IUserResponse) => void;
    isLoading?: boolean;
}

const UsersTable = ({
    users,
    onDelete,
    isLoading = false
}: UsersTableProps) => {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };



    // Display skeleton when isLoading is true
    if (isLoading) {
        return (
            <div className="w-full">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Verified</TableHead>
                                <TableHead>Survey</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="w-16">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(5)].map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <div className="flex items-center space-x-3">
                                            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                                            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    }

    if (!users || users.length === 0) {
        return (
            <div className="w-full">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Verified</TableHead>
                                <TableHead>Survey</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="w-16">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    <div className="flex flex-col items-center space-y-2">
                                        <div className="text-gray-400 dark:text-gray-600">
                                            <HiOutlineUsers className="h-12 w-12" />
                                        </div>
                                        <p className="text-gray-500 dark:text-gray-400">No users found</p>
                                        <p className="text-sm text-gray-400 dark:text-gray-600">Try adjusting your search criteria</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className='border-r'>User</TableHead>
                            <TableHead className='border-r'>Email</TableHead>
                            <TableHead className='border-r text-center'>Role</TableHead>
                            <TableHead className='border-r text-center'>Verified</TableHead>
                            <TableHead className='border-r text-center'>Survey</TableHead>
                            <TableHead className='border-r'>Joined</TableHead>
                            <TableHead className="w-16 text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user._id}>
                                {/* avatar + name */}
                                <TableCell className='border-r'>
                                    <div className="flex items-center space-x-3">
                                        <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                                            {user.avatar?.url && isValidImageUrl(user.avatar.url) ? (
                                                <Image
                                                    src={user.avatar.url}
                                                    alt={user.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="40px"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center">
                                                    <User className="h-5 w-5 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm text-gray-900 dark:text-white" title={user.name}>
                                                {user.name}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>
                                {/* mail */}
                                <TableCell className='border-r'>
                                    <div className="max-w-[200px]">
                                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate" title={user.email}>
                                            {user.email}
                                        </p>
                                    </div>
                                </TableCell>
                                {/* role */}
                                <TableCell className='border-r text-center'>
                                    <span className='text-sm'>
                                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                    </span>
                                </TableCell>
                                {/* verification status */}
                                <TableCell className='border-r'>
                                    <div className="flex justify-center items-center">
                                        {user.isVerified ? (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-500" />
                                        )}
                                    </div>
                                </TableCell>
                                {/* survey status */}
                                <TableCell className='border-r'>
                                    <div className="flex justify-center items-center">
                                        {user.isSurveyCompleted ? (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-500" />
                                        )}
                                    </div>
                                </TableCell>
                                {/* createdAt */}
                                <TableCell className='border-r'>
                                    <div className="flex items-center space-x-1">
                                        <span className="text-sm text-gray-600 dark:text-gray-300">
                                            {formatDate(user.createdAt)}
                                        </span>
                                    </div>
                                </TableCell>
                                {/* actions */}
                                <TableCell>
                                    <div className='w-full h-full flex justify-center items-center'>
                                        <UsersActions user={user} onDelete={onDelete} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default UsersTable;