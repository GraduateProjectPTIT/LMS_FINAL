"use client"

import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getFieldStatus, getFieldBorderClass, getFieldIcon } from "@/utils/formFieldHelpers";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { FaEye, FaEyeSlash, FaEdit } from 'react-icons/fa';
import { IoAlertCircleOutline } from "react-icons/io5";
import toast from 'react-hot-toast';

const passwordChangeSchema = z
    .object({
        oldPassword: z.string().min(1, "Current password is required").min(6, "Password must be at least 6 characters"),
        newPassword: z.string().min(6, "New password must be at least 6 characters"),
        confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters")
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    })
    .refine((data) => data.oldPassword !== data.newPassword, {
        message: "New password must be different from current password",
        path: ["newPassword"],
    });

type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>

interface AuthenticationProps {
    user: any;
}

const Authentication = ({ user }: AuthenticationProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswords, setShowPasswords] = useState({
        oldPassword: false,
        newPassword: false,
        confirmPassword: false
    });

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: {
            isSubmitting,
            errors,
            touchedFields
        }
    } = useForm<PasswordChangeFormValues>({
        resolver: zodResolver(passwordChangeSchema),
        mode: "onChange"
    });

    const watchedFields = watch();

    const togglePasswordVisibility = (field: string) => {
        setShowPasswords({
            ...showPasswords,
            [field]: !showPasswords[field as keyof typeof showPasswords]
        });
    }

    const startEditing = () => {
        setIsEditing(true);
    }

    const cancelEditing = () => {
        setIsEditing(false);
        reset();
    }

    const onSubmit = async (data: PasswordChangeFormValues) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/user/update_password`, {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    oldPassword: data.oldPassword,
                    newPassword: data.newPassword
                }),
                credentials: 'include',
            });
            const responseData = await res.json();
            if (!res.ok) {
                toast.error(responseData.message);
                return;
            } else {
                setIsEditing(false);
                toast.success("Password updated successfully!");
                reset();
            }
        } catch (error: any) {
            console.log(error.message);
            toast.error("Something went wrong. Please try again.");
        }
    }

    const field = (name: keyof PasswordChangeFormValues) => {
        const status = getFieldStatus(name, touchedFields, errors, watchedFields);
        return {
            border: getFieldBorderClass(status),
            icon: getFieldIcon(status),
        };
    };

    return (
        <Card className="w-full theme-mode border-gray-200 dark:border-slate-600 shadow-md dark:shadow-slate-600">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl font-bold">Security Settings</CardTitle>
                </div>
                <CardDescription>Manage your email and password settings</CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Email Address</h3>

                        <div className="p-4 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex items-center justify-between">
                            <div>
                                <p className="font-medium">{user?.email || "john.doe@example.com"}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Primary email</p>
                            </div>
                            {
                                user?.isVerified ? (
                                    <Badge className="bg-green-500">Verified</Badge>
                                ) : (
                                    <Badge className="bg-red-500">Unverified</Badge>
                                )
                            }
                        </div>
                    </div>

                    <Separator className="my-4 border" />

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Password</h3>
                            {!isEditing && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={startEditing}
                                    className='flex items-center gap-2 hover:cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900/70'
                                >
                                    <FaEdit size={16} /> Change Password
                                </Button>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="space-y-4">
                                {/* Current Password Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="oldPassword">Current Password</Label>
                                    <div className="relative">
                                        <Input
                                            {...register("oldPassword")}
                                            id="oldPassword"
                                            type={showPasswords.oldPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            className={`${field('oldPassword').border} pr-16`}
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-3">
                                            {field('oldPassword').icon}
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('oldPassword')}
                                                className="text-gray-500 dark:text-gray-400"
                                            >
                                                {showPasswords.oldPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    {errors.oldPassword && watchedFields.oldPassword && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <IoAlertCircleOutline className="text-red-400 text-sm" />
                                            <p className="text-red-400 text-[12px]">{errors.oldPassword.message}</p>
                                        </div>
                                    )}
                                </div>

                                {/* New Password Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            {...register("newPassword")}
                                            id="newPassword"
                                            type={showPasswords.newPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            className={`${field('newPassword').border} pr-16`}
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-3">
                                            {field('newPassword').icon}
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('newPassword')}
                                                className="text-gray-500 dark:text-gray-400"
                                            >
                                                {showPasswords.newPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    {errors.newPassword && watchedFields.newPassword && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <IoAlertCircleOutline className="text-red-400 text-sm" />
                                            <p className="text-red-400 text-[12px]">{errors.newPassword.message}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm New Password Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <div className="relative">
                                        <Input
                                            {...register("confirmPassword")}
                                            id="confirmPassword"
                                            type={showPasswords.confirmPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            className={`${field('confirmPassword').border} pr-16`}
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-3">
                                            {field('confirmPassword').icon}
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility('confirmPassword')}
                                                className="text-gray-500 dark:text-gray-400"
                                            >
                                                {showPasswords.confirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    {errors.confirmPassword && watchedFields.confirmPassword && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <IoAlertCircleOutline className="text-red-400 text-sm" />
                                            <p className="text-red-400 text-[12px]">{errors.confirmPassword.message}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    For security reasons, we recommend changing your password regularly.
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>

                {isEditing && (
                    <CardFooter className="flex justify-end gap-2 pt-4">
                        <Button type='button' variant="outline" onClick={cancelEditing}>Cancel</Button>
                        <Button type='submit' disabled={isSubmitting}>
                            {isSubmitting ? "Updating..." : "Update Password"}
                        </Button>
                    </CardFooter>
                )}
            </form>
        </Card>
    );
};

export default Authentication;