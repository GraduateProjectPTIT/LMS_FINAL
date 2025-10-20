"use client"

import Layout from '@/components/Layout'
import Profile from '@/components/profile/Profile'
import SidebarProfile from '@/components/profile/SidebarProfile'
import Protected from '@/hooks/useProtected'
import { RootState } from '@/redux/store'
import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'next/navigation'

const ProfilePage = () => {

    const { currentUser } = useSelector((state: RootState) => state.user);
    const searchParams = useSearchParams();
    const [activeSection, setActiveSection] = useState("personal_info");

    useEffect(() => {
        const section = searchParams?.get('section');
        if (section) {
            setActiveSection(section);
        }
    }, [searchParams]);

    return (
        <Protected>
            <Layout>
                <div className='container w-full'>
                    <div className='flex flex-col  md:flex-row py-[20px] w-full'>
                        <SidebarProfile activeSection={activeSection} setActiveSection={setActiveSection} />
                        <Profile user={currentUser} activeSection={activeSection} />
                    </div>
                </div>
            </Layout>
        </Protected>

    )
}

export default ProfilePage