"use client"

import React, { useEffect, useState } from 'react'
import EditCourseInformation from "@/components/admin/course/edit/EditCourseInformation";
import EditCourseData from "@/components/admin/course/edit/EditCourseData";
import EditCourseContent from "@/components/admin/course/edit/EditCourseContent";
import EditCoursePreview from "@/components/admin/course/edit/EditCoursePreview";
import EditCourseOptions from "@/components/admin/course/edit/EditCourseOptions";

import { CourseInfoProps, BenefitsProps, PrerequisitesProps, CourseDataProps } from "@/type"

interface EditCourseProps {
    courseId: string;
    courseInfo: CourseInfoProps;
    setCourseInfo: (courseInfo: any) => void;
    benefits: BenefitsProps[];
    setBenefits: (benefits: { title: string }[]) => void;
    prerequisites: PrerequisitesProps[];
    setPrerequisites: (prerequisites: { title: string }[]) => void;
    courseData: CourseDataProps[];
    setCourseData: (newData: CourseDataProps[]) => void;
    thumbnailPreview: string;
    setThumbnailPreview: (thumbnailPreview: string) => void;

}

const EditCourse = ({
    courseId,
    courseInfo,
    setCourseInfo,
    benefits,
    setBenefits,
    prerequisites,
    setPrerequisites,
    courseData,
    setCourseData,
    thumbnailPreview,
    setThumbnailPreview
}: EditCourseProps) => {

    const [active, setActive] = useState(0);

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
                />
            case 1:
                return <EditCourseData
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
                    courseId={courseId}
                />
            default:
                return <EditCourseInformation
                    courseInfo={courseInfo}
                    setCourseInfo={setCourseInfo}
                    active={active}
                    setActive={setActive}
                    thumbnailPreview={thumbnailPreview}
                    setThumbnailPreview={setThumbnailPreview}
                />
        }
    }

    return (
        <div className='w-full p-[10px] flex flex-col gap-[30px] md:grid md:grid-cols-5 md:p-[50px]'>
            <div className='md:hidden'>
                <EditCourseOptions active={active} setActive={setActive} />
            </div>
            <div className='col-span-4'>
                {renderCreateCourseStep()}
            </div>
            <div className='hidden md:block md:col-span-1 '>
                <EditCourseOptions active={active} setActive={setActive} />
            </div>

        </div>
    )
}

export default EditCourse