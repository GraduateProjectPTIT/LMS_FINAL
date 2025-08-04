import React from 'react'
import CourseDetail from '@/components/course/CourseDetail';
import Protected from '@/hooks/useProtected';
import { ParamsProps } from '@/type';
import Layout from '@/components/Layout';

const CourseDetailPage = async ({ params }: ParamsProps) => {

    const { id } = await params;

    return (
        <Protected>
            <Layout>
                <div className='w-full h-full'>
                    <CourseDetail courseId={id} />
                </div>
            </Layout>
        </Protected>
    )
}

export default CourseDetailPage