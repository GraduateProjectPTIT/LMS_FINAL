import React from 'react'
import { ParamsProps } from '@/type';
import Protected from '@/hooks/useProtected';
import CourseEnroll from '@/components/courseEnroll/CourseEnroll';
import Header from '@/sections/Header';

const CourseEnrollPage = async ({ params }: ParamsProps) => {

    const { id } = await params;

    return (
        <Protected>
            <CourseEnroll courseId={id} />
        </Protected>
    )
}

export default CourseEnrollPage