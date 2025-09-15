"use client"

import React from 'react'
import { User, FileText, ShieldCheck } from 'lucide-react'

interface RegisterStepProps {
    registrationStep: number;
}

const RegisterStep = ({ registrationStep }: RegisterStepProps) => {
    const steps = [
        {
            number: 1,
            title: "Account Type",
            icon: User
        },
        {
            number: 2,
            title: "Personal Info",
            icon: FileText
        },
        {
            number: 3,
            title: "Verification",
            icon: ShieldCheck
        },
    ];

    return (
        <div className="w-full md:max-w-lg mx-auto">
            <div className="flex items-center">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    // Step hiện tại hoặc đã qua được coi là "active"
                    const isActive = registrationStep >= step.number;
                    // Đường kẻ chỉ "active" khi step tiếp theo đã được kích hoạt
                    const isLineActive = registrationStep > step.number;

                    return (
                        <React.Fragment key={step.number}>
                            {/* Step Item (Circle + Text) */}
                            <div className="flex flex-col items-center">
                                <div className={`
                                    flex items-center justify-center w-8 h-8 md:w-12 md:h-12 rounded-full transition-colors duration-300
                                    ${isActive
                                        ? 'bg-blue-500 border-blue-500 text-white'
                                        : 'bg-gray-200 border-gray-300 text-slate-500'
                                    }
                                `}>
                                    <Icon className="w-4 h-4 md:w-6 md:h-6" />
                                </div>
                                <div className="hidden md:block mt-2 text-center">
                                    <div className={`
                                        text-sm font-medium transition-colors duration-300
                                        ${isActive ? 'text-blue-500' : 'text-slate-600 dark:text-slate-300'}
                                    `}>
                                        {step.title}
                                    </div>
                                </div>
                            </div>

                            {/* Connecting Line (chỉ render nếu không phải step cuối cùng) */}
                            {index < steps.length - 1 && (
                                <div className={`
                                    flex-grow h-0.5 mx-4 transition-colors duration-300
                                    ${isLineActive ? 'bg-blue-500' : 'bg-gray-300'}
                                `} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    )
}

export default RegisterStep;