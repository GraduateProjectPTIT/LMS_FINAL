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
    const [initialImage, setInitialImage] = useState<File | null>(null);
    const [initialPreviewUrl, setInitialPreviewUrl] = useState<string | null>(null);
    
    const [makeupImage, setMakeupImage] = useState<File | null>(null);
    const [makeupPreviewUrl, setMakeupPreviewUrl] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    
    const [showCropModal, setShowCropModal] = useState(false);
    const [tempImage, setTempImage] = useState('');
    const [currentCropType, setCurrentCropType] = useState<'initial' | 'makeup' | null>(null);

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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'initial' | 'makeup') => {
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
                setCurrentCropType(type);
                setShowCropModal(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = (croppedFile: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (currentCropType === 'initial') {
                setInitialImage(croppedFile);
                setInitialPreviewUrl(reader.result as string);
            } else if (currentCropType === 'makeup') {
                setMakeupImage(croppedFile);
                setMakeupPreviewUrl(reader.result as string);
            }
        };
        reader.readAsDataURL(croppedFile);
        setShowCropModal(false);
        setCurrentCropType(null);
    };

    const handleCropCancel = () => {
        setShowCropModal(false);
        setTempImage('');
        setCurrentCropType(null);
    };

    const handleRemoveImage = (type: 'initial' | 'makeup') => {
        if (type === 'initial') {
            setInitialImage(null);
            setInitialPreviewUrl(null);
        } else {
            setMakeupImage(null);
            setMakeupPreviewUrl(null);
        }
    };

    const handleUpload = async () => {
        if (!initialPreviewUrl && !makeupPreviewUrl) {
           toast.error("Please upload both images.");
           return;
        }

        if (!initialPreviewUrl) {
            toast.error("Please upload the 'Before' (Initial) image.");
            return;
        }

        if (!makeupPreviewUrl) {
             toast.error("Please upload the 'After' (Makeup) image.");
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
                    initialImage: initialPreviewUrl,
                    makeupImage: makeupPreviewUrl
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

    const UploadSection = ({ type, title, previewUrl, onRemove }: { type: 'initial' | 'makeup', title: string, previewUrl: string | null, onRemove: () => void }) => (
        <div className="flex-1">
             <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">{title}</h3>
            {!previewUrl ? (
                <label className="block cursor-pointer">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, type)}
                        className="hidden"
                    />
                    <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors h-64 flex flex-col justify-center items-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="p-4 bg-gray-100 dark:bg-slate-700 rounded-full">
                                <ImageIcon className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                            </div>
                            <div>
                                <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Upload Photo
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    PNG, JPG, Webp
                                </p>
                            </div>
                        </div>
                    </div>
                </label>
            ) : (
                <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                        <div className="relative h-64 w-full bg-gray-100 dark:bg-slate-900">
                            <Image
                                src={previewUrl}
                                alt={`${title} Preview`}
                                fill
                                className="object-contain"
                            />
                        </div>
                        <button
                            onClick={onRemove}
                            className="absolute top-3 right-3 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <label className="block cursor-pointer">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, type)}
                            className="hidden"
                        />
                        <div className="w-full h-[40px] flex justify-center items-center border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors text-center">
                            Change Photo
                        </div>
                    </label>
                </div>
            )}
        </div>
    );

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
                                Please upload two photos: one <strong>Before</strong> (Initial) and one <strong>After</strong> (Makeup) demonstrating the skills you have learned in this course.
                                Tutor will review your submission to determine if it meets the requirements to receive your certificate.
                            </p>
                        </div>

                        {/* Upload Area */}
                        <div className="flex flex-col md:flex-row gap-6 mb-8">
                            <UploadSection 
                                type="initial" 
                                title="Before (Initial)" 
                                previewUrl={initialPreviewUrl} 
                                onRemove={() => handleRemoveImage('initial')} 
                            />
                            <UploadSection 
                                type="makeup" 
                                title="After (Makeup)" 
                                previewUrl={makeupPreviewUrl} 
                                onRemove={() => handleRemoveImage('makeup')} 
                            />
                        </div>

                        <div className="flex justify-center">
                             <button
                                onClick={handleUpload}
                                disabled={isLoading}
                                className="bg-blue-500 hover:bg-blue-600 px-8 py-3 flex justify-center items-center text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
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

                            <div className="flex flex-col md:flex-row gap-6 w-full mt-4 justify-center">
                                 {assessment?.initialImage?.url && (
                                    <div className="flex-1 max-w-2xl">
                                        <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Before</h4>
                                        <div className="relative h-[500px] w-full rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-md">
                                            <Image
                                                src={assessment.initialImage.url}
                                                alt="Initial Submission"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    </div>
                                )}
                                
                                {assessment?.makeupImage?.url && (
                                    <div className="flex-1 max-w-2xl">
                                        <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">After</h4>
                                        <div className="relative h-[500px] w-full rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-md">
                                            <Image
                                                src={assessment.makeupImage.url}
                                                alt="Makeup Submission"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
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

                         <div className="grid grid-cols-1 gap-6 mb-6">
                             <div className="flex flex-col md:flex-row gap-6 w-full justify-center">
                                {assessment?.initialImage?.url && (
                                    <div className="flex-1">
                                        <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300 text-center">Before</h4>
                                        <div className="relative h-[500px] w-full rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-md">
                                            <Image
                                                src={assessment.initialImage.url}
                                                alt="Initial Submission"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    </div>
                                )}
                                {(assessment?.makeupImage?.url) && (
                                    <div className="flex-1">
                                        <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300 text-center">After</h4>
                                        <div className="relative h-[500px] w-full rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-md">
                                            <Image
                                                src={assessment.makeupImage!.url}
                                                alt="Makeup Submission"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

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
                                <div className="w-full overflow-x-auto flex justify-center mb-6">
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