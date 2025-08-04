"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { FaLock, FaEye, FaEyeSlash, FaEdit } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';

interface AuthenticationProps {
    user: any;
}

const Authentication = ({ user }: AuthenticationProps) => {

    const [formPassword, setFormPassword] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswords, setShowPasswords] = useState({
        oldPassword: false,
        newPassword: false,
        confirmPassword: false
    });

    const handleChange = (e: any) => {
        setFormPassword({ ...formPassword, [e.target.id]: e.target.value });
    }

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
        setFormPassword({
            oldPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
    }

    const handleSubmitForm = async (e: any) => {
        e.preventDefault();

        if (formPassword.newPassword !== formPassword.confirmPassword) {
            toast.error("Password do not match!");
            return;
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/user/update_password`, {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    oldPassword: formPassword.oldPassword,
                    newPassword: formPassword.newPassword
                }),
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.message);
                return;
            } else {
                setIsEditing(false);
                toast.success("Password updated successfully!");
                setFormPassword({
                    oldPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            }
        } catch (error: any) {
            console.log(error.message);
            toast.error("Something went wrong. Please try again.");
        }
    }

    return (
        <Card className="w-full border-gray-200 dark:border-slate-600 light-mode dark:dark-mode shadow-md dark:shadow-slate-600">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <FaLock className="text-blue-500" size={20} />
                    <CardTitle className="text-2xl font-bold">Security Settings</CardTitle>
                </div>
                <CardDescription>Manage your email and password settings</CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmitForm}>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Email Addresses</h3>

                        <div className="p-4 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex items-center justify-between">
                            <div>
                                <p className="font-medium">{user?.email || "john.doe@example.com"}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Primary email</p>
                            </div>
                            <Badge className="bg-green-500">Verified</Badge>
                        </div>

                        <Button type='button' variant="outline" className="w-full cursor-pointer">Add New Email</Button>
                    </div>

                    <Separator className="my-4 border" />

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Password</h3>
                            {!isEditing && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={startEditing}
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <FaEdit size={16} /> Change Password
                                </Button>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="space-y-4">
                                <div className="space-y-2 relative">
                                    <Label htmlFor="oldPassword">Current Password</Label>
                                    <div className="relative">
                                        <Input
                                            onChange={handleChange}
                                            id="oldPassword"
                                            type={showPasswords.oldPassword ? "text" : "password"}
                                            value={formPassword.oldPassword}
                                            placeholder="••••••••"
                                            className="border-gray-300 dark:border-slate-600 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('oldPassword')}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400"
                                        >
                                            {showPasswords.oldPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            onChange={handleChange}
                                            id="newPassword"
                                            type={showPasswords.newPassword ? "text" : "password"}
                                            value={formPassword.newPassword}
                                            placeholder="••••••••"
                                            className="border-gray-300 dark:border-slate-600 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('newPassword')}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400"
                                        >
                                            {showPasswords.newPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <div className="relative">
                                        <Input
                                            onChange={handleChange}
                                            id="confirmPassword"
                                            type={showPasswords.confirmPassword ? "text" : "password"}
                                            value={formPassword.confirmPassword}
                                            placeholder="••••••••"
                                            className="border-gray-300 dark:border-slate-600 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('confirmPassword')}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400"
                                        >
                                            {showPasswords.confirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                        </button>
                                    </div>
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
                        <Button type='submit'>Update Password</Button>
                    </CardFooter>
                )}
            </form>

        </Card>
    );
};

export default Authentication;