"use client"

import React from 'react'
import { CartItem } from "@/type"
import OrderDetails from './OrderDetails'
import PaymentMethod from './PaymentMethod'

interface CheckoutInformationProps {
    cartItems: CartItem[];
    selectedPaymentMethod: 'paypal' | 'stripe' | 'zalopay';
    onPaymentMethodChange: (method: 'paypal' | 'stripe' | 'zalopay') => void;
}

const CheckoutInformation = ({
    cartItems,
    selectedPaymentMethod,
    onPaymentMethodChange
}: CheckoutInformationProps) => {
    return (
        <div className="space-y-8">
            {/* Order Details Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
                    Order Details
                </h2>
                <OrderDetails cartItems={cartItems} />
            </div>

            {/* Payment Method Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
                    Payment Method
                </h2>
                <PaymentMethod
                    selectedMethod={selectedPaymentMethod}
                    onMethodChange={onPaymentMethodChange}
                />
            </div>
        </div>
    )
}

export default CheckoutInformation