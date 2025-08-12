import React from 'react'
import CourseOverview from '@/components/courseOverview/CourseOverview';
import { ParamsProps } from '@/type';
import Layout from '@/components/Layout';

const CourseOverviewPage = async ({ params }: ParamsProps) => {

    const { id } = await params;

    return (
        <Layout>
            <div className='w-full h-full'>
                <CourseOverview courseId={id} />
            </div>
        </Layout>
    )
}

export default CourseOverviewPage