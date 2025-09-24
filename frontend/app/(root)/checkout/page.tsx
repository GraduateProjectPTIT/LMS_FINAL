import React from 'react'
import Protected from '@/hooks/useProtected'
import Layout from '@/components/Layout'
import Checkout from '@/components/checkout/Checkout'

const CheckoutPage = () => {
    return (
        <Protected>
            <Checkout />
        </Protected>
    )
}

export default CheckoutPage