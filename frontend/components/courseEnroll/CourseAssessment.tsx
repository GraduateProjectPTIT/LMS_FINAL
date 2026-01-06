"use client";

import React, { useState } from 'react';
import { Assessment } from '@/type';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { FaCheckCircle, FaTimesCircle, FaClock, FaLock } from 'react-icons/fa';
import { Upload, X, ImageIcon } from 'lucide-react';
import Certificate from './Certificate';
import CourseAssessmentCropModal from './CourseAssessmentCropModal';

interface CourseAssessmentProps {
    courseId: string;
    assessment?: Assessment;
    isCourseCompleted: boolean;
    onAssessmentUpdate: (newAssessment: Assessment) => void;
    courseName: string;
    tutorName: string;
    studentName: string;
}

const CourseAssessment = ({
    courseId,
    assessment,
    onAssessmentUpdate,
    isCourseCompleted,
    courseName,
    tutorName,
    studentName
}: CourseAssessmentProps) => {
    const [image, setImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showCropModal, setShowCropModal] = useState(false);
    const [tempImage, setTempImage] = useState('');

    const status = assessment?.status || 'pending';

    if (!isCourseCompleted) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 max-w-md">
                    <FaLock className="text-6xl mb-4 text-gray-300 dark:text-gray-600 mx-auto" />
                    <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                        Assessment Locked
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Complete all course lectures to unlock the final assessment.
                    </p>
                </div>
            </div>
        );
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {

            const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
            const maxSize = 10 * 1024 * 1024; // 10MB

            if (!validTypes.includes(file.type)) {
                toast.error("Only JPG, PNG, or WEBP images are allowed");
                return;
            }
            if (file.size > maxSize) {
                toast.error("Image must be smaller than 10MB");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setTempImage(reader.result as string);
                setShowCropModal(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = (croppedFile: File) => {
        setImage(croppedFile);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(croppedFile);
        setShowCropModal(false);
    };

    const handleCropCancel = () => {
        setShowCropModal(false);
        setTempImage('');
    };

    const handleRemoveImage = () => {
        setImage(null);
        setPreviewUrl(null);
    };

    const handleUpload = async () => {
        if (!image || !previewUrl) {
            toast.error("Please select an image");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/submit-assessment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    courseId,
                    submissionImage: previewUrl
                }),
            });

            const data = await res.json();
            if (!data.success) {
                throw new Error(data.message);
            }

            toast.success("Assessment submitted successfully!");
            onAssessmentUpdate(data.assessment);
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
                    Final Assessment
                </h1>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                {status === 'pending' && (
                    <div className="p-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">
                                Instructions
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300">
                                Please upload a makeup photo demonstrating the skills you have learned in this course.
                                Our instructors will review your submission to determine if it meets the requirements to receive your certificate.
                            </p>
                        </div>

                        {/* Upload Area */}
                        <div className="space-y-4">
                            {!previewUrl ? (
                                <label className="block cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                    <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-12 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-gray-100 dark:bg-slate-700 rounded-full">
                                                <ImageIcon className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Click to upload your makeup photo
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    PNG, JPG, Webp up to 10MB
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </label>
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                                        <div className="relative h-96 w-full bg-gray-100 dark:bg-slate-900">
                                            <Image
                                                src={previewUrl}
                                                alt="Preview"
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                        <button
                                            onClick={handleRemoveImage}
                                            className="absolute top-3 right-3 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-lg"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="flex gap-3">
                                        <label className="flex-1 cursor-pointer">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                            <div className="w-full h-[40px] flex justify-center items-center border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors text-center">
                                                Change Photo
                                            </div>
                                        </label>
                                        <button
                                            onClick={handleUpload}
                                            disabled={isLoading}
                                            className="flex-1 bg-blue-500 hover:bg-blue-600 w-full h-[40px] flex justify-center items-center text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <span className="animate-spin mr-2">⏳</span>
                                                    Uploading...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-4 h-4 mr-2" />
                                                    Submit Assessment
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {status === 'submitted' && (
                    <div className="p-8">
                        <div className="flex flex-col items-center text-center">
                            <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-4">
                                <FaClock className="text-orange-500 text-5xl" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                                Submission Received
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-1">
                                Your assessment has been submitted and is pending grading.
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Check back later for your results.
                            </p>

                            {assessment?.submissionImage?.url && (
                                <div className="mt-4 relative h-80 w-full max-w-md rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-md">
                                    <Image
                                        src={assessment.submissionImage.url}
                                        alt="Submission"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {status === 'graded' && (
                    <div className="p-8">
                        {/* Status Icon & Title */}
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className={`p-4 rounded-full mb-3 ${assessment?.passed
                                ? 'bg-green-100 dark:bg-green-900/30'
                                : 'bg-red-100 dark:bg-red-900/30'
                                }`}>
                                {assessment?.passed ? (
                                    <FaCheckCircle className="text-green-500 text-5xl" />
                                ) : (
                                    <FaTimesCircle className="text-red-500 text-5xl" />
                                )}
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                                {assessment?.passed ? 'Assessment Passed!' : 'Assessment Not Passed'}
                            </h3>
                        </div>

                        {/* Two Column Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* Left Column - Submission Image */}
                            {assessment?.submissionImage?.url && (
                                <div className="relative h-80 w-full rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-md">
                                    <Image
                                        src={assessment.submissionImage.url}
                                        alt="Submission"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            )}

                            {/* Right Column - Feedback */}
                            <div className="flex flex-col">
                                <div className="bg-gray-50 dark:bg-slate-900/50 p-6 rounded-xl border border-gray-200 dark:border-slate-700 h-full flex flex-col">
                                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                                        Instructor Feedback
                                    </h4>
                                    <p className="text-gray-800 dark:text-white text-left flex-1">
                                        {assessment?.feedback || "No feedback provided."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Certificate Section or Retry Button */}
                        {assessment?.passed ? (
                            <div className="w-full flex flex-col items-center gap-6 mt-8">
                                <div className="w-full">
                                    <Certificate
                                        studentName={studentName}
                                        courseName={courseName}
                                        tutorName={tutorName}
                                        date={new Date(Date.now()).toLocaleDateString("en-US", {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    />
                                </div>

                                <Button
                                    onClick={async () => {
                                        try {
                                            const response = await fetch(
                                                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/certificate/${courseId}`,
                                                {
                                                    headers: {
                                                        Authorization: `Bearer ${localStorage.getItem("token")}`
                                                    },
                                                    credentials: "include"
                                                }
                                            );
                                            const blob = await response.blob();
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `Certificate-${studentName.replace(/\s+/g, "_")}.pdf`;
                                            document.body.appendChild(a);
                                            a.click();
                                            window.URL.revokeObjectURL(url);
                                            document.body.removeChild(a);
                                        } catch (error) {
                                            console.error(error);
                                            toast.error("Failed to download certificate");
                                        }
                                    }}
                                    className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white border-0 px-8 py-3"
                                >
                                    Download Certificate
                                </Button>
                            </div>
                        ) : (
                            <div className="flex justify-center mt-6">
                                <Button
                                    onClick={() => onAssessmentUpdate({ ...assessment, status: 'pending' })}
                                    className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 bg-transparent"
                                >
                                    Try Again
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Crop Modal */}
            {showCropModal && (
                <CourseAssessmentCropModal
                    image={tempImage}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                />
            )}
        </div>
    );
};

export default CourseAssessment;