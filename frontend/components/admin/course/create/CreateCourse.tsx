"use client"

import React, { useState, useEffect } from 'react'
import CourseInformation from '@/components/admin/course/create/CourseInformation';
import CourseData from '@/components/admin/course/create/CourseData';
import CourseContent from '@/components/admin/course/create/CourseContent';
import CoursePreview from '@/components/admin/course/create/CoursePreview';
import CourseOptions from '@/components/admin/course/create/CourseOptions';

import { CourseInfoProps, BenefitsProps, PrerequisitesProps, CourseDataProps } from "@/type"

const CreateCourse = () => {
    const [active, setActive] = useState(0);

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

    const [allCategories, setAllCategories] = useState([]);

    const handleGetAllCategories = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/layout/get_layout/Categories`, {
                method: "GET",
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) {
                console.log("Fetching categories failed: ", data.message);
                return;
            } else {
                const categoryTitle = data.layout.categories.map((category: { title: string }) => category.title);
                setAllCategories(categoryTitle);
            }
        } catch (error: any) {
            console.log(error.message);
        }
    }

    useEffect(() => {
        handleGetAllCategories();
    }, [])

    const renderCreateCourseStep = () => {
        switch (active) {
            case 0:
                return <CourseInformation
                    courseInfo={courseInfo}
                    setCourseInfo={setCourseInfo}
                    active={active}
                    setActive={setActive}
                    thumbnailPreview={thumbnailPreview}
                    setThumbnailPreview={setThumbnailPreview}
                    allCategories={allCategories}
                />
            case 1:
                return <CourseData
                    benefits={benefits}
                    setBenefits={setBenefits}
                    prerequisites={prerequisites}
                    setPrerequisites={setPrerequisites}
                    active={active}
                    setActive={setActive}
                />
            case 2:
                return <CourseContent
                    active={active}
                    setActive={setActive}
                    courseData={courseData}
                    setCourseData={setCourseData}
                />
            case 3:
                return <CoursePreview
                    active={active}
                    setActive={setActive}
                    courseInfo={courseInfo}
                    benefits={benefits}
                    prerequisites={prerequisites}
                    courseData={courseData}
                    thumbnailPreview={thumbnailPreview}
                    setThumbnailPreview={setThumbnailPreview}
                />
            default:
                return <CourseInformation
                    courseInfo={courseInfo}
                    setCourseInfo={setCourseInfo}
                    active={active}
                    setActive={setActive}
                    thumbnailPreview={thumbnailPreview}
                    setThumbnailPreview={setThumbnailPreview}
                    allCategories={allCategories}
                />
        }
    }

    return (
        <div className='w-full p-[10px] flex flex-col gap-[30px] md:grid md:grid-cols-5 md:p-[50px]'>
            <div className='md:hidden'>
                <CourseOptions active={active} setActive={setActive} />
            </div>
            <div className='col-span-4'>
                {renderCreateCourseStep()}
            </div>
            <div className='hidden md:block md:col-span-1 '>
                <CourseOptions active={active} setActive={setActive} />
            </div>

        </div>
    )
}

export default CreateCourse