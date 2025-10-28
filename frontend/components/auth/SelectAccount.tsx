"use client"

import React from 'react'
import Link from 'next/link';
import { FaChalkboardTeacher, FaUserGraduate } from "react-icons/fa"

interface SelectAccountProps {
    selectedRole: 'student' | 'tutor' | null;
    setSelectedRole: (role: 'student' | 'tutor') => void;
    setRegistrationStep: (step: number) => void;
}

const SelectAccount = ({ selectedRole, setSelectedRole, setRegistrationStep }: SelectAccountProps) => {
    const handleRoleSelect = (role: 'student' | 'tutor') => {
        setSelectedRole(role);
    };

    const handleNext = () => {
        if (selectedRole) {
            setRegistrationStep(2);
        }
    };

    return (
        <div className="w-full md:max-w-lg mx-auto space-y-6">
            <div className="text-center">
                <h2 className="text-xl md:text-2xl font-semibold mb-2">Choose Account Type</h2>
                <p className="text-gray-500 dark:text-gray-300">
                    Select whether you want to register as a student or tutor
                </p>
            </div>

            <div className="space-y-4">
                <div
                    onClick={() => handleRoleSelect('student')}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${selectedRole === 'student'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-gray-600 hover:border-slate-300'
                        }`}
                >
                    <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-full ${selectedRole === 'student'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300'
                            }`}>
                            <FaUserGraduate className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold">Student</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Learn from experienced tutors and improve your skills
                            </p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${selectedRole === 'student'
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300 dark:border-gray-600'
                            }`}>
                            {selectedRole === 'student' && (
                                <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                            )}
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => handleRoleSelect('tutor')}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${selectedRole === 'tutor'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-gray-600 hover:border-slate-300'
                        }`}
                >
                    <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-full ${selectedRole === 'tutor'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300'
                            }`}>
                            <FaChalkboardTeacher className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold">Tutor</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Share your expertise and teach students online
                            </p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${selectedRole === 'tutor'
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300 dark:border-gray-600'
                            }`}>
                            {selectedRole === 'tutor' && (
                                <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Next Button */}
            <button
                onClick={handleNext}
                disabled={!selectedRole}
                className="button-disabled"
            >
                Continue
            </button>

            {/* Separator and Login Section */}
            <div className="space-y-4">
                <div className="flex items-center w-full">
                    <div className="flex-1 border-t-[2px] bg-slate-500 dark:bg-slate-50"></div>
                    <span className="px-4 text-sm text-gray-500 dark:text-gray-400">
                        or
                    </span>
                    <div className="flex-1 border-t-[2px] bg-slate-500 dark:bg-slate-50"></div>
                </div>

                <div className="text-center space-y-3">
                    <p className="text-gray-600 dark:text-gray-300">
                        Already have an account?
                    </p>
                    <Link href='/login'>
                        <button
                            className="button"
                        >
                            Sign In
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default SelectAccount