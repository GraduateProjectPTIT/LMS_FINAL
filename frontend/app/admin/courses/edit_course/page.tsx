"use client"

import React, { useEffect, useState } from 'react'
import { CourseInfoProps, BenefitsProps, PrerequisitesProps, CourseDataProps } from "@/type"
import EditCourse from '@/components/admin/course/edit/EditCourse'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { DataTable } from "@/components/ui/data-table";

import {
    useReactTable,
    getCoreRowModel,
    ColumnDef,
} from "@tanstack/react-table"

interface CourseSearchResult {
    _id: string;
    name: string;
    level: string;
    price: number;
    categories: string;
    createdAt: string;
}

const EditCoursePage = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<CourseSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [courseId, setCourseId] = useState("");
    const [courseInfo, setCourseInfo] = useState<CourseInfoProps>({
        name: "",
        description: "",
        categories: "",
        price: 0,
        estimatedPrice: 0,
        tags: "",
        level: "",
        demoUrl: "",
        thumbnail: "",
    });

    const [thumbnailPreview, setThumbnailPreview] = useState<string>(""); // to display the image in UI before upload into cloudinary

    const [benefits, setBenefits] = useState<BenefitsProps[]>([]);
    const [prerequisites, setPrerequisites] = useState<PrerequisitesProps[]>([]);

    const [courseData, setCourseData] = useState<CourseDataProps[]>([]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/search_course?query=${encodeURIComponent(searchQuery)}`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            const data = await res.json();
            if (!res.ok) {
                console.log("Failed to search courses");
                setSearchResults([]);
            } else {
                setSearchResults(data.courses);
            }
        } catch (error: any) {
            console.log(error.message);
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGetCourseById = async (id: string) => {
        try {
            setIsLoading(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/get_course_content/${id}`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            const data = await res.json();
            if (!res.ok) {
                console.log("Failed to get course by id");
                return;
            } else {
                setCourseId(id);
                setCourseInfo({
                    name: data.course?.name,
                    description: data.course?.description,
                    categories: data.course?.categories,
                    price: data.course?.price,
                    estimatedPrice: data.course?.estimatedPrice,
                    tags: data.course?.tags,
                    level: data.course?.level,
                    demoUrl: data.course?.demoUrl,
                    thumbnail: data.course?.thumbnail?.url,
                });
                setThumbnailPreview(data.course?.thumbnail?.url || "");
                setBenefits(data.course.benefits);
                setPrerequisites(data.course.prerequisites);
                setCourseData(data.course.courseData);
            }
        } catch (error: any) {
            console.log(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Enter key press in search input
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Reset selection and go back to search
    const handleBackToSearch = () => {
        setCourseId("");
        setSearchResults([]);
        setSearchQuery("");
    };

    const columns: ColumnDef<CourseSearchResult>[] = [
        {
            accessorKey: "name",
            header: "Course Name",
            cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
        },
        {
            accessorKey: "categories",
            header: "Category",
        },
        {
            accessorKey: "level",
            header: "Level",
        },
        {
            accessorKey: "price",
            header: "Price",
            cell: ({ row }) => `$${row.original.price}`,
        },
        {
            accessorKey: "createdAt",
            header: "Created Date",
            cell: ({ row }) => {
                const date = new Date(row.original.createdAt);
                return date.toLocaleDateString();
            },
        },
    ];

    const table = useReactTable({
        data: searchResults,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className='w-full p-[10px] flex flex-col gap-[30px] md:p-[50px]'>
            {!courseId ? (
                <div className="space-y-6">
                    <h1 className="text-2xl font-bold">Edit Course</h1>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Input
                                type="text"
                                placeholder="Search courses by name, category or level..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="pl-10 border-gray-300 dark:border-gray-500"
                            />
                            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        </div>
                        <Button
                            onClick={handleSearch}
                            disabled={isLoading}
                            className='bg-gray-300 hover:bg-gray-400 text-black rounded-[10px] cursor-pointer'
                        >
                            {isLoading ? "Searching..." : "Search"}
                        </Button>
                    </div>

                    {searchResults.length > 0 && (
                        <DataTable
                            table={table}
                            columns={columns}
                            data={searchResults}
                            onRowClick={(row) => handleGetCourseById(row._id)}
                        />


                    )}

                    {searchResults.length === 0 && searchQuery && !isLoading && (
                        <div className="text-center p-8 text-gray-500">
                            No courses found. Try different search terms.
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <Button onClick={handleBackToSearch} className='md:hidden cursor-pointer text-[14px] bg-gray-200 text-black hover:bg-gray-300 dark:hover:bg-slate-400 rounded-[15px]'>
                        Back to Search
                    </Button>
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Editing Course: {courseInfo.name}</h1>
                        <Button onClick={handleBackToSearch} className='hidden md:block cursor-pointer text-[14px] bg-gray-200 text-black hover:bg-gray-300 dark:hover:bg-slate-400 rounded-[15px]'>
                            Back to Search
                        </Button>
                    </div>
                    <EditCourse
                        courseId={courseId}
                        courseInfo={courseInfo}
                        setCourseInfo={setCourseInfo}
                        benefits={benefits}
                        setBenefits={setBenefits}
                        prerequisites={prerequisites}
                        setPrerequisites={setPrerequisites}
                        courseData={courseData}
                        setCourseData={setCourseData}
                        thumbnailPreview={thumbnailPreview}
                        setThumbnailPreview={setThumbnailPreview}
                    />
                </div>
            )}
        </div>
    )
}

export default EditCoursePage