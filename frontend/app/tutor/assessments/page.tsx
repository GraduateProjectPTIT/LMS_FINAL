"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { format } from "timeago.js";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TutorAssessmentsPage = () => {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<any | null>(null);
  const [isPassed, setIsPassed] = useState<boolean>(true);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAssessments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/get-assessments`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();
      if (res.ok) {
        setAssessments(data.assessments);
      } else {
        toast.error(data.message || "Failed to fetch assessments");
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const handleGradeClick = (assessment: any) => {
    setSelectedAssessment(assessment);
    setIsPassed(assessment.assessment.passed ?? true);
    setFeedback(assessment.assessment.feedback ?? "");
  };

  const handleSubmitGrade = async () => {
    // No validation needed for boolean


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
      if (res.ok) {
        toast.success("Assessment graded successfully");
        setSelectedAssessment(null);
        fetchAssessments(); // Refresh list
      } else {
        toast.error(data.message || "Failed to submit grade");
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Student Assessments</h1>

      <div className="bg-white dark:bg-slate-800 rounded-md shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted At</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  Loading...
                </TableCell>
              </TableRow>
            ) : assessments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No assessments found.
                </TableCell>
              </TableRow>
            ) : (
              assessments.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>
                    <div className="font-medium">{item.userId.name}</div>
                    <div className="text-xs text-gray-500">{item.userId.email}</div>
                  </TableCell>
                  <TableCell>{item.courseId.name}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        item.assessment.status === "graded"
                          ? item.assessment.passed
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {item.assessment.status === "graded"
                        ? item.assessment.passed
                          ? "Passed"
                          : "Failed"
                        : item.assessment.status}
                    </span>
                  </TableCell>
                  <TableCell>{format(item.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGradeClick(item)}
                    >
                      {item.assessment.status === "graded" ? "View / Edit" : "Grade"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!selectedAssessment}
        onOpenChange={(open) => !open && setSelectedAssessment(null)}
      >
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Grade Assessment</DialogTitle>
            <DialogDescription>
              Review the submission and provide a score and feedback.
            </DialogDescription>
          </DialogHeader>

          {selectedAssessment && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Submission Image</Label>
                  <div className="mt-2 relative h-64 w-full rounded-md overflow-hidden border border-gray-200 bg-gray-50">
                    {selectedAssessment.assessment.submissionImage?.url ? (
                      <Image
                        src={selectedAssessment.assessment.submissionImage.url}
                        alt="Submission"
                        fill
                        className="object-contain"
                      />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                    )}
                  </div>
                  <div className="mt-2 text-right">
                     <a href={selectedAssessment.assessment.submissionImage?.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">Open original</a>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                        onValueChange={(value) => setIsPassed(value === "pass")}
                        defaultValue={isPassed ? "pass" : "fail"}
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
                    <Label htmlFor="feedback">Feedback</Label>
                    <Textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Great work! ..."
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
              onClick={() => setSelectedAssessment(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitGrade} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Grade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TutorAssessmentsPage;
