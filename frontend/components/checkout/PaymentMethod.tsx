"use client"

import React from 'react'
import { Check } from 'lucide-react'
import { FaCcPaypal, FaCcStripe } from "react-icons/fa";
import { SiZalo } from "react-icons/si";

interface PaymentMethodProps {
    selectedMethod: 'paypal' | 'stripe';
    onMethodChange: (method: 'paypal' | 'stripe') => void;
}

const PaymentMethod = ({ selectedMethod, onMethodChange }: PaymentMethodProps) => {
    const paymentMethods = [
        {
            id: 'paypal' as const,
            name: 'PayPal',
            description: 'Pay securely with your PayPal account',
            icon: <FaCcPaypal size={24} />,
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            borderColor: 'border-blue-200 dark:border-blue-800',
            textColor: 'text-blue-800 dark:text-blue-200'
        },
        {
            id: 'stripe' as const,
            name: 'Stripe',
            description: 'Visa, Mastercard, American Express',
            icon: <FaCcStripe size={24} />,
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            borderColor: 'border-blue-200 dark:border-blue-800',
            textColor: 'text-blue-800 dark:text-blue-200'
        }
    ];

    return (
        <div className="space-y-4">
            {paymentMethods.map((method) => (
                <div
                    key={method.id}
                    className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${selectedMethod === method.id
                        ? `${method.borderColor} ${method.bgColor}`
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                    onClick={() => onMethodChange(method.id)}
                >
                    {/* Selection Indicator */}
                    {selectedMethod === method.id && (
                        <div className={`absolute top-4 right-4 w-6 h-6 ${method.bgColor} ${method.borderColor} border-2 rounded-full flex items-center justify-center`}>
                            <Check size={14} className={method.textColor} />
                        </div>
                    )}

                    {/* Method Header */}
                    <div className="flex items-center gap-4 mb-3">
                        <div className={`p-2 rounded-lg ${method.bgColor} ${method.textColor}`}>
                            {method.icon}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-800 dark:text-white">
                                    {method.name}
                                </h3>

                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {method.description}
                            </p>
                        </div>
                    </div>

                    {/* Additional Info for Selected Method */}
                    {selectedMethod === method.id && (
                        <div className={`mt-3 p-3 ${method.bgColor} rounded-lg`}>
                            {method.id === 'paypal' && (
                                <p className={`text-sm ${method.textColor}`}>
                                    You will be redirected to PayPal to complete your payment securely.
                                </p>
                            )}
                            {method.id === 'stripe' && (
                                <p className={`text-sm ${method.textColor}`}>
                                    Enter your card details on the next step. All transactions are encrypted.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

export default PaymentMethod