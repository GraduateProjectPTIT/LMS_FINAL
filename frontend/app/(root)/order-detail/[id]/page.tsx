import React from 'react'
import { ParamsProps } from '@/type';
import Layout from '@/components/Layout';
import OrderDetail from '@/components/orderDetail/OrderDetail';

const OrderDetailPage = async ({ params }: ParamsProps) => {

    const { id } = await params;

    return (
        <Layout>
            <div className='w-full h-full'>
                <OrderDetail orderId={id} />
            </div>
        </Layout>
    )
}

export default OrderDetailPage