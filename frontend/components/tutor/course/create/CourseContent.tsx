"use client"
import React, { useState } from 'react'
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { FiPlusCircle } from "react-icons/fi";
import { Separator } from '@/components/ui/separator';

import { CourseDataProps, CourseLectureProps, VideoLinkProps } from "@/type"

interface CourseContentProps {
    active: number,
    setActive: (active: number) => void,
    courseData: CourseDataProps[], // This should be an array of CourseDataProps
    setCourseData: (newData: CourseDataProps[]) => void, // This also should be an array
}

interface CollapsedState {
    [key: string]: boolean;
}

const CourseContent = ({ active, setActive, courseData, setCourseData }: CourseContentProps) => {
    const [isCollapsed, setIsCollapsed] = useState<CollapsedState>({});

    const handleSubmit = (e: any) => {
        e.preventDefault();

        let isValid = true;
        courseData.forEach((section: CourseDataProps) => {
            if (!section.sectionTitle) {
                isValid = false;
                return;
            }

            section.sectionContents.forEach((content: CourseLectureProps) => {
                if (!content.videoTitle || !content.videoDescription || !content.videoUrl || !content.videoLength) {
                    isValid = false;
                    return;
                }
            });
        });

        if (!isValid) {
            toast.error("Please fill all required fields for each section");
            return;
        }

        setActive(active + 1);
    };

    const handleCollapseToggle = (sectionIndex: number, contentIndex: number) => {
        const key = `${sectionIndex}-${contentIndex}`;
        setIsCollapsed({
            ...isCollapsed,
            [key]: !isCollapsed[key]
        });
    };

    const handleAddNewSection = () => {
        setCourseData([
            ...courseData,
            {
                sectionTitle: `Untitled Section ${courseData.length + 1}`,
                sectionContents: [
                    {
                        videoTitle: "",
                        videoDescription: "",
                        videoUrl: "",
                        videoLength: 0,
                        videoLinks: [
                            {
                                title: "",
                                url: "",
                            },
                        ]
                    }
                ]
            }
        ]);
    };

    const handleRemoveSection = (sectionIndex: number) => {
        if (courseData.length === 1) {
            toast.error("You need at least one section");
            return;
        }

        const updatedData = [...courseData];
        updatedData.splice(sectionIndex, 1);
        setCourseData(updatedData);
    };

    const handleAddNewContent = (sectionIndex: number) => {
        const updatedData = [...courseData];
        updatedData[sectionIndex].sectionContents.push({
            videoTitle: "",
            videoDescription: "",
            videoUrl: "",
            videoLength: 0,
            videoLinks: [
                {
                    title: "",
                    url: "",
                },
            ]
        });
        setCourseData(updatedData);
    };

    const handleRemoveContent = (sectionIndex: number, contentIndex: number) => {
        const updatedData = [...courseData];

        // If it's the last content in the section and there's only one section
        if (updatedData[sectionIndex].sectionContents.length === 1 && updatedData.length === 1) {
            toast.error("You need at least one content item");
            return;
        }

        // If it's the last content in the section, remove the entire section
        if (updatedData[sectionIndex].sectionContents.length === 1) {
            updatedData.splice(sectionIndex, 1);
        } else {
            // Otherwise just remove the content
            updatedData[sectionIndex].sectionContents.splice(contentIndex, 1);
        }

        setCourseData(updatedData);
    };

    const handleSectionTitleChange = (sectionIndex: number, value: string) => {
        const updatedData = [...courseData];
        updatedData[sectionIndex].sectionTitle = value;
        setCourseData(updatedData);
    };

    const handleContentChange = (sectionIndex: number, contentIndex: number, field: keyof CourseLectureProps, value: string | number) => {
        const updatedData = [...courseData];
        if (field === 'videoLength') {
            updatedData[sectionIndex].sectionContents[contentIndex][field] = Number(value);
        } else if (field === 'videoTitle' || field === 'videoDescription' || field === 'videoUrl') {
            updatedData[sectionIndex].sectionContents[contentIndex][field] = value as string;
        }
        setCourseData(updatedData);
    };

    const handleAddNewLink = (sectionIndex: number, contentIndex: number) => {
        const updatedData = [...courseData];
        updatedData[sectionIndex].sectionContents[contentIndex].videoLinks.push({
            title: "",
            url: "",
        });
        setCourseData(updatedData);
    };

    const handleRemoveLink = (sectionIndex: number, contentIndex: number, linkIndex: number) => {
        const updatedData = [...courseData];
        updatedData[sectionIndex].sectionContents[contentIndex].videoLinks.splice(linkIndex, 1);
        setCourseData(updatedData);
    };

    const handleLinkChange = (sectionIndex: number, contentIndex: number, linkIndex: number, field: keyof VideoLinkProps, value: string) => {
        const updatedData = [...courseData];
        updatedData[sectionIndex].sectionContents[contentIndex].videoLinks[linkIndex][field] = value;
        setCourseData(updatedData);
    };

    return (
        <div className="rounded-lg border border-gray-400 dark:border-slate-500 shadow-md dark:shadow-slate-700 flex flex-col gap-8 p-4">
            <h1 className="text-2xl text-black dark:text-white font-bold">Course Content</h1>
            <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
                {courseData.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-300">
                        No content added yet. Click below to add sections and content.
                    </div>
                ) : (
                    <>
                        {courseData.map((section: CourseDataProps, sectionIndex: number) => (
                            <div key={sectionIndex} className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 md:p-6 flex flex-col gap-4">
                                {/* course title */}
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <Label htmlFor={`section-${sectionIndex}`} className="text-sm font-medium mb-1 block">
                                            Section Title*
                                        </Label>
                                        <Input
                                            id={`section-${sectionIndex}`}
                                            value={section.sectionTitle}
                                            onChange={(e) => handleSectionTitleChange(sectionIndex, e.target.value)}
                                            placeholder="Enter section title"
                                            className="border-gray-300 dark:border-gray-500"
                                        />
                                    </div>
                                    {courseData.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => handleRemoveSection(sectionIndex)}
                                            className="ml-2 mt-6 cursor-pointer hover:bg-red-500/50"
                                        >
                                            <Trash2 size={18} />
                                        </Button>
                                    )}
                                </div>

                                <div className="mt-2">
                                    {section.sectionContents.map((content: CourseLectureProps, contentIndex: number) => (
                                        <div key={contentIndex} className="border border-gray-300 dark:border-slate-700 rounded-lg p-4 mb-4 bg-white dark:bg-slate-700">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-md font-medium">Content #{contentIndex + 1}</h3>
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        onClick={() => handleCollapseToggle(sectionIndex, contentIndex)}
                                                        className='bg-gray-200 dark:bg-slate-500  hover:bg-gray-300 dark:hover:bg-slate-400 text-black dark:text-white cursor-pointer'
                                                    >
                                                        {isCollapsed[`${sectionIndex}-${contentIndex}`] ?
                                                            <ChevronDown size={18} /> :
                                                            <ChevronUp size={18} />}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        onClick={() => handleRemoveContent(sectionIndex, contentIndex)}
                                                        className='cursor-pointer hover:bg-red-500/50'
                                                    >
                                                        <Trash2 size={18} />
                                                    </Button>
                                                </div>
                                            </div>

                                            {!isCollapsed[`${sectionIndex}-${contentIndex}`] && (
                                                <div className="flex flex-col gap-5 mt-[10px]">
                                                    {/* title */}
                                                    <div className='flex flex-col gap-2'>
                                                        <Label htmlFor={`title-${sectionIndex}-${contentIndex}`} className="text-sm font-medium">
                                                            Content Title*
                                                        </Label>
                                                        <Input
                                                            id={`title-${sectionIndex}-${contentIndex}`}
                                                            value={content.videoTitle}
                                                            onChange={(e) => handleContentChange(sectionIndex, contentIndex, "videoTitle", e.target.value)}
                                                            placeholder="Enter content title"
                                                            className="border-gray-300 dark:border-gray-500"
                                                        />
                                                    </div>

                                                    {/* description */}
                                                    <div className='flex flex-col gap-2'>
                                                        <Label htmlFor={`description-${sectionIndex}-${contentIndex}`} className="text-sm font-medium">
                                                            Content Description*
                                                        </Label>
                                                        <textarea
                                                            id={`description-${sectionIndex}-${contentIndex}`}
                                                            value={content.videoDescription}
                                                            onChange={(e) => handleContentChange(sectionIndex, contentIndex, "videoDescription", e.target.value)}
                                                            placeholder="Enter content description"
                                                            className="border border-gray-300 dark:border-gray-500 p-3 rounded-lg"
                                                            rows={3}
                                                        ></textarea>
                                                    </div>

                                                    {/* video */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {/* video url */}
                                                        <div className='flex flex-col gap-2'>
                                                            <Label htmlFor={`videoUrl-${sectionIndex}-${contentIndex}`} className="text-sm font-medium">
                                                                Video URL*
                                                            </Label>
                                                            <Input
                                                                id={`videoUrl-${sectionIndex}-${contentIndex}`}
                                                                value={content.videoUrl}
                                                                onChange={(e) => handleContentChange(sectionIndex, contentIndex, "videoUrl", e.target.value)}
                                                                placeholder="Enter video URL"
                                                                className="border-gray-300 dark:border-gray-500"
                                                            />
                                                        </div>

                                                        {/* video length */}
                                                        <div className='flex flex-col gap-2'>
                                                            <Label htmlFor={`videoLength-${sectionIndex}-${contentIndex}`} className="text-sm font-medium">
                                                                Video Length (in minutes)*
                                                            </Label>
                                                            <Input
                                                                id={`videoLength-${sectionIndex}-${contentIndex}`}
                                                                type="number"
                                                                value={content.videoLength}
                                                                onChange={(e) => handleContentChange(sectionIndex, contentIndex, "videoLength", e.target.value)}
                                                                placeholder="15"
                                                                className="border-gray-300 dark:border-gray-500"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* resources */}
                                                    <div className='flex flex-col gap-2'>
                                                        <Label>Additional Resources & Links</Label>
                                                        <div>
                                                            {content.videoLinks.map((link: VideoLinkProps, linkIndex: number) => (
                                                                <div key={linkIndex} className="flex gap-2 mb-2">
                                                                    <Input
                                                                        value={link.title}
                                                                        onChange={(e) => handleLinkChange(sectionIndex, contentIndex, linkIndex, "title", e.target.value)}
                                                                        placeholder="Resource Title"
                                                                        className="border-gray-300 dark:border-gray-500"
                                                                    />
                                                                    <Input
                                                                        value={link.url}
                                                                        onChange={(e) => handleLinkChange(sectionIndex, contentIndex, linkIndex, "url", e.target.value)}
                                                                        placeholder="Resource URL"
                                                                        className="border-gray-300 dark:border-gray-500"
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        variant="destructive"
                                                                        size="icon"
                                                                        onClick={() => handleRemoveLink(sectionIndex, contentIndex, linkIndex)}
                                                                        className='cursor-pointer hover:bg-red-500/50'
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() => handleAddNewLink(sectionIndex, contentIndex)}
                                                            className="bg-gray-200 dark:bg-slate-500  hover:bg-gray-300 dark:hover:bg-slate-400 text-black dark:text-white cursor-pointer"
                                                        >
                                                            <FiPlusCircle size={16} className="mr-2" />
                                                            Add Resource Link
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleAddNewContent(sectionIndex)}
                                        className="w-full mb-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800/30"
                                    >
                                        <FiPlusCircle size={18} className="mr-2" />
                                        Add Content to This Section
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {/* Add new section button */}
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddNewSection}
                    className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-800/30"
                >
                    <FiPlusCircle size={18} className="mr-2" />
                    Add New Section
                </Button>

                <Separator className="border border-gray-300 dark:border-slate-500 mt-6" />

                {/* button navigate */}
                <div className="flex justify-between mt-2">
                    <Button
                        type="button"
                        onClick={() => setActive(active - 1)}
                        className='w-[100px] bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-black dark:text-white rounded-lg cursor-pointer'
                    >
                        Back
                    </Button>
                    <Button
                        type="submit"
                        className='w-[100px] bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer'
                    >
                        Continue
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CourseContent;