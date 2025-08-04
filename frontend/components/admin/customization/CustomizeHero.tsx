"use client"

import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, X } from 'lucide-react';

const CustomizeHero = () => {

    const [image, setImage] = useState("");
    const [title, setTitle] = useState("");
    const [subTitle, setSubTitle] = useState("");
    const [loading, setLoading] = useState(false);
    const [bannerExists, setBannerExists] = useState(false);
    const [imagePreview, setImagePreview] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        fetchBannerLayout();
    }, []);

    const fetchBannerLayout = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/layout/get_layout/Banner`, {
                method: 'GET',
                credentials: 'include',
            });

            const data = await res.json();

            if (!res.ok) {
                console.log(data.message);
            } else {
                const { layout } = data;

                if (layout) {
                    setBannerExists(true);
                    setTitle(layout.banner.title || '');
                    setSubTitle(layout.banner.subTitle || '');

                    if (layout.banner.image && layout.banner.image.url) {
                        setImagePreview(layout.banner.image.url);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching banner layout:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = async (e: any) => {
        const file = e.target.files[0];
        if (file) {
            const fileReader = new FileReader();

            fileReader.onload = () => {
                if (fileReader.readyState === 2) {
                    setImage(fileReader.result as string);
                    setImagePreview(fileReader.result as string);
                }
            };
            fileReader.readAsDataURL(file);
        }
    };

    const handleDragOver = (e: any) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: any) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: any) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];

        if (file) {
            const fileReader = new FileReader();

            fileReader.onload = () => {
                if (fileReader.readyState === 2) {
                    setImagePreview(fileReader.result as string);
                    setImage(fileReader.result as string);
                }
            }
            fileReader.readAsDataURL(file)
        }
    };

    const removeImage = () => {
        setImage("");
        setImagePreview("");
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        try {
            setLoading(true);

            const bannerData = {
                type: 'Banner',
                banner: {
                    image,
                    title,
                    subTitle
                }
            };

            if (bannerExists) {
                // Update existing banner
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/layout/update_layout`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(bannerData)
                });

                const data = await res.json();

                if (data.success) {
                    toast.success('Banner updated successfully');
                    // Refresh the banner data
                    fetchBannerLayout();
                }
            } else {
                // Create new banner
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/layout/create_layout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(bannerData)
                });

                const data = await res.json();

                if (data.success) {
                    toast.success('Banner created successfully');
                    setBannerExists(true);
                    // Refresh the banner data
                    fetchBannerLayout();
                }
            }
        } catch (error: any) {
            console.error('Error saving banner:', error);
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className=''>
            <Card className="w-full border border-gray-300 dark:border-slate-600 shadow-md light-mode dark:dark-mode">
                <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-bold text-center">Customize Hero Section</CardTitle>
                    <CardDescription className="text-center dark:text-gray-400">
                        {bannerExists ? 'Update your website banner' : 'Create a new banner for your website'}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Image Upload */}
                        <div className="space-y-2">
                            <Label htmlFor="banner-image" className="font-medium dark:text-gray-200">Banner Image</Label>
                            <Input
                                id="banner-image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />

                            <div
                                className={`mt-2 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 text-center transition-colors w-full md:w-[500px]
                                ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700'}
                                hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20
                                dark:text-gray-300`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                {!imagePreview ? (
                                    <>
                                        <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                                        <div className="text-sm font-medium">
                                            Drag and drop an image here, or{' '}
                                            <label htmlFor="banner-image" className="text-blue-600 cursor-pointer dark:text-blue-400 hover:underline">
                                                browse
                                            </label>
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Recommended size: 1920 x 600px. Max 5MB (JPG, PNG)
                                        </p>

                                    </>
                                ) : (
                                    <>
                                        <div className="rounded-lg relative overflow-hidden w-full shadow-md border dark:border-gray-700">
                                            <div className="w-full h-64">
                                                <Image
                                                    src={imagePreview}
                                                    alt="Banner Preview"
                                                    fill
                                                    sizes="100vw"
                                                    priority
                                                    style={{ objectFit: 'contain' }}
                                                    className="object-contain max-w-full max-h-full"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-2 flex justify-between items-center">
                                            <label
                                                htmlFor="banner-image"
                                                className="text-xs text-blue-600 cursor-pointer dark:text-blue-400 hover:underline"
                                            >
                                                Change image
                                            </label>
                                            <p onClick={removeImage} className="text-xs text-red-500 dark:text-red-400 cursor-pointer hover:underline">
                                                Delete image
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title" className="font-medium dark:text-gray-200">Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter banner title"
                                className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                required
                            />
                        </div>

                        {/* Subtitle */}
                        <div className="space-y-2">
                            <Label htmlFor="subtitle" className="font-medium dark:text-gray-200">Subtitle</Label>
                            <div className="relative">
                                <textarea
                                    id="subtitle"
                                    value={subTitle}
                                    onChange={(e) => setSubTitle(e.target.value)}
                                    placeholder="Enter banner subtitle"
                                    className="w-full min-h-[100px] p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-y"
                                    required
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full font-medium transition-colors cursor-pointer text-black dark:text-white bg-blue-300 hover:bg-blue-400 dark:bg-slate-700 dark:hover:bg-slate-600"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                bannerExists ? 'Update Banner' : 'Create Banner'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export default CustomizeHero