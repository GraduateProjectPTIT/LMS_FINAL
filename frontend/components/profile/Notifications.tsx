"use client"

import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateStart, updateSuccess, updateFailure } from '@/redux/user/userSlice';
import toast from 'react-hot-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { IoNotificationsOutline } from "react-icons/io5";
import { MdOutlineMessage, MdOutlinePayment, MdOutlinePerson, MdOutlineRateReview } from "react-icons/md";

interface INotificationsProps {
    user: any;
}

interface NotificationSettings {
    on_reply_comment: boolean;
    on_payment_success: boolean;
    on_new_student: boolean;
    on_new_review: boolean;
}

const Notifications = ({ user }: INotificationsProps) => {
    const dispatch = useDispatch();
    const [isUpdating, setIsUpdating] = useState(false);

    // Kiểm tra role của user
    const isStudent = user?.role === 'student';
    const isTutorOrAdmin = user?.role === 'tutor' || user?.role === 'admin';

    // Khởi tạo state cho các cài đặt thông báo
    const [settings, setSettings] = useState<NotificationSettings>({
        on_reply_comment: user?.notification_settings?.on_reply_comment || false,
        on_payment_success: user?.notification_settings?.on_payment_success || false,
        on_new_student: user?.notification_settings?.on_new_student || false,
        on_new_review: user?.notification_settings?.on_new_review || false,
    });

    // Cập nhật settings khi user thay đổi
    useEffect(() => {
        if (user?.notification_settings) {
            setSettings({
                on_reply_comment: user.notification_settings.on_reply_comment || false,
                on_payment_success: user.notification_settings.on_payment_success || false,
                on_new_student: user.notification_settings.on_new_student || false,
                on_new_review: user.notification_settings.on_new_review || false,
            });
        }
    }, [user]);

    // Xử lý thay đổi cài đặt
    const handleToggle = async (key: keyof NotificationSettings) => {
        const newValue = !settings[key];
        const newSettings = { ...settings, [key]: newValue };

        // Cập nhật UI ngay lập tức
        setSettings(newSettings);

        try {
            setIsUpdating(true);
            dispatch(updateStart());

            // Chuyển đổi boolean thành string để gửi lên API
            // Nếu là student, luôn gửi false cho on_new_student và on_new_review
            const requestBody = {
                on_reply_comment: String(newSettings.on_reply_comment),
                on_payment_success: String(newSettings.on_payment_success),
                on_new_student: isStudent ? 'false' : String(newSettings.on_new_student),
                on_new_review: isStudent ? 'false' : String(newSettings.on_new_review),
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/user/update_notification_settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody),
                credentials: 'include',
            });

            const data = await res.json();

            if (res.ok) {
                dispatch(updateSuccess(data.user));
                toast.success('Notification settings updated successfully!');
            } else {
                // Rollback nếu thất bại
                setSettings(settings);
                dispatch(updateFailure(data.message || 'Failed to update notification settings'));
                toast.error(data.message || 'Failed to update notification settings');
            }
        } catch (error: any) {
            // Rollback nếu có lỗi
            setSettings(settings);
            const errorMessage = 'Something went wrong. Please try again.';
            dispatch(updateFailure(errorMessage));
            toast.error(errorMessage);
        } finally {
            setIsUpdating(false);
        }
    };

    // Danh sách các cài đặt thông báo
    const notificationOptions = [
        {
            key: 'on_reply_comment' as keyof NotificationSettings,
            icon: <MdOutlineMessage className="text-blue-500" size={24} />,
            title: 'Comment Replies',
            description: 'Get notified when someone replies to your comments',
            roles: ['student', 'tutor', 'admin'], // Hiển thị cho tất cả role
        },
        {
            key: 'on_payment_success' as keyof NotificationSettings,
            icon: <MdOutlinePayment className="text-blue-500" size={24} />,
            title: 'Payment Success',
            description: 'Receive notifications for successful payment transactions',
            roles: ['student', 'tutor', 'admin'], // Hiển thị cho tất cả role
        },
        {
            key: 'on_new_student' as keyof NotificationSettings,
            icon: <MdOutlinePerson className="text-blue-500" size={24} />,
            title: 'New Students',
            description: 'Get notified when new students enroll in your courses',
            roles: ['tutor', 'admin'], // Chỉ hiển thị cho tutor và admin
        },
        {
            key: 'on_new_review' as keyof NotificationSettings,
            icon: <MdOutlineRateReview className="text-blue-500" size={24} />,
            title: 'New Reviews',
            description: 'Receive notifications when students leave reviews',
            roles: ['tutor', 'admin'], // Chỉ hiển thị cho tutor và admin
        },
    ];

    // Lọc các option theo role của user
    const filteredOptions = notificationOptions.filter(option =>
        option.roles.includes(user?.role)
    );

    return (
        <Card className="w-full theme-mode border-gray-200 dark:border-slate-600 shadow-md dark:shadow-slate-600">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div>
                        <CardTitle className="text-2xl font-bold">Notification Settings</CardTitle>
                        <CardDescription>Manage how you receive notifications</CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {filteredOptions.map((option, index) => (
                    <div
                        key={option.key}
                        className={`flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors ${index !== filteredOptions.length - 1 ? 'mb-4' : ''
                            }`}
                    >
                        <div className="flex items-start gap-4 flex-1">
                            <div className="mt-1">
                                {option.icon}
                            </div>
                            <div className="flex-1">
                                <Label
                                    htmlFor={option.key}
                                    className="text-base font-semibold cursor-pointer"
                                >
                                    {option.title}
                                </Label>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {option.description}
                                </p>
                            </div>
                        </div>

                        <Switch
                            id={option.key}
                            checked={settings[option.key]}
                            onCheckedChange={() => handleToggle(option.key)}
                            disabled={isUpdating}
                            className="ml-4"
                        />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

export default Notifications;