"use client"

import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const CustomizeFAQ = () => {
    const [originalFaqs, setOriginalFaqs] = useState([]);

    const [faqs, setFaqs] = useState([
        { question: '', answer: '', isOpen: true }
    ]);

    const [loading, setLoading] = useState(false);
    const [faqExists, setFaqExists] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState(-1);

    useEffect(() => {
        fetchFAQLayout();
    }, []);

    const fetchFAQLayout = async () => {
        try {
            setLoading(true);

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/layout/get_layout/FAQ`, {
                method: "GET",
                credentials: "include"
            });

            const data = await res.json();

            if (!res.ok) {
                console.log(data.message);
            } else {
                const { layout } = data;
                if (layout && layout.faq && layout.faq.length > 0) {
                    setFaqExists(true);
                    // Add isOpen property to each FAQ for accordion functionality
                    const faqsWithOpenState = layout.faq.map((faq: any, index: any) => ({
                        ...faq
                    }));
                    setFaqs(faqsWithOpenState);
                    setOriginalFaqs(layout.faq);
                }
            }
        } catch (error: any) {
            console.log(error.message);
        } finally {
            setLoading(false);
        }
    }

    const handleQuestionChange = (index: any, value: any) => {
        const newFaqs = [...faqs];
        newFaqs[index].question = value;
        setFaqs(newFaqs);
    };

    const handleAnswerChange = (index: any, value: any) => {
        const newFaqs = [...faqs];
        newFaqs[index].answer = value;
        setFaqs(newFaqs);
    };

    const toggleAccordion = (index: any) => {
        setExpandedIndex(expandedIndex === index ? -1 : index);
    };

    const addFAQ = () => {
        setFaqs([...faqs, { question: '', answer: '', isOpen: true }]);
        setExpandedIndex(faqs.length);
    };

    const removeFAQ = (index: any) => {
        if (faqs.length > 1) {
            const newFaqs = faqs.filter((_, i) => i !== index);
            setFaqs(newFaqs);

            // Adjust expandedIndex if needed
            if (expandedIndex === index) {
                setExpandedIndex(-1);
            } else if (expandedIndex > index) {
                setExpandedIndex(expandedIndex - 1);
            }
        } else {
            toast.error("You need at least one FAQ item");
        }
    };

    const isFaqsChanges = (a: any[], b: any[]) => {
        if (a.length !== b.length) return false;
        return a.every((item, index) =>
            item.question.trim() === b[index].question.trim() &&
            item.answer.trim() === b[index].answer.trim()
        );
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        // Validate inputs
        const isValid = faqs.every(faq => faq.question.trim() !== '' && faq.answer.trim() !== '');
        if (!isValid) {
            toast.error("All questions and answers must be filled out");
            return;
        }

        if (isFaqsChanges(faqs, originalFaqs)) {
            toast("No changes detected!");
            return;
        }

        try {
            setLoading(true);

            // Prepare data - remove isOpen property as it's not needed in the backend
            const faqData = {
                type: 'FAQ',
                faq: faqs.map(({ question, answer }) => ({ question, answer }))
            };

            if (faqExists) {
                // Update existing FAQ
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/layout/update_layout`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(faqData)
                });

                const data = await res.json();

                if (!res.ok) {
                    console.log(data.message);
                    toast.error('Failed to update FAQs');
                    return;
                } else {
                    toast.success('FAQs updated successfully');
                    fetchFAQLayout();
                }
            } else {
                // Create new FAQ layout
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/layout/create_layout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(faqData)
                });

                const data = await res.json();

                if (!res.ok) {
                    console.log(data.message);
                    toast.error('Failed to update FAQs');
                    return;
                } else {
                    toast.success('FAQs created successfully');
                    setFaqExists(true);
                    fetchFAQLayout();
                }
            }
        } catch (error) {
            console.error('Error saving FAQs:', error);
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Card className="w-full border border-gray-300 dark:border-slate-600 shadow-md light-mode dark:dark-mode">
                <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-bold text-center">Customize FAQ Section</CardTitle>
                    <CardDescription className="text-center dark:text-gray-400">
                        {faqExists ? 'Update your website FAQs' : 'Create FAQs for your website'}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <div
                                    key={index}
                                    className="border dark:border-gray-700 rounded-lg overflow-hidden shadow-sm"
                                >
                                    <div
                                        className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-4 cursor-pointer"
                                        onClick={() => toggleAccordion(index)}
                                    >
                                        <div className="flex-1">
                                            <Input
                                                placeholder="Enter question here ..."
                                                value={faq.question}
                                                onChange={(e) => handleQuestionChange(index, e.target.value)}
                                                className="border-none pl-2 text-xs md:text-base font-medium  focus:ring-0 shadow-none focus:shadow-none dark:text-white"
                                                onClick={(e) => e.stopPropagation()}
                                                required
                                            />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeFAQ(index);
                                                }}
                                                className="h-8 w-8 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            {expandedIndex === index ?
                                                <ChevronUp className="h-5 w-5 text-gray-500 hover:text-blue-500 cursor-pointer" /> :
                                                <ChevronDown className="h-5 w-5 text-gray-500 hover:text-blue-500 cursor-pointer" />
                                            }
                                        </div>
                                    </div>

                                    {expandedIndex === index && (
                                        <div className="p-4 bg-white dark:bg-gray-900">
                                            <Label htmlFor={`answer-${index}`} className="block mb-2 text-sm font-medium dark:text-gray-200">
                                                Answer
                                            </Label>
                                            <textarea
                                                id={`answer-${index}`}
                                                value={faq.answer}
                                                onChange={(e) => handleAnswerChange(index, e.target.value)}
                                                placeholder="Enter answer here ..."
                                                className="w-full min-h-[100px] p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-y"
                                                required
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={addFAQ}
                            className="w-full cursor-pointer border-dashed border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-slate-600 hover:bg-blue-50 dark:hover:bg-slate-700 dark:text-gray-200"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add New FAQ
                        </Button>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full cursor-pointer font-medium transition-colors bg-blue-600 hover:bg-blue-600/70 dark:bg-blue-600 dark:hover:bg-blue-600/70"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                faqExists ? 'Update FAQs' : 'Create FAQs'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export default CustomizeFAQ