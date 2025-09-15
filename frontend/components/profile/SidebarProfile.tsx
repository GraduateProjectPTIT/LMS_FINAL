"use client"

import React, { useState } from 'react'

import { FaUserAlt } from "react-icons/fa";
import { GoPasskeyFill } from "react-icons/go";
import { MdNotificationsActive } from "react-icons/md";
import { SiGoogleclassroom } from "react-icons/si";
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { RiArrowDownSLine, RiArrowUpSLine } from "react-icons/ri";
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import { useRouter } from 'next/navigation';

const sidebarLinks = [
    {
        label: 'Personal Info',
        icon: <FaUserAlt />,
        value: 'personal_info'
    },
    {
        label: 'Emails & Password',
        icon: <GoPasskeyFill />,
        value: 'authentication_change'
    },
    {
        label: 'Notifications',
        icon: <MdNotificationsActive />,
        value: 'notifications'
    },
    {
        label: 'Enroll Courses',
        icon: <SiGoogleclassroom />,
        value: 'enroll_courses'
    }
]

interface SidebarProps {
    activeSection: string;
    setActiveSection: (section: string) => void;
}


const SidebarProfile = ({ activeSection, setActiveSection }: SidebarProps) => {

    const router = useRouter();

    const [isOpen, setIsOpen] = useState(false);

    const handleClick = (section: string) => {
        setActiveSection(section);
        setIsOpen(false);
    }

    const activeItem = sidebarLinks.find(item => item.value === activeSection) || sidebarLinks[0];

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    }

    return (
        <section className='flex flex-col w-full md:w-[280px] gap-[30px] h-full md:h-screen md:max-h-[1200px] theme-mode p-2 md:p-6 border max-md:border-none border-gray-300 dark:border-slate-700 border-r-0 rounded-l-[24px] '>

            <h2 className='text-xl md:text-2xl font-bold'>Profile Management</h2>

            <div className='hidden md:flex md:flex-col gap-3'>
                {sidebarLinks.map((item, index) => (
                    <motion.div
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <button
                            className={`w-full h-[50px] flex items-center justify-start gap-3 pl-4 text-base font-medium rounded-xl transition-all duration-200 cursor-pointer ${activeSection === item.value
                                ? "bg-blue-500 dark:bg-blue-800 text-white shadow-md"
                                : "bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300"
                                }`}
                            onClick={() => handleClick(item.value)}
                        >
                            <span className={`${activeSection === item.value ? "text-white" : "text-gray-500 dark:text-gray-400"}`}>
                                {item.icon}
                            </span>
                            {item.label}
                        </button>
                    </motion.div>
                ))}
            </div>

            <div className='flex flex-col gap-2 md:hidden'>
                <motion.div
                    whileTap={{ scale: 0.98 }}
                >
                    <button
                        className={`w-full h-[50px] flex items-center justify-between gap-3 px-4 text-base font-medium rounded-xl transition-all duration-200 cursor-pointer bg-blue-500 dark:bg-blue-800 text-white shadow-md`}
                        onClick={toggleDropdown}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-white">
                                {activeItem.icon}
                            </span>
                            {activeItem.label}
                        </div>
                        {isOpen ?
                            <RiArrowUpSLine className="ml-2 text-xl" /> :
                            <RiArrowDownSLine className="ml-2 text-xl" />
                        }
                    </button>
                </motion.div>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            className="flex flex-col gap-2"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {sidebarLinks
                                .filter(item => item.value !== activeSection)
                                .map((item, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2, delay: index * 0.05 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Button
                                            className={`w-full h-[50px] flex items-center justify-start gap-3 text-base font-medium rounded-xl transition-all duration-200 cursor-pointer bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300`}
                                            onClick={() => handleClick(item.value)}
                                        >
                                            <span className="text-gray-500 dark:text-gray-400">
                                                {item.icon}
                                            </span>
                                            {item.label}
                                        </Button>
                                    </motion.div>
                                ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="mt-auto hidden md:block">
                <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border-theme">
                    <h3 className="font-semibold mb-2">Need Help?</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Have questions about your profile settings?</p>
                    <Button variant="outline" className="w-full text-sm cursor-pointer hover:bg-gray-300 dark:hover:bg-slate-600">Contact Support</Button>
                </div>
            </div>
        </section>
    );
}

export default SidebarProfile