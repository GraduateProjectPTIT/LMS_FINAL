import React from 'react'
import { ParamsProps } from '@/type'
import Layout from '@/components/Layout'
import TutorOverviewData from '@/components/tutorOverview/TutorOverviewData'

const TutorOverviewPage = async ({ params }: ParamsProps) => {

    const { id } = await params;

    return (
        <Layout>
            <div className='w-full h-full'>
                <TutorOverviewData tutorId={id} />
            </div>
        </Layout>
    )
}

export default TutorOverviewPage