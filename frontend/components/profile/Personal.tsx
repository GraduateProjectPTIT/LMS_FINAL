"use client"

import React, { useEffect, useState } from 'react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch } from 'react-redux';
import { updateStart, updateSuccess, updateFailure } from '@/redux/user/userSlice';
import { getFieldStatus, getFieldBorderClass, getFieldIcon } from "@/utils/formFieldHelpers";
import toast from 'react-hot-toast';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { FaUserEdit } from 'react-icons/fa';
import { IoAlertCircleOutline } from "react-icons/io5";

interface PersonalProps {
    user: any;
}

const updatePersonalInfoSchema = z.object({
    name: z.string().min(3, "Username must be at least 3 characters").optional(),
    email: z.string().email("Invalid email address").optional(),
    socials: z.object({
        facebook: z.string().url().or(z.literal('')).optional(),
        instagram: z.string().url().or(z.literal('')).optional(),
        tiktok: z.string().url().or(z.literal('')).optional(),
    }).optional(),
    bio: z.string().max(500, "Bio can't be over 500 characters").optional(),
})

type UpdateFormValues = z.infer<typeof updatePersonalInfoSchema>

const Personal = ({ user }: PersonalProps) => {
    const [isEditing, setIsEditing] = useState(false); // check xem người dùng có đang chỉnh sửa không
    const [avatarPreview, setAvatarPreview] = useState<string>(""); // Lưu chuỗi base64 để hiển thị lên giao diện
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const dispatch = useDispatch();

    // Khởi tạo react-hook-form với giá trị ban đầu
    const {
        register,
        handleSubmit,
        watch,
        formState: { isSubmitting, errors, touchedFields },
        reset
    } = useForm<UpdateFormValues>({
        resolver: zodResolver(updatePersonalInfoSchema),
        mode: "onChange",
        defaultValues: {
            name: user?.name || "",
            email: user?.email || "",
            socials: {
                facebook: user?.socials?.facebook || "",
                instagram: user?.socials?.instagram || "",
                tiktok: user?.socials?.tiktok || "",
            },
            bio: user?.bio || "",
        }
    });

    const watchedFields = watch();

    // Helper function để lấy field status và styling
    const field = (name: keyof UpdateFormValues) => {
        const status = getFieldStatus(name, touchedFields, errors, watchedFields);
        return {
            border: getFieldBorderClass(status),
            icon: getFieldIcon(status),
        };
    };

    // Xử lý khi người dùng bấm nút hủy
    const handleCancel = () => {
        reset({
            name: user?.name,
            email: user?.email,
            socials: user?.socials,
            bio: user?.bio,
        });
        setAvatarPreview("");
        setIsEditing(false);
    }

    // Kích hoạt thẻ input file đang bị ẩn
    const handleClickChangePhoto = () => {
        const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
        if (fileInput) {
            fileInput.click();
        }
    }

    // Xử lý khi người dùng chọn một file ảnh
    const imageHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Chỉ cho phép người dùng chọn file ảnh
        if (!file.type.startsWith("image/")) {
            toast.error("Chỉ được chọn file ảnh!");
            return;
        }

        // Giới hạn dung lượng ảnh tải lên
        const maxMB = 2;
        if (file.size > maxMB * 1024 * 1024) {
            toast.error(`Ảnh vượt quá ${maxMB}MB!`);
            return;
        }

        // Đọc file và chuyển thành chuỗi base64
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                setAvatarPreview(reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    // Hàm gửi ảnh đại diện đã được mã hóa base64 lên server
    const handleAvatarUpload = async (): Promise<{ ok: boolean; data: any }> => {
        if (!avatarPreview) return Promise.resolve({ ok: true, data: null });

        try {
            // Gọi API để cập nhật ảnh đại diện
            setIsUploadingImage(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/user/update_avatar`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ avatar: avatarPreview }),
                credentials: 'include',
            });
            const data = await res.json();
            // Trả về kết quả có cấu trúc chuẩn hóa
            return { ok: res.ok, data };
        } catch (error: any) {
            console.error("Avatar upload error:", error.message);
            // Trả về lỗi nếu không gọi được API
            return { ok: false, data: { message: 'Upload failed due to a network error.' } };
        } finally {
            setIsUploadingImage(false);
        }
    };

    // Hàm xử lý chính khi người dùng gửi form
    const onSubmit = async (data: UpdateFormValues) => {
        // Kiểm tra xem người dùng có thay đổi thông tin gì không
        const hasInfoChanged = data.name !== user?.name ||
            data.email !== user?.email ||
            data.bio !== user?.bio ||
            JSON.stringify(data.socials) !== JSON.stringify(user?.socials);

        // Dừng lại nếu không có gì thay đổi
        if (!hasInfoChanged && !avatarPreview) {
            toast("No changes detected.");
            setIsEditing(false);
            return;
        }

        // Bắt đầu trạng thái loading
        dispatch(updateStart());

        // Tạo một danh sách để chứa các tác vụ cập nhật
        const updateTasks: Promise<{ ok: boolean; data: any }>[] = [];

        // Nếu thông tin thay đổi, thêm tác vụ cập nhật thông tin vào danh sách
        if (hasInfoChanged) {
            const infoPromise = fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/user/update_user_info`, {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                credentials: 'include',
            }).then(async (res) => ({ ok: res.ok, data: await res.json() }));

            updateTasks.push(infoPromise);
        }

        // Nếu ảnh thay đổi, thêm tác vụ cập nhật ảnh vào danh sách
        if (avatarPreview) {
            updateTasks.push(handleAvatarUpload());
        }

        try {
            // Chạy tất cả các tác vụ trong danh sách
            const results = await Promise.all(updateTasks);

            // Kiểm tra xem tất cả các tác vụ có thành công không
            const allSucceeded = results.every(res => res.ok);

            if (allSucceeded) {
                // Lấy dữ liệu người dùng mới nhất từ kết quả cuối cùng
                const latestUserData = results[results.length - 1]?.data?.user;
                if (latestUserData) {
                    dispatch(updateSuccess(latestUserData));
                    reset({
                        name: latestUserData.name || "",
                        email: latestUserData.email || "",
                        socials: {
                            facebook: latestUserData.socials?.facebook || "",
                            instagram: latestUserData.socials?.instagram || "",
                            tiktok: latestUserData.socials?.tiktok || "",
                        },
                        bio: latestUserData.bio || "",
                    });
                }
                toast.success("Profile updated successfully!");
                setAvatarPreview("");
                setIsEditing(false);
            } else {
                // Tìm lỗi đầu tiên và hiển thị cho người dùng
                const failedResult = results.find(res => !res.ok);
                const errorMessage = failedResult?.data?.message || "An update failed.";
                dispatch(updateFailure(errorMessage));
                toast.error(errorMessage);
            }
        } catch (error: any) {
            // Xử lý các lỗi không mong muốn khác
            const errorMessage = "Something went wrong. Please try again.";
            dispatch(updateFailure(errorMessage));
            toast.error(errorMessage);
        }
    };

    useEffect(() => {
        if (!user) return;
        reset({
            name: user.name || "",
            email: user.email || "",
            socials: {
                facebook: user.socials?.facebook || "",
                instagram: user.socials?.instagram || "",
                tiktok: user.socials?.tiktok || "",
            },
        });
    }, [user, reset])

    return (
        <Card className="w-full theme-mode border-gray-200 dark:border-slate-600 shadow-md dark:shadow-slate-600">

            <CardHeader className="flex gap-[20px] max-md:flex-col md:items-center md:justify-between pb-4">
                <div>
                    <CardTitle className="text-2xl font-bold">Personal Information</CardTitle>
                    <CardDescription>Update your personal details and profile information</CardDescription>
                </div>

                {!isEditing && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                        className='flex items-center gap-2 hover:cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900/70'
                    >
                        <FaUserEdit size={16} /> Edit
                    </Button>
                )}
            </CardHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className='flex flex-col gap-[20px]'>
                    <div className="flex flex-col md:flex-row gap-[20px] items-start">
                        {/* Avatar */}
                        <div className="flex flex-col items-center gap-2">
                            <div className='relative'>
                                <Avatar className="w-24 h-24 border border-gray-300 dark:border-slate-800 shadow-md">
                                    <AvatarImage src={avatarPreview || user?.avatar?.url || "/anonymous.png"} />
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

                        {/* Name + Email */}
                        <div className="flex-1 space-y-4 w-full">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <div className="relative">
                                    <Input
                                        id="name"
                                        {...register("name")}
                                        placeholder='Enter name'
                                        disabled={!isEditing}
                                        className={`${field('name').border} ${isEditing ? 'pr-10' : ''}`}
                                    />
                                    {isEditing && field('name').icon && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                            {field('name').icon}
                                        </div>
                                    )}
                                </div>
                                {errors.name && watchedFields.name && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <IoAlertCircleOutline className="text-red-400 text-sm" />
                                        <p className="text-red-400 text-[12px]">{errors.name.message}</p>
                                    </div>
                                )}
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        {...register("email")}
                                        placeholder='Enter email'
                                        disabled={!isEditing}
                                        className={`${field('email').border} ${isEditing ? 'pr-10' : ''}`}
                                    />
                                    {isEditing && field('email').icon && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                            {field('email').icon}
                                        </div>
                                    )}
                                </div>
                                {errors.email && watchedFields.email && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <IoAlertCircleOutline className="text-red-400 text-sm" />
                                        <p className="text-red-400 text-[12px]">{errors.email.message}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <div className="relative">
                            <textarea
                                id="bio"
                                {...register("bio")}
                                placeholder='Tell us about yourself...'
                                disabled={!isEditing}
                                className={`${field('bio').border} w-full rounded-md border text-sm p-2 pr-8 md:pr-10 bg-transparent resize-y min-h-[72px] ${isEditing ? 'pr-10' : ''}`}
                            />
                            {isEditing && field('bio').icon && (
                                <div className="absolute top-2 right-2">
                                    {field('bio').icon}
                                </div>
                            )}
                        </div>
                        {errors.bio && watchedFields.bio && (
                            <div className="flex items-center gap-2 mt-1">
                                <IoAlertCircleOutline className="text-red-400 text-sm" />
                                <p className="text-red-400 text-[12px]">{errors.bio.message}</p>
                            </div>
                        )}
                        {watchedFields.bio && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-right">
                                {watchedFields.bio.length}/500 characters
                            </p>
                        )}
                    </div>

                    {/* Social Links */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="facebook">Facebook</Label>
                            <div className="relative">
                                <Input
                                    id="facebook"
                                    placeholder='Enter facebook link'
                                    {...register("socials.facebook")}
                                    disabled={!isEditing}
                                    className={`${field('socials').border} ${isEditing ? 'pr-10' : ''}`}
                                />
                                {isEditing && field('socials').icon && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        {field('socials').icon}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="instagram">Instagram</Label>
                            <div className="relative">
                                <Input
                                    id="instagram"
                                    placeholder='Enter instagram link'
                                    {...register("socials.instagram")}
                                    disabled={!isEditing}
                                    className={`${field('socials').border} ${isEditing ? 'pr-10' : ''}`}
                                />
                                {isEditing && field('socials').icon && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        {field('socials').icon}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tiktok">TikTok</Label>
                            <div className="relative">
                                <Input
                                    id="tiktok"
                                    placeholder='Enter tiktok link'
                                    {...register("socials.tiktok")}
                                    disabled={!isEditing}
                                    className={`${field('socials').border} ${isEditing ? 'pr-10' : ''}`}
                                />
                                {isEditing && field('socials').icon && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        {field('socials').icon}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex justify-end gap-2 pt-4 ">
                    {isEditing && (
                        <>
                            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
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