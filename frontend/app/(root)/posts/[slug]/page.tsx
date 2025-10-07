import React from 'react'
import PostContent from '@/components/postDetail/PostContent'
import Layout from '@/components/Layout'
import { SlugParamsProps } from '@/type'

const PostDetailPage = async ({ params }: SlugParamsProps) => {

    const { slug } = await params;

    return (
        <Layout>
            <PostContent slug={slug} />
        </Layout>
    )
}

export default PostDetailPage