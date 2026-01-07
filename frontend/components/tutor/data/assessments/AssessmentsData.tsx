"use client";

import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import AssessmentsTable from "./AssessmentsTable";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Image from "next/image";

interface IUser {
    _id: string;
    name: string;
    email: string;
    avatar?: {
        public_id?: string;
        url: string;
    };
}

interface ICourse {
    _id: string;
    name: string;
}

interface IAssessment {
    status: string;
    passed?: boolean;
    feedback?: string;
    initialImage?: {
        public_id: string;
        url: string;
    };
    makeupImage?: {
        public_id: string;
        url: string;
    };
}

interface IAssessmentData {
    _id: string;
    userId: IUser;
    courseId: ICourse;
    assessment: IAssessment;
    createdAt: string;
    updatedAt: string;
}

const AssessmentsData = () => {
    const [allAssessments, setAllAssessments] = useState<IAssessmentData[]>([]);
    const [loading, setLoading] = useState(false);

    // Grade modal states
    const [selectedAssessment, setSelectedAssessment] = useState<IAssessmentData | null>(null);
    const [isPassed, setIsPassed] = useState<boolean>(true);
    const [feedback, setFeedback] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch assessments from API
    const handleFetchAssessments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/get-assessments`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                }
            );

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Failed to fetch assessments");
                console.log("Fetching assessments failed: ", data.message);
                return;
            }

            setAllAssessments(data.assessments || []);
        } catch (error: any) {
            toast.error("Error fetching assessments");
            console.log("Get all assessments error:", error?.message || error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch data when component mounts
    useEffect(() => {
        handleFetchAssessments();
    }, [handleFetchAssessments]);

    // Handle grade click
    const handleGradeClick = (assessment: IAssessmentData) => {
        setSelectedAssessment(assessment);
        setIsPassed(assessment.assessment.passed ?? true);
        setFeedback(assessment.assessment.feedback ?? "");
    };

    // Handle submit grade
    const handleSubmitGrade = async () => {
        if (!selectedAssessment) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/grade-assessment`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        userId: selectedAssessment.userId._id,
                        courseId: selectedAssessment.courseId._id,
                        isPassed: isPassed,
                        feedback: feedback,
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Failed to submit grade");
                return;
            }

            toast.success("Assessment graded successfully");
            setSelectedAssessment(null);
            setFeedback("");

            // Refresh assessments list
            handleFetchAssessments();
        } catch (error: any) {
            toast.error("Error submitting grade");
            console.log(error?.message || error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        if (!isSubmitting) {
            setSelectedAssessment(null);
            setFeedback("");
        }
    };

    return (
        <div className="w-full">
            <div className="mb-6">
                <h1 className="text-gray-600 dark:text-gray-300 mt-1 uppercase font-semibold">
                    Student Assessments
                </h1>
            </div>

            <AssessmentsTable
                assessments={allAssessments}
                onGrade={handleGradeClick}
                isLoading={loading}
            />

            {/* Grade Modal */}
            <Dialog
                open={!!selectedAssessment}
                onOpenChange={(open) => !open && handleCloseModal()}
            >
                <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Grade Assessment</DialogTitle>
                        <DialogDescription>
                            Review the submission and provide feedback.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedAssessment && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Left side - Submission Images */}
                                <div className="space-y-4">
                                     <div>
                                        <Label>Before (Initial)</Label>
                                        <div className="mt-2 relative h-48 w-full rounded-md overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                                            {selectedAssessment.assessment.initialImage?.url ? (
                                                <Image
                                                    src={selectedAssessment.assessment.initialImage.url}
                                                    alt="Initial Submission"
                                                    fill
                                                    className="object-contain"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600">
                                                    No Initial Image
                                                </div>
                                            )}
                                        </div>
                                         {selectedAssessment.assessment.initialImage?.url && (
                                            <div className="mt-1 text-right">
                                                <a
                                                    href={selectedAssessment.assessment.initialImage.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-blue-500 hover:underline"
                                                >
                                                    View Full Size
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <Label>After (Makeup)</Label>
                                        <div className="mt-2 relative h-48 w-full rounded-md overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                                            {selectedAssessment.assessment.makeupImage?.url ? (
                                                <Image
                                                    src={selectedAssessment.assessment.makeupImage.url}
                                                    alt="Makeup Submission"
                                                    fill
                                                    className="object-contain"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600">
                                                    No Makeup Image
                                                </div>
                                            )}
                                        </div>
                                         {selectedAssessment.assessment.makeupImage?.url && (
                                            <div className="mt-1 text-right">
                                                <a
                                                    href={selectedAssessment.assessment.makeupImage.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-blue-500 hover:underline"
                                                >
                                                    View Full Size
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right side - Grade Form */}
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-sm font-medium mb-2 block">
                                            Student Information
                                        </Label>
                                        <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 flex flex-col justify-center items-start gap-2">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Name: {selectedAssessment.userId.name}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Email: {selectedAssessment.userId.email}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Course: {selectedAssessment.courseId.name}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="status" className="mb-2">Status</Label>
                                        <Select
                                            onValueChange={(value) => setIsPassed(value === "pass")}
                                            value={isPassed ? "pass" : "fail"}
                                        >
                                            <SelectTrigger className="w-full mt-1">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pass">Pass</SelectItem>
                                                <SelectItem value="fail">Fail</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="feedback" className="mb-2">Feedback</Label>
                                        <Textarea
                                            id="feedback"
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            placeholder="Provide constructive feedback for the student..."
                                            className="mt-1 h-32"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={handleCloseModal}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmitGrade}
                            disabled={isSubmitting}
                            className="bg-blue-500 hover:bg-blue-600"
                        >
                            {isSubmitting ? "Submitting..." : "Submit Grade"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AssessmentsData;