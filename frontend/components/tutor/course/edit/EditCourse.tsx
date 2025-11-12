"use client"

import React, { useEffect, useState, useCallback } from 'react'
import EditCourseInformation from './EditCourseInformation';
import EditCourseOptions from './EditCourseOptions';
import EditCourseContent from './EditCourseContent';
import EditCoursePreview from './EditCoursePreview';
import EditCourseSteps from './EditCourseSteps';
import { useVideoUpload } from '@/hooks/useVideoUpload';
import toast from 'react-hot-toast';

const EditCourse = ({ courseId }: { courseId: string }) => {

    const [active, setActive] = useState(0);

    const [courseInfo, setCourseInfo] = useState<any>({});
    const [thumbnailPreview, setThumbnailPreview] = useState<string>(''); // sử dụng khi người dùng upload thumbnail mới

    const [allCategories, setAllCategories] = useState<any[]>([]);
    const [allLevels, setAllLevels] = useState<string[]>([]);

    const [benefits, setBenefits] = useState<any[]>([]);
    const [prerequisites, setPrerequisites] = useState<any[]>([]);

    const [courseData, setCourseData] = useState<any[]>([]);
    const [courseStatus, setCourseStatus] = useState<string>('');

    const [isUploadingDemo, setIsUploadingDemo] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const { uploadVideo, cancelCurrentUpload } = useVideoUpload();

    const handleFetchCourse = useCallback(async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/data/${courseId}`, {
                method: "GET",
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error("Fetching course data failed");
                console.log("Fetching course data failed: ", data.message);
                return;
            } else {
                setCourseInfo({
                    _id: data.course._id,
                    name: data.course.name,
                    overview: data.course.overview,
                    description: data.course.description,
                    categories: data.course.categories.map((cat: any) => cat._id),
                    price: data.course.price,
                    estimatedPrice: data.course.estimatedPrice,
                    thumbnail: data.course.thumbnail,
                    tags: data.course.tags,
                    level: data.course.level,
                    videoDemo: data.course.videoDemo,
                });
                setBenefits(data.course.benefits);
                setPrerequisites(data.course.prerequisites);
                setCourseData(data.course.courseData);
                setCourseStatus(data.course.status);
            }
        } catch (error: any) {
            console.log(error.message);
        }
    }, [courseId]);

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
        handleGetAllLevels();
        handleGetAllCategories();
        handleFetchCourse();
    }, [courseId, handleFetchCourse]);

    const renderCreateCourseStep = () => {
        switch (active) {
            case 0:
                return <EditCourseInformation
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
                return <EditCourseOptions
                    benefits={benefits}
                    setBenefits={setBenefits}
                    prerequisites={prerequisites}
                    setPrerequisites={setPrerequisites}
                    active={active}
                    setActive={setActive}
                />
            case 2:
                return <EditCourseContent
                    active={active}
                    setActive={setActive}
                    courseData={courseData}
                    setCourseData={setCourseData}
                />
            case 3:
                return <EditCoursePreview
                    active={active}
                    setActive={setActive}
                    courseInfo={courseInfo}
                    benefits={benefits}
                    prerequisites={prerequisites}
                    courseData={courseData}
                    thumbnailPreview={thumbnailPreview}
                    setThumbnailPreview={setThumbnailPreview}
                    courseId={courseInfo._id}
                    courseStatus={courseStatus}
                    setCourseStatus={setCourseStatus}
                />
            default:
                return <EditCourseInformation
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
                <EditCourseSteps active={active} setActive={setActive} />
            </div>
            <div className='col-span-4'>
                {renderCreateCourseStep()}
            </div>
            <div className='hidden md:block md:col-span-1 '>
                <EditCourseSteps active={active} setActive={setActive} />
            </div>

        </div>
    )
}

export default EditCourse