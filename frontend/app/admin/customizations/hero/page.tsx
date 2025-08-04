import React from 'react'
import CustomizeHero from '@/components/admin/customization/CustomizeHero'

const CustomizeHeroPage = () => {
    return (
        <div className='w-full p-[10px] flex flex-col gap-[30px] md:p-[50px]'>
            <CustomizeHero />
        </div>
    )
}

export default CustomizeHeroPage