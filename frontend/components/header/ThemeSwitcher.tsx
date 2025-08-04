'use client'

import React, { useState, useEffect } from 'react'
import { BiMoon, BiSun } from "react-icons/bi"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from 'framer-motion'

const ThemeSwitcher = () => {
    const { theme, setTheme, systemTheme } = useTheme();

    const currentTheme = theme === 'system' ? systemTheme : theme;

    return (
        <button
            className="flex items-center justify-center mx-4 cursor-pointer"
            onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle Theme"
        >
            <AnimatePresence mode="wait" initial={false}>
                {currentTheme === 'dark' ? (
                    <motion.span
                        key="sun"
                        initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
                        animate={{ rotate: 0, opacity: 1, scale: 1 }}
                        exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
                        transition={{ duration: 0.25 }}
                        style={{ display: 'inline-block' }}
                    >
                        <BiSun size={22} />
                    </motion.span>
                ) : (
                    <motion.span
                        key="moon"
                        initial={{ rotate: 90, opacity: 0, scale: 0.7 }}
                        animate={{ rotate: 0, opacity: 1, scale: 1 }}
                        exit={{ rotate: -90, opacity: 0, scale: 0.7 }}
                        transition={{ duration: 0.25 }}
                        style={{ display: 'inline-block' }}
                    >
                        <BiMoon size={22} />
                    </motion.span>
                )}
            </AnimatePresence>
        </button>
    );
}

export default ThemeSwitcher