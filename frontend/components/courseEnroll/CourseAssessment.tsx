import React, { useState } from 'react';
import { Assessment } from '@/type';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { FaCheckCircle, FaTimesCircle, FaClock, FaLock } from 'react-icons/fa';
import Certificate from './Certificate';

interface CourseAssessmentProps {
    courseId: string;
    assessment?: Assessment;
    isCourseCompleted: boolean;
    onAssessmentUpdate: (newAssessment: Assessment) => void;
    courseName: string;
    tutorName: string;
    studentName: string;
}

const CourseAssessment = ({ courseId, assessment, onAssessmentUpdate, isCourseCompleted, courseName, tutorName, studentName }: CourseAssessmentProps) => {
    const [image, setImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);

    const status = assessment?.status || 'pending';

    React.useEffect(() => {
       // Removed auto-fetch
    }, [status, assessment, courseId]);

    if (!isCourseCompleted) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500">
                <FaLock className="text-6xl mb-4 text-gray-300" />
                <h2 className="text-2xl font-bold mb-2">Assessment Locked</h2>
                <p>Complete all course lectures to unlock the final assessment.</p>
            </div>
        );
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
             const reader = new FileReader();
             reader.onload = () => {
                 if (reader.readyState === 2) {
                     setPreviewUrl(reader.result as string);
                     setImage(file);
                 }
             };
             reader.readAsDataURL(file);
        }
    };

    const handleUpload = async () => {
        if (!image || !previewUrl) {
            toast.error("Please select an image");
            return;
        }

        setIsLoading(true);
        try {
            // Submit assessment with base64 image
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/submit-assessment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    courseId,
                    submissionImage: previewUrl // Send base64 string
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
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Final Assessment</h1>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Instructions</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Please upload a makeup photo demonstrating the skills you have learned in this course. 
                    Our instructors will review your submission to determine if it meets the requirements to receive your certificate.
                </p>

                {status === 'pending' && (
                    <div className="space-y-4">
                         <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="picture">Makeup Photo</Label>
                            <Input id="picture" type="file" accept="image/*" onChange={handleImageChange} />
                        </div>
                        
                        {previewUrl && (
                            <div className="mt-4 relative h-64 w-full md:w-96 rounded-md overflow-hidden border border-gray-200">
                                <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                            </div>
                        )}

                        <Button onClick={handleUpload} disabled={isLoading || !image} className="mt-4">
                            {isLoading ? "Uploading..." : "Submit Assessment"}
                        </Button>
                    </div>
                )}

                {status === 'submitted' && (
                    <div className="flex flex-col items-center py-8">
                         <FaClock className="text-orange-500 text-5xl mb-4" />
                         <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Submission Received</h3>
                         <p className="text-gray-600 dark:text-gray-300 mt-2">Your assessment has been submitted and is pending grading.</p>
                         <p className="text-sm text-gray-500 mt-1">Check back later for your results.</p>
                         {assessment?.submissionImage?.url && (
                             <div className="mt-6 relative h-64 w-full md:w-96 rounded-md overflow-hidden border border-gray-200">
                                 <Image src={assessment.submissionImage.url} alt="Submission" fill className="object-cover" />
                             </div>
                         )}
                    </div>
                )}
                
                {status === 'graded' && (
                    <div className="flex flex-col items-center py-8">
                        {assessment?.passed ? (
                             <FaCheckCircle className="text-green-500 text-6xl mb-4" />
                        ) : (
                             <FaTimesCircle className="text-red-500 text-6xl mb-4" />
                        )}
                        
                        {/* Score removed */}
                        
                        <div className={`text-lg font-medium px-4 py-1 rounded-full mb-4 ${assessment?.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {assessment?.passed ? 'Passed' : 'Failed'}
                        </div>

                        <div className="w-full bg-gray-50 dark:bg-gray-700/50 p-4 rounded-md text-left mb-6">
                            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Instructor Feedback</h4>
                            <p className="text-gray-800 dark:text-white">{assessment?.feedback || "No feedback provided."}</p>
                        </div>
                        
                        {assessment?.submissionImage?.url && (
                             <div className="mb-6 relative h-48 w-full md:w-72 rounded-md overflow-hidden border border-gray-200 opacity-75 hover:opacity-100 transition-opacity">
                                 <Image src={assessment.submissionImage.url} alt="Submission" fill className="object-cover" />
                             </div>
                         )}

                        {assessment?.passed ? (
                            <div className="w-full flex flex-col items-center">
                                <div className="w-full mb-6 relative">
                                    <Certificate 
                                        studentName={studentName}
                                        courseName={courseName}
                                        tutorName={tutorName}
                                        date={new Date(Date.now()).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                                    />
                                </div>
                                
                                <Button 
                                    onClick={async () => {
                                        try {
                                            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/certificate/${courseId}`,{
                                                headers: {
                                                    Authorization: `Bearer ${localStorage.getItem("token")}`
                                                },
                                                credentials: "include"
                                            });
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
                                        }
                                    }}
                                    className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white border-0"
                                >
                                    Download Certificate
                                </Button>
                            </div>
                        ) : (
                             <Button onClick={() => onAssessmentUpdate({...assessment, status: 'pending'})} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                                Try Again
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseAssessment;
