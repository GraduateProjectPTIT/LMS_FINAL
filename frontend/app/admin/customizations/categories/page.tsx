import React from 'react'
import CustomizeCategories from '@/components/admin/customization/CustomizeCategories'

const CustomizeCategoriesPage = () => {
    return (
        <div className='w-full p-[10px] flex flex-col gap-[30px] md:p-[50px]'>
            <CustomizeCategories />
        </div>
    )
}

export default CustomizeCategoriesPage