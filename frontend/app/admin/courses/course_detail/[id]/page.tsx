import CourseDetail from '@/components/admin/course/detail/CourseDetail';
import React from 'react'

const CourseDetailPage = async ({ params }: { params: { id: string } }) => {

    const { id } = await params;

    return (
        <div className='flex-1 h-screen max-h-[1473px]'>
            <CourseDetail courseId={id} />
        </div>
    )
}

export default CourseDetailPage