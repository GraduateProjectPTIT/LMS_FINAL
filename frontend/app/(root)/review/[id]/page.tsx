import React from 'react'
import { ParamsProps } from '@/type'
import Review from '@/components/review/Review'
import Protected from '@/hooks/useProtected'
import Layout from "@/components/Layout"

const ReviewPage = async ({ params }: ParamsProps) => {

    const { id } = await params;

    return (
        <Protected>
            <Layout>
                <Review courseId={id} />
            </Layout>
        </Protected>
    )
}

export default ReviewPage