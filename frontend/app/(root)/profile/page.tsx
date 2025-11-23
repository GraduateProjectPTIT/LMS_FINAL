"use client"

import Layout from '@/components/Layout'
import Profile from '@/components/profile/Profile'
import SidebarProfile from '@/components/profile/SidebarProfile'
import DeleteAccountModal from '@/components/profile/DeleteAccountModal'
import Protected from '@/hooks/useProtected'
import { RootState } from '@/redux/store'
import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useSearchParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { signOutSuccess } from "@/redux/user/userSlice";
import { clearNotificationsState } from "@/redux/notification/notificationSlice";
import { clearAll } from "@/redux/cart/cartSlice";

const ProfilePage = () => {
    const { currentUser } = useSelector((state: RootState) => state.user);
    const searchParams = useSearchParams();
    const router = useRouter();
    const dispatch = useDispatch();

    const [activeSection, setActiveSection] = useState("personal_info");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        const section = searchParams?.get('section');
        if (section) {
            setActiveSection(section);
        }
    }, [searchParams]);

    const handleDeleteAccount = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/user/me`, {
                method: 'DELETE',
                credentials: 'include',
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || 'Failed to delete account');
                return;
            }

            toast.success('Account deleted successfully');

            // Clear user data and redirect to home
            dispatch(signOutSuccess());
            dispatch(clearNotificationsState());
            dispatch(clearAll());
            setIsDeleteModalOpen(false);
            router.push('/');
        } catch (error) {
            console.error('Delete account error:', error);
            toast.error('An error occurred while deleting your account');
        }
    };

    return (
        <Protected>
            <Layout>
                <div className='container w-full'>
                    <div className='flex flex-col md:flex-row py-[20px] w-full'>
                        <SidebarProfile
                            activeSection={activeSection}
                            setActiveSection={setActiveSection}
                            onDeleteAccount={() => setIsDeleteModalOpen(true)}
                        />
                        <Profile user={currentUser} activeSection={activeSection} />
                    </div>
                </div>

                {/* Delete Account Modal */}
                <DeleteAccountModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleDeleteAccount}
                    userName={currentUser?.name || currentUser?.username}
                    userEmail={currentUser?.email}
                />
            </Layout>
        </Protected>
    )
}

export default ProfilePage