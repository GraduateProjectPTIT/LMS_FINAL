'use client'

import React, { useState, useEffect } from 'react'
import ArrowRight from "@/assets/arrow-right.svg"
import { Input } from "@/components/ui/input"


const Hero = () => {

    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState("");
    const [title, setTitle] = useState("");
    const [subTitle, setSubTitle] = useState("");

    const handleGetHeroBanner = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/layout/get_layout/Banner`, {
                method: "GET",
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) {
                console.log(data.message);
                return;
            } else {
                setImage(data.layout.banner?.image?.url);
                setTitle(data.layout.banner?.title);
                setSubTitle(data.layout.banner?.subTitle);
            }
        } catch (error: any) {
            console.log(error.message);
        }
    }

    useEffect(() => {
        handleGetHeroBanner();
    }, [])

    return (
        <section
            className="pt-8 pb-20 md:pt-5 md:pb-10 
            bg-[radial-gradient(ellipse_200%_100%_at_bottom_left,#455db3,#EAEEFE_100%)] 
            dark:bg-[radial-gradient(ellipse_200%_100%_at_bottom_left,#0A1D56,#0D1B2A_100%)] 
            overflow-x-clip"
        >
            <div className="container">
                <div className="px-[10px] md:px-[50px] lg:px-[100px] grid grid-cols-1 lg:grid-cols-12 gap-[20px] md:gap-[50px]">
                    {/* description */}
                    <div className="col-span-6 p-2">
                        <h1 className="text-5xl md:text-6xl font-bold tracking-tighter bg-gradient-to-b from-black to-[#001E80] dark:from-white dark:to-gray-400 text-transparent bg-clip-text mt-6">{title}</h1>
                        <p className="text-xl text-[#010D3E] dark:text-gray-300 tracking-tight mt-6">{subTitle}</p>
                        <div className="flex gap-1 items-center mt-[30px]">
                            <button className=" btn btn-primary cursor-pointer hover:bg-black/60 dark:bg-white dark:text-black dark:hover:bg-white/80">Get Started for Free</button>
                            <button className="btn btn-text gap-1 cursor-pointer hover:text-black/60 dark:text-white dark:hover:text-gray-400">
                                <div className='flex items-center gap-2'>
                                    <span>Explore Features</span>
                                    <ArrowRight className="h-5 w-5" />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Hero