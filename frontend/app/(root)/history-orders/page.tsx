import React from 'react'
import Layout from '@/components/Layout'
import Protected from '@/hooks/useProtected'
import HistoryOrders from '@/components/historyOrders/HistoryOrders'

const HistoryOrdersPage = () => {
    return (
        <Protected>
            <Layout>
                <div className='container w-full'>
                    <HistoryOrders />
                </div>
            </Layout>
        </Protected>
    )
}

export default HistoryOrdersPage