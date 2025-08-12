"use client"

import React, { useState } from 'react'

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import { FiPlusCircle } from "react-icons/fi";
import { Separator } from '@/components/ui/separator';

interface EditCourseDataProps {
    active: number,
    setActive: (active: number) => void,
    benefits: { title: string }[],
    setBenefits: (benefits: { title: string }[]) => void,
    prerequisites: { title: string }[],
    setPrerequisites: (prerequisites: { title: string }[]) => void
}

const EditCourseData = ({ active, setActive, benefits, setBenefits, prerequisites, setPrerequisites }: EditCourseDataProps) => {

    const [newBenefit, setNewBenefit] = useState("");
    const [newPrerequisite, setNewPrerequisite] = useState("");

    const handleChangeBenefitsInput = (e: any) => {
        setNewBenefit(e.target.value);
    }

    const handleChangePrerequisitesInput = (e: any) => {
        setNewPrerequisite(e.target.value);
    }

    const handleAddBenefit = () => {
        if (newBenefit.trim() === "") {
            toast.error("Benefit cannot be empty");
            return;
        }

        setBenefits(
            [...benefits,
            {
                title: newBenefit.trim()
            }])

        setNewBenefit("");
    };

    const handleRemoveBenefit = (index: number) => {
        const updatedBenefits = [...benefits];
        updatedBenefits.splice(index, 1);
        setBenefits(updatedBenefits);
    };

    const handleAddPrerequisite = () => {
        if (newPrerequisite.trim() === "") {
            toast.error("Prerequisite cannot be empty");
            return;
        }

        setPrerequisites(
            [...prerequisites,
            {
                title: newPrerequisite.trim()
            }])

        setNewPrerequisite("");
    };

    const handleRemovePrerequisite = (index: number) => {
        const updatedPrerequisites = [...prerequisites];
        updatedPrerequisites.splice(index, 1);
        setPrerequisites(updatedPrerequisites);
    };

    const handleBackButton = () => {
        setActive(active - 1);
    }

    const handleNextButton = () => {
        if (benefits.length === 0 || prerequisites.length === 0) {
            toast.error("Please add at least one benefit and prerequisite");
            return;
        }

        if (
            benefits[benefits.length - 1]?.title !== "" &&
            prerequisites[prerequisites.length - 1]?.title !== ""
        ) {
            setActive(active + 1);
        } else {
            toast.error("Please fill all fields before proceeding to the next step");
        }
    };

    return (
        <div className="w-full flex flex-col gap-8">
            {/* benefits */}
            <div className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold text-black dark:text-white">Course Benefits</h2>
                <Label className="text-gray-500">
                    Specify what students will gain from taking this course
                </Label>
                <div className='flex flex-col gap-[20px]'>
                    {
                        benefits.map((benefit, index) => (
                            <div key={index} className='flex gap-[20px]'>
                                <span className='w-full py-[5px] px-[10px] border border-gray-200 dark:border-slate-500 rounded-[10px]'>
                                    {benefit?.title}
                                </span>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleRemoveBenefit(index)}
                                    className="p-2 cursor-pointer hover:bg-slate-700"
                                >
                                    <Trash2 className="h-5 w-5 text-red-500" />
                                </Button>
                            </div>
                        ))
                    }
                </div>
                <Input
                    type="text"
                    placeholder="e.g., Basic understanding of JavaScript"
                    value={newBenefit}
                    onChange={handleChangeBenefitsInput}
                    className="border-gray-300 dark:border-gray-500"
                />
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddBenefit}
                    className="bg-gray-200 dark:bg-slate-500 hover:bg-gray-300 dark:hover:bg-slate-600 w-[200px] cursor-pointer"
                >
                    <FiPlusCircle />
                    <span>Add benefit</span>
                </Button>
            </div>

            <Separator className='border-theme' />

            {/* prerequisites */}
            <div className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold">Course Prerequisites</h2>
                <Label className="text-gray-500">
                    List any knowledge, tools, or experience students should have before starting
                </Label>
                <div className='flex flex-col gap-[20px]'>
                    {
                        prerequisites.map((prerequisite, index) => (
                            <div key={index} className='flex gap-[20px]'>
                                <span className='w-full py-[5px] px-[10px] border border-gray-200 dark:border-slate-500 rounded-[10px]'>
                                    {prerequisite?.title}
                                </span>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleRemovePrerequisite(index)}
                                    className="p-2 cursor-pointer hover:bg-slate-700"
                                >
                                    <Trash2 className="h-5 w-5 text-red-500" />
                                </Button>
                            </div>
                        ))
                    }
                </div>
                <Input
                    type="text"
                    placeholder="e.g., Basic understanding of JavaScript"
                    value={newPrerequisite}
                    onChange={handleChangePrerequisitesInput}
                    className="border-gray-300 dark:border-gray-500"
                />
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddPrerequisite}
                    className="bg-gray-200 dark:bg-slate-500 hover:bg-gray-300 dark:hover:bg-slate-600 w-[200px] cursor-pointer"
                >
                    <FiPlusCircle />
                    <span>Add prerequisite</span>
                </Button>

            </div>

            <div className="flex justify-between mt-8">
                <Button onClick={handleBackButton} className='w-[100px] bg-gray-200 hover:bg-blue-200 text-black rounded-[10px] cursor-pointer'>Previous</Button>
                <Button onClick={handleNextButton} className='w-[100px] bg-gray-200 hover:bg-blue-200 text-black rounded-[10px] cursor-pointer'>Next</Button>
            </div>
        </div>
    )
}

export default EditCourseData