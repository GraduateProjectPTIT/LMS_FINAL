import React from 'react'
import { ParamsProps } from '@/type';
import PostEditForm from '@/components/admin/posts/PostEditForm';

const UpdatePostPage = async ({ params }: ParamsProps) => {

    const { id } = await params;

    return (
        <div className='p-4'>
            <PostEditForm postId={id} />
        </div>
    )
}

export default UpdatePostPage