import React from 'react'
import Layout from '@/components/Layout'
import Protected from '@/hooks/useProtected'
import AllNotifications from '@/components/notifications/AllNotifications'

const NotificationsPage = () => {
    return (
        <Protected>
            <Layout>
                <div className='container w-full'>
                    <AllNotifications />
                </div>
            </Layout>
        </Protected>
    )
}

export default NotificationsPage