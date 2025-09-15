"use client"

import React, { useState, useEffect } from 'react'
import CourseInformation from '@/components/tutor/course/create/CourseInformation';
import CourseOptions from '@/components/tutor/course/create/CourseOptions';
import CourseContent from '@/components/tutor/course/create/CourseContent';
import CoursePreview from '@/components/tutor/course/create/CoursePreview';
import CourseSteps from '@/components/tutor/course/create/CourseSteps';
import { useVideoUpload } from '@/hooks/useVideoUpload';

import { IBaseCategory, ICreateCourseInformation, ICreateBenefits, ICreatePrerequisites, ICreateSection } from "@/type"

const CreateCourse = () => {
    const [active, setActive] = useState(0);

    const [courseInfo, setCourseInfo] = useState<ICreateCourseInformation>({
        name: "",
        description: "",
        categories: [],
        price: null,
        estimatedPrice: null,
        tags: "",
        level: "",
        videoDemo: { public_id: "", url: "" },
        thumbnail: ""
    });

    const [thumbnailPreview, setThumbnailPreview] = useState<string>(""); // to display the image in UI before upload into cloudinary

    const [benefits, setBenefits] = useState<ICreateBenefits[]>([]);
    const [prerequisites, setPrerequisites] = useState<ICreatePrerequisites[]>([]);

    const [courseData, setCourseData] = useState<ICreateSection[]>([]);

    const [allCategories, setAllCategories] = useState<IBaseCategory[]>([]);
    const [allLevels, setAllLevels] = useState<string[]>([]);

    const handleGetAllLevels = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/levels`, {
                method: "GET",
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) {
                console.log("Fetching levels failed: ", data.message);
                return;
            } else {
                setAllLevels(data.levels);
            }
        } catch (error: any) {
            console.log(error.message);
        }
    }

    const handleGetAllCategories = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/category/get_all_categories`, {
                method: "GET",
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) {
                console.log("Fetching categories failed: ", data.message);
                return;
            } else {
                setAllCategories(data.categories);
            }
        } catch (error: any) {
            console.log(error.message);
        }
    }

    useEffect(() => {
        handleGetAllCategories();
        handleGetAllLevels();
    }, []);

    const [isUploadingDemo, setIsUploadingDemo] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const { uploadVideo, cancelCurrentUpload } = useVideoUpload();

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
                    allLevels={allLevels}
                    isUploadingDemo={isUploadingDemo}
                    setIsUploadingDemo={setIsUploadingDemo}
                    uploadProgress={uploadProgress}
                    setUploadProgress={setUploadProgress}
                    uploadVideo={uploadVideo}
                    cancelCurrentUpload={cancelCurrentUpload}
                />
            case 1:
                return <CourseOptions
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
                    allLevels={allLevels}
                    isUploadingDemo={isUploadingDemo}
                    setIsUploadingDemo={setIsUploadingDemo}
                    uploadProgress={uploadProgress}
                    setUploadProgress={setUploadProgress}
                    uploadVideo={uploadVideo}
                    cancelCurrentUpload={cancelCurrentUpload}
                />
        }
    }

    return (
        <div className='w-full p-[10px] flex flex-col gap-[30px] md:grid md:grid-cols-5 md:p-[50px]'>
            <div className='md:hidden'>
                <CourseSteps active={active} setActive={setActive} />
            </div>
            <div className='col-span-4'>
                {renderCreateCourseStep()}
            </div>
            <div className='hidden md:block md:col-span-1 '>
                <CourseSteps active={active} setActive={setActive} />
            </div>

        </div>
    )
}

export default CreateCourse