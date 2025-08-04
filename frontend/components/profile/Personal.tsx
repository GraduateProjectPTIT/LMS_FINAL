"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { FaUserEdit, FaUserCheck } from 'react-icons/fa';

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch } from 'react-redux';
import { signUpFailure, updateStart, updateSuccess } from '@/redux/user/userSlice';
import toast from 'react-hot-toast';

interface PersonalProps {
    user: any;
}

const updatePersonalInfoSchema = z.object({
    name: z.string().min(3, "Username must be at least 3 characters").optional(),
    email: z.string().email("Invalid email address").optional(),
})

type UpdateFormValues = z.infer<typeof updatePersonalInfoSchema>

const Personal = ({ user }: PersonalProps) => {
    const [isEditing, setIsEditing] = useState(false); // to allow to edit
    const [avatarFile, setAvatarFile] = useState<File | null>(null); // save user avatar file
    const [avatarPreview, setAvatarPreview] = useState<string>(""); // to display the image in UI
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const dispatch = useDispatch();

    const {
        register,
        handleSubmit,
        formState: {
            isSubmitting,
            errors
        }
    } = useForm<UpdateFormValues>({
        resolver: zodResolver(updatePersonalInfoSchema),
    })

    const onSubmit = async (data: UpdateFormValues) => {

        // No changes, no need to call the API
        if (data.name === user?.name && data.email === user?.email && !avatarFile) {
            toast("No changes detected.");
            setIsEditing(false)
            return;
        }

        if (data.name !== user?.name || data.email !== user?.email) {
            dispatch(updateStart());

            const bodyData: UpdateFormValues = {
                name: data.name,
            };

            if (data.email !== user?.email) {
                bodyData.email = data.email;
            }

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/user/update_user_info`, {
                    method: "PUT",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(bodyData),
                    credentials: 'include',
                });
                const responseData = await res.json();
                if (!res.ok) {
                    dispatch(signUpFailure("Update user info failed"));
                    toast.error(responseData.message);
                    return;
                } else {
                    dispatch(updateSuccess(responseData.user));
                    toast.success("Update information successfully");
                }
            } catch (error: any) {
                console.log(error.message);
                toast.error("Something went wrong. Please try again.");
            }
        }

        if (avatarFile) {
            await handleAvatarUpload();
        }

        setIsEditing(false);
    }

    const handleClickChangePhoto = () => {
        const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
        if (fileInput) {
            fileInput.click(); // Only call click if fileInput is not null
        }
    }

    const imageHandler = async (e: any) => {

        const file = e.target.files[0];

        if (file) {
            setAvatarFile(file);

            const fileReader = new FileReader();

            fileReader.onload = () => {
                if (fileReader.readyState === 2) {
                    setAvatarPreview(fileReader.result as string);
                }
            };
            fileReader.readAsDataURL(file)
        }
    }

    const handleAvatarUpload = async () => {
        if (!avatarFile) return;

        setIsUploadingImage(true);

        const formData = new FormData();
        formData.append('avatar', avatarFile);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/user/update_profile_picture`, {
                method: 'PUT',
                body: formData,
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.message || 'Failed to update profile picture');
                return;
            } else {
                dispatch(updateSuccess(data.user));
                toast.success("Update profile picture successfully");
            }
        } catch (error: any) {
            console.error(error.message);
            toast.error('Something went wrong while updating the profile picture.');
        } finally {
            setIsUploadingImage(false);
        }
    }

    return (
        <Card className="w-full border-gray-200 dark:border-slate-600 light-mode dark:dark-mode shadow-md dark:shadow-slate-600">

            <CardHeader className="flex gap-[20px] max-md:flex-col md:items-center md:justify-between pb-4">
                <div>
                    <CardTitle className="text-2xl font-bold">Personal Information</CardTitle>
                    <CardDescription>Update your personal details and profile information</CardDescription>
                </div>
                <Button
                    variant={isEditing ? "outline" : "default"}
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-2"
                >
                    {isEditing ? (
                        <>
                            <FaUserCheck size={16} />
                            <span>Save</span>
                        </>
                    ) : (
                        <>
                            <FaUserEdit size={16} />
                            <span>Edit</span>
                        </>
                    )}
                </Button>
            </CardHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className='flex flex-col gap-[20px]'>
                    <div className="flex flex-col md:flex-row gap-[20px] items-start">
                        {/* avatar */}
                        <div className="flex flex-col items-center gap-2">
                            <div className='relative'>
                                <Avatar className="w-24 h-24 border border-gray-300 dark:border-slate-800 shadow-md">
                                    <AvatarImage src={avatarPreview || user?.avatar.url || "/anonymous.png"} />
                                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-xl font-bold">
                                        {user?.name?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>

                                {
                                    isUploadingImage && (
                                        <div className='absolute inset-0 flex items-center justify-center bg-black/30 rounded-full'>
                                            <div className="animate-spin h-6 w-6 border-2 border-gray-200 border-t-blue-500 rounded-full"></div>
                                        </div>
                                    )
                                }
                            </div>
                            {isEditing && (
                                <>
                                    <Button
                                        onClick={handleClickChangePhoto}
                                        type='button'
                                        variant="outline"
                                        size="sm"
                                        className="text-sm"
                                    >
                                        Change Photo
                                    </Button>
                                    <input
                                        id="file-input"
                                        type="file"
                                        accept="image/*" // To allow image file types only
                                        className="hidden"  // Hide the input element
                                        onChange={imageHandler}  // Handle file selection
                                    />
                                </>

                            )}
                        </div>

                        {/* name */}
                        <div className="flex-1 space-y-4 w-full">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    {...register("name")}
                                    defaultValue={user?.name || "John Doe"}
                                    disabled={!isEditing}
                                    className="border-gray-300 dark:border-slate-600 w-full"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                <textarea
                                    id="bio"
                                    rows={3}
                                    defaultValue={user?.bio || "Frontend developer with 5 years of experience in building responsive web applications."}
                                    disabled={!isEditing}
                                    className="w-full rounded-md border border-gray-300 dark:border-slate-600 p-2 bg-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                {...register("email")}
                                defaultValue={user?.email || "john.doe@example.com"}
                                disabled={!isEditing}
                                className="border-gray-300 dark:border-slate-600"
                            />
                        </div>
                        {/* phone number */}
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                defaultValue={user?.phone || "+1 (555) 123-4567"}
                                disabled={!isEditing}
                                className="border-gray-300 dark:border-slate-600"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Input
                                id="country"
                                defaultValue={user?.country || "United States"}
                                disabled={!isEditing}
                                className="border-gray-300 dark:border-slate-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                                id="city"
                                defaultValue={user?.city || "New York"}
                                disabled={!isEditing}
                                className="border-gray-300 dark:border-slate-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="zipCode">Zip Code</Label>
                            <Input
                                id="zipCode"
                                defaultValue={user?.zipCode || "10001"}
                                disabled={!isEditing}
                                className="border-gray-300 dark:border-slate-600"
                            />
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex justify-end gap-2 pt-4 ">
                    {isEditing && (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button type='submit' disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : "Save changes"}
                            </Button>
                        </>
                    )}
                </CardFooter>
            </form>

        </Card>
    );
};

export default Personal;