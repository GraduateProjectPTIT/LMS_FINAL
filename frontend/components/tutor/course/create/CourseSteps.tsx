"use client"

import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import { StepButton, useMediaQuery } from '@mui/material';
import { Button } from '@/components/ui/button';

interface CourseStepsProps {
    active: number;
    setActive: (index: number) => void;
}

const steps = [
    {
        label: 'Couse Information',
    },
    {
        label: 'Course Data',
    },
    {
        label: 'Course Content',
    },
    {
        label: 'Course Preview',
    },
];

const CourseSteps = ({ active, setActive }: CourseStepsProps) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isMobile = useMediaQuery('(max-width:758px)');

    const handleBack = () => {
        setActive(active - 1);
    };

    if (!mounted) {
        return null;
    }

    return (
        <>
            <Box sx={{ maxWidth: isMobile ? '100%' : 400 }} className="text-black dark:text-white">
                <Stepper
                    activeStep={active}
                    orientation={isMobile ? "horizontal" : "vertical"}
                    alternativeLabel={isMobile ? true : false}
                    className="text-black dark:text-white"
                    sx={{
                        '& .MuiStepIcon-root': {
                            color: 'rgba(0, 0, 0, 0.3)',
                            '&.Mui-active': {
                                color: '#1976d2',
                            },
                            '&.Mui-completed': {
                                color: '#4caf50',
                            },
                        },
                        '& .MuiStepIcon-text': {
                            fill: '#ffffff',
                        },
                        '& .MuiStepLabel-label': {
                            color: 'inherit',
                        },
                    }}
                >
                    {steps.map((step, index) => (
                        <Step key={index}>
                            {isMobile ? (
                                <StepButton className="">
                                    <span className="text-black dark:text-white">{step.label}</span>
                                </StepButton>
                            ) : (
                                <>
                                    <StepLabel className="text-black dark:text-white">
                                        <span className="text-black dark:text-white">{step.label}</span>
                                    </StepLabel>
                                    <StepContent>
                                        {
                                            active !== 0 && (
                                                <Button
                                                    className='cursor-pointer text-[14px] bg-gray-200 text-black hover:bg-gray-300 dark:hover:bg-slate-400 rounded-[15px]'
                                                    onClick={handleBack}
                                                    disabled={active === 0}
                                                >
                                                    Back
                                                </Button>
                                            )
                                        }
                                    </StepContent>
                                </>
                            )}
                        </Step>
                    ))}
                </Stepper>
            </Box>
        </>
    )
}

export default CourseSteps