import Layout from '@/components/Layout'
import MyCourses from '@/components/myCourses/MyCourses'
import Protected from '@/hooks/useProtected'
import React from 'react'

const MyCoursesPage = () => {
    return (
        <Protected>
            <Layout>
                <div className='container w-full'>
                    <MyCourses />
                </div>
            </Layout>
        </Protected>
    )
}

export default MyCoursesPage