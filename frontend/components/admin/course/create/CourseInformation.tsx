"use client"

import React, { useState } from 'react'

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CourseInformationProps {
    courseInfo: any,
    setCourseInfo: (courseInfo: any) => void,
    active: number,
    setActive: (active: number) => void,
    thumbnailPreview: string,
    setThumbnailPreview: (thumbnailPreview: string) => void,
    allCategories: string[]
}

const CourseInformation = ({ courseInfo, setCourseInfo, active, setActive, thumbnailPreview, setThumbnailPreview, allCategories }: CourseInformationProps) => {

    const handleChange = (e: any) => {
        setCourseInfo({ ...courseInfo, [e.target.id]: e.target.value })
    }

    const handleCategoryChange = (value: string) => {
        setCourseInfo({ ...courseInfo, categories: value })
    }

    const handleImageChange = async (e: any) => {

        const file = e.target.files[0];

        if (file) {
            const fileReader = new FileReader();

            fileReader.onload = () => {
                if (fileReader.readyState === 2) {
                    setThumbnailPreview(fileReader.result as string);
                    setCourseInfo({ ...courseInfo, thumbnail: fileReader.result as string })
                }
            };
            fileReader.readAsDataURL(file)
        }

    }

    const [dragging, setDragging] = useState(false);

    const handleDragOver = (e: any) => {
        e.preventDefault();
        setDragging(true);
    }

    const handleDragLeave = (e: any) => {
        e.preventDefault();
        setDragging(false);
    };

    const handleDrop = async (e: any) => {
        e.preventDefault();

        const file = e.dataTransfer.files?.[0];

        if (file) {
            const fileReader = new FileReader();

            fileReader.onload = () => {
                if (fileReader.readyState === 2) {
                    setThumbnailPreview(fileReader.result as string);
                    setCourseInfo({ ...courseInfo, thumbnail: fileReader.result as string })
                }
            };
            fileReader.readAsDataURL(file)
        }
    }

    const removeImage = () => {
        setThumbnailPreview("");
        setCourseInfo({ ...courseInfo, thumbnail: "" })
    };

    const handleSubmit = (e: any) => {
        e.preventDefault();

        if (!courseInfo?.thumbnail) {
            toast("Please provide the course thumbnail!")
        } else if (!courseInfo?.categories) {
            toast("Please select a course category!")
        } else {
            setActive(active + 1);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className='flex flex-col gap-[20px]'>
                {/* name */}
                <div className='flex flex-col gap-[10px]'>
                    <Label htmlFor="course_name">Course Name</Label>
                    <Input
                        id='name'
                        onChange={handleChange}
                        placeholder='How to use mascara'
                        type="text"
                        required
                        value={courseInfo?.name || ''}
                        className='border-gray-300 dark:border-gray-500'
                    />
                </div>

                {/* description */}
                <div className='flex flex-col gap-[10px]'>
                    <Label htmlFor="course_desc">Course Description</Label>
                    <textarea
                        id="description"
                        onChange={handleChange}
                        value={courseInfo?.description || ''}
                        rows={3}
                        required
                        placeholder="Unlock the secrets to flawless lashes with our comprehensive course on how to use mascara like a pro. Whether you're a beginner or looking to refine your makeup skills, this course is designed to teach you everything you need to know about applying mascara effectively and achieving stunning results."
                        className="w-full rounded-md border border-gray-300 shadow-md dark:border-gray-500 text-sm p-2 bg-transparent"
                    />
                </div>

                {/* category */}
                <div className='flex flex-col gap-[10px]'>
                    <Label htmlFor="course_category">Course Category</Label>
                    <Select
                        value={courseInfo?.categories || ''}
                        onValueChange={handleCategoryChange}
                    >
                        <SelectTrigger className="w-full cursor-pointer light-mode dark:dark-mode border-gray-300 dark:border-gray-500">
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent className='dark:bg-slate-800'>
                            {allCategories.map((category) => (
                                <SelectItem key={category} value={category} className='cursor-pointer hover:dark:bg-slate-600'>
                                    {category}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* price + estimated price */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-[20px]'>
                    <div className='flex flex-col gap-[10px]'>
                        <Label htmlFor="course_price">Course Price</Label>
                        <Input
                            id='price'
                            onChange={handleChange}
                            value={courseInfo?.price || ''}
                            placeholder='30'
                            required
                            type="number"
                            className='border-gray-300 dark:border-gray-500'
                        />
                    </div>
                    <div className='flex flex-col gap-[10px]'>
                        <Label htmlFor="course_estimated_price">Estimated Price</Label>
                        <Input
                            id='estimatedPrice'
                            onChange={handleChange}
                            value={courseInfo?.estimatedPrice || ''}
                            placeholder='30'
                            required
                            type="number"
                            className='border-gray-300 dark:border-gray-500'
                        />
                    </div>
                </div>

                {/* tags */}
                <div className='flex flex-col gap-[10px]'>
                    <Label htmlFor="course_tages">Course Tags</Label>
                    <Input
                        id='tags'
                        onChange={handleChange}
                        value={courseInfo?.tags || ''}
                        required
                        placeholder='Makeup Basics, Mascara Techiniques, Beauty Skills'
                        type="text"
                        className='border-gray-300 dark:border-gray-500'
                    />
                </div>

                {/* levels + demo url */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-[20px]'>
                    <div className='flex flex-col gap-[10px]'>
                        <Label htmlFor="course_level">Course Levels</Label>
                        <Input
                            id='level'
                            onChange={handleChange}
                            value={courseInfo?.level || ''}
                            required
                            placeholder='Beginner, Intermediate, Advanced, Specialized'
                            type="text"
                            className='border-gray-300 dark:border-gray-500'
                        />
                    </div>
                    <div className='flex flex-col gap-[10px]'>
                        <Label htmlFor="course_demo_url">Demo URL</Label>
                        <Input
                            id='demoUrl'
                            onChange={handleChange}
                            value={courseInfo?.demoUrl || ''}
                            required
                            placeholder='https://placeholder.com/demo-url'
                            type="text"
                            className='border-gray-300 dark:border-gray-500'
                        />
                    </div>
                </div>

                {/* thumbnail */}
                <div>
                    <Input
                        id="file-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                    />

                    <div
                        className={`mt-2 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 text-center transition-colors w-full md:w-[500px]
                                    ${dragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700'}
                                    hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20
                                    dark:text-gray-300`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {thumbnailPreview || courseInfo.thumbnail ? (
                            <>
                                <div className="rounded-lg relative overflow-hidden w-full shadow-md border dark:border-gray-700">
                                    <div className="w-full h-64">
                                        <Image
                                            src={thumbnailPreview || courseInfo?.thumbnail}
                                            alt="thumbnail"
                                            fill
                                            sizes="100vw"
                                            priority
                                            style={{ objectFit: 'contain' }}
                                            className="object-contain max-w-full max-h-full"
                                        />
                                    </div>
                                </div>
                                <div className="mt-2 flex justify-between items-center">
                                    <label
                                        htmlFor="file-input"
                                        className="text-xs text-blue-600 cursor-pointer dark:text-blue-400 hover:underline"
                                    >
                                        Change image
                                    </label>
                                    <p onClick={removeImage} className="text-xs text-red-500 dark:text-red-400 cursor-pointer hover:underline">
                                        Delete image
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className='text-center'>
                                <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                                <div className="text-sm font-medium">
                                    Drag and drop an image here, or{' '}
                                    <label htmlFor="file-input" className="text-blue-600 cursor-pointer dark:text-blue-400 hover:underline">
                                        browse
                                    </label>
                                </div>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Recommended size: 1920 x 600px. Max 5MB (JPG, PNG)
                                </p>
                            </div>
                        )}
                    </div>

                </div>

                {/* next button */}
                <div className='flex justify-end'>
                    <Button type='submit' className='w-[100px] bg-gray-200 hover:bg-blue-200 text-black rounded-[10px] cursor-pointer '>Next</Button>
                </div>

            </div>
        </form>
    )
}

export default CourseInformation