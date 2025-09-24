"use client";

import React, { useState, useEffect } from "react";
import { CirclePlus, CircleMinus } from "lucide-react";

interface FaqItem {
    _id: string;
    question: string;
    answer: string;
}

const FAQ = () => {
    const [faqs, setFaqs] = useState<FaqItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [openFaqIndices, setOpenFaqIndices] = useState<number[]>([]);

    const handleGetFAQs = async () => {
        try {
            setLoading(true);
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/layout/get_layout/FAQ`,
                {
                    method: "GET",
                    credentials: "include",
                }
            );
            const data = await res.json();
            if (!res.ok) {
                console.log("Fetching FAQ failed: ", data.message);
                return;
            } else {
                setFaqs(data.layout.faq);
            }
        } catch (error: any) {
            console.log(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleGetFAQs();
    }, []);

    const toggleFaq = (index: number) => {
        if (openFaqIndices.includes(index)) {
            setOpenFaqIndices(openFaqIndices.filter((i) => i !== index));
        } else {
            setOpenFaqIndices([...openFaqIndices, index]);
        }
    };

    return (
        <section className="py-16 border shadow-lg border-r-0 border-l-0 border-gray-200 dark:border-slate-700 bg-gradient-to-b from-[#E6EBFF] to-[#FFFFFF] dark:bg-[radial-gradient(ellipse_200%_100%_at_bottom_left,#0A1D56,#0D1B2A_100%)]">
            <div className="container">
                <div className="px-[10px] md:px-[50px] lg:px-[100px] grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column - Title and Introduction */}
                    <div className="lg:col-span-4">
                        <h1 className="text-3xl font-bold mb-4">General FAQs</h1>
                        <p className="mb-6">
                            Everything you need to know about the product and how it works.
                            Can't find an answer? Please{" "}
                            <a href="/contact" className="text-blue-600 hover:underline">
                                chat to our friendly team
                            </a>
                            .
                        </p>
                    </div>

                    {/* Right Column - FAQ Items */}
                    <div className="lg:col-span-8">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-gray-100"></div>
                            </div>
                        ) : (
                            <div className="space-y-1 ">
                                {faqs.map((faq, index) => (
                                    <div
                                        key={index}
                                        className="border-b border-gray-400 last:border-b-0"
                                    >
                                        <button
                                            className={`flex justify-between items-center w-full py-5 text-left font-medium focus:outline-none cursor-pointer
                                                ${openFaqIndices.includes(index)
                                                    ? "text-blue-500 dark:text-blue-500"
                                                    : "dark:text-gray-400"
                                                }`}
                                            onClick={() => toggleFaq(index)}
                                        >
                                            <span>{faq.question}</span>
                                            {openFaqIndices.includes(index) ? (
                                                <CircleMinus className="flex-shrink-0 w-5 h-5" />
                                            ) : (
                                                <CirclePlus className="flex-shrink-0 w-5 h-5" />
                                            )}
                                        </button>
                                        {/* Animated FAQ answer */}
                                        <div
                                            className={` overflow-hidden transition-all duration-300
                                                ${openFaqIndices.includes(index)
                                                    ? "max-h-96 opacity-100"
                                                    : "max-h-0 opacity-0"
                                                }
                                            `}
                                        >
                                            <div className="pb-5 pr-8">
                                                <p className="text-gray-700 dark:text-gray-300">
                                                    {faq.answer}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FAQ;
