"use client"

import React, { useState } from 'react'
import RegisterStep from "@/components/auth/RegisterStep";
import SelectAccount from "@/components/auth/SelectAccount";
import RegisterForm from "@/components/auth/RegisterForm";
import VerifyAccount from "@/components/auth/VerifyAccount";

const SignUpPage = () => {
    const [registrationStep, setRegistrationStep] = useState(1);
    const [selectedRole, setSelectedRole] = useState<'student' | 'tutor' | null>(null);
    const [userRegisteredEmail, setUserRegisteredEmail] = useState<string | null>(null);

    const renderCurrentStep = () => {
        switch (registrationStep) {
            case 1:
                return (
                    <SelectAccount
                        selectedRole={selectedRole}
                        setSelectedRole={setSelectedRole}
                        setRegistrationStep={setRegistrationStep}
                    />
                );
            case 2:
                return (
                    <RegisterForm
                        selectedRole={selectedRole}
                        setRegistrationStep={setRegistrationStep}
                        setUserRegisteredEmail={setUserRegisteredEmail}
                    />
                );
            case 3:
                return (
                    <VerifyAccount
                        email={userRegisteredEmail}
                        setRegistrationStep={setRegistrationStep}
                    />
                )
            default:
                return null;
        }
    };

    return (
        <div className='theme-mode flex flex-col justify-center items-center w-full p-[20px] md:py-[60px] gap-8'>
            <RegisterStep registrationStep={registrationStep} />
            <div className="w-full flex justify-center">
                {renderCurrentStep()}
            </div>
        </div>
    )
}

export default SignUpPage