import React from 'react'
import { ParamsProps } from '@/type'
import Protected from '@/hooks/useProtected'
import StudentsData from '@/components/tutor/data/students/StudentsData'

const TutorDataStudentsPage = async ({ params }: ParamsProps) => {

    const { id } = await params;

    return (
        <Protected>
            <div className='flex-1 h-screen max-h-[1473px] p-4'>
                <StudentsData courseId={id} />
            </div>
        </Protected>
    )
}

export default TutorDataStudentsPage