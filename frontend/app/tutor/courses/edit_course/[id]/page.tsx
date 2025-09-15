import React from "react"
import { ParamsProps } from '@/type';

import EditCourse from "@/components/tutor/course/edit/EditCourse"

const EditCoursePage = async ({ params }: ParamsProps) => {

    const { id } = await params;

    return (
        <div className='flex-1 h-screen max-h-[1473px]'>
            <EditCourse courseId={id} />
        </div>
    )
}

export default EditCoursePage