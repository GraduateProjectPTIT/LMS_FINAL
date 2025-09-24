import React from 'react'
import Protected from '@/hooks/useProtected'
import Layout from '@/components/Layout'
import Cart from '@/components/cart/Cart'

const CartPage = () => {
    return (
        <Protected>
            <Layout>
                <Cart />
            </Layout>
        </Protected>
    )
}

export default CartPage