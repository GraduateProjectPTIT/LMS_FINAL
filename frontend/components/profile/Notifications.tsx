import React from 'react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { MdNotificationsActive } from "react-icons/md";

interface NotificationProps {
    user: any;
}

const Notification = ({ user }: NotificationProps) => {
    return (
        <Card className="w-full theme-mode border-gray-200 dark:border-slate-600 shadow-md dark:shadow-slate-600">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <MdNotificationsActive className="text-blue-500" size={22} />
                    <CardTitle className="text-2xl font-bold">Notification Preferences</CardTitle>
                </div>
                <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Email Notifications</h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                            <div>
                                <p className="font-medium">Course Updates</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when your enrolled courses have new content</p>
                            </div>
                            <Switch defaultChecked id="course-updates" />
                        </div>

                        <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                            <div>
                                <p className="font-medium">New Assignments</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications about new assignments</p>
                            </div>
                            <Switch defaultChecked id="assignments" />
                        </div>

                        <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                            <div>
                                <p className="font-medium">Forum Replies</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when someone replies to your posts</p>
                            </div>
                            <Switch defaultChecked id="forum-replies" />
                        </div>
                    </div>
                </div>

                <Separator className="my-4 border" />

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Push Notifications</h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                            <div>
                                <p className="font-medium">Course Reminders</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Reminders for upcoming lessons and deadlines</p>
                            </div>
                            <Switch defaultChecked id="course-reminders" />
                        </div>

                        <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                            <div>
                                <p className="font-medium">Promotions</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Special offers and discounts on courses</p>
                            </div>
                            <Switch id="promotions" />
                        </div>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-2 pt-4 ">
                <Button variant="outline" className='cursor-pointer'>Reset to Default</Button>
                <Button className='cursor-pointer'>Save Preferences</Button>
            </CardFooter>
        </Card>
    );
};

export default Notification;