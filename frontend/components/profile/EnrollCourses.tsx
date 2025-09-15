import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { SiGoogleclassroom } from "react-icons/si";
import { FaGraduationCap, FaBookmark, FaCalendarAlt, FaClock } from 'react-icons/fa';
import { Progress } from '../ui/progress';

interface EnrollCoursesProps {
    user: any;
}

const EnrollCourses = ({ user }: EnrollCoursesProps) => {
    // Mock data for enrolled courses
    const enrolledCourses = [
        {
            id: 1,
            title: "Advanced React Development",
            instructor: "Sarah Johnson",
            progress: 75,
            totalLessons: 24,
            completedLessons: 18,
            category: "Web Development",
            nextLesson: "State Management with Redux",
            imageUrl: "https://github.com/shadcn.png",
            lastAccessed: "2 days ago"
        },
        {
            id: 2,
            title: "Next.js Masterclass",
            instructor: "Mike Thompson",
            progress: 45,
            totalLessons: 18,
            completedLessons: 8,
            category: "Frontend",
            nextLesson: "Server-Side Rendering",
            imageUrl: "https://github.com/shadcn.png",
            lastAccessed: "1 week ago"
        },
        {
            id: 3,
            title: "UI/UX Design Principles",
            instructor: "Emily Chen",
            progress: 30,
            totalLessons: 20,
            completedLessons: 6,
            category: "Design",
            nextLesson: "User Research Methods",
            imageUrl: "https://github.com/shadcn.png",
            lastAccessed: "3 days ago"
        }
    ];

    return (
        <Card className="w-full theme-mode border-gray-200 dark:border-slate-600 shadow-md dark:shadow-slate-600">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <SiGoogleclassroom className="text-blue-500" size={22} />
                    <CardTitle className="text-2xl font-bold">Enrolled Courses</CardTitle>
                </div>
                <CardDescription>Track your progress in enrolled courses</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center gap-2 p-2 px-4 rounded-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700">
                        <FaGraduationCap className="text-blue-500" />
                        <span className="font-medium">{enrolledCourses.length} Courses</span>
                    </div>

                    <div className="flex items-center gap-2 p-2 px-4 rounded-full bg-green-50 dark:bg-slate-800 border border-green-100 dark:border-slate-700">
                        <FaClock className="text-green-500" />
                        <span className="font-medium">12 Hours Completed</span>
                    </div>

                    <div className="flex items-center gap-2 p-2 px-4 rounded-full bg-purple-50 dark:bg-slate-800 border border-purple-100 dark:border-slate-700">
                        <FaBookmark className="text-purple-500" />
                        <span className="font-medium">4 Certificates</span>
                    </div>
                </div>

                <div className="space-y-6">
                    {enrolledCourses.map((course, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                            <div className="flex flex-col md:flex-row">
                                <div className="w-full md:w-1/4 bg-gradient-to-br from-blue-500 to-purple-600 p-6 flex items-center justify-center">
                                    <FaGraduationCap size={60} className="text-white opacity-80" />
                                </div>

                                <div className="w-full md:w-3/4 p-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold mb-1">{course.title}</h3>
                                            <p className="text-gray-500 dark:text-gray-400">Instructor: {course.instructor}</p>
                                        </div>

                                        <Badge className="w-fit bg-blue-500 hover:bg-blue-600">{course.category}</Badge>
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm font-medium">{course.progress}% complete</span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {course.completedLessons}/{course.totalLessons} lessons
                                            </span>
                                        </div>
                                        <Progress value={course.progress} className="h-2" />
                                    </div>

                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Next Lesson:</p>
                                            <p className="font-medium">{course.nextLesson}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Last accessed {course.lastAccessed}</p>
                                        </div>

                                        <Button className="w-full md:w-auto">Continue Learning</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-slate-600 p-6 text-center">
                    <SiGoogleclassroom size={40} className="mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                    <h3 className="text-lg font-medium mb-2">Discover New Courses</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Expand your skills with our catalog of professional courses</p>
                    <Button variant="outline" className="w-full md:w-auto">Browse Course Catalog</Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default EnrollCourses;