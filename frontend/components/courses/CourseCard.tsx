import React from 'react';
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import toast from 'react-hot-toast';
import { addItemToCartFailure, addItemToCartStart, addItemToCartSuccess } from '@/redux/cart/cartSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Users, Play, Award, ShoppingCart } from 'lucide-react';
import { ICourseSearchResponse } from '@/type';
import MissingImage from '@/public/missing_image.jpg'

interface CourseCardProps {
    course: ICourseSearchResponse;
    viewMode: 'grid' | 'list';
    setShowPreviewModal: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedCourse: React.Dispatch<React.SetStateAction<ICourseSearchResponse | null>>;
    currentUrl: string | null;
}

const CourseCard = ({ course, viewMode, setShowPreviewModal, setSelectedCourse, currentUrl }: CourseCardProps) => {

    const router = useRouter();
    const dispatch = useDispatch();

    const { currentUser } = useSelector((state: RootState) => state.user);

    const getThumbnailUrl = (thumbnail: any) => {
        if (thumbnail && typeof thumbnail === 'object' && thumbnail.url && thumbnail.url.trim() !== '') {
            return thumbnail.url;
        }
        return MissingImage.src;
    };

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }).map((_, index) => (
            <Star
                key={index}
                className={`h-3.5 w-3.5 ${index < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                    }`}
            />
        ));
    };

    const handleViewDetails = (courseId: string) => {
        router.push(`/course-overview/${courseId}`)
    }

    const handleClickPreview = (course: ICourseSearchResponse) => {
        setSelectedCourse(course);
        setShowPreviewModal(true);
    }

    const handleAddToCart = async (courseId: string) => {

        if (!currentUser) {
            toast("Please login to add the course");
            router.push(`/login?callbackUrl=${encodeURIComponent(currentUrl || `/course-overview/${courseId}`)}`);
            return;
        }

        try {
            dispatch(addItemToCartStart());
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/cart/add/${courseId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) {
                dispatch(addItemToCartFailure(data.message || "Failed to add item to cart"));
                toast.error(data.message || "Failed to add item to cart");
                return;
            }
            dispatch(addItemToCartSuccess(data.cart));
            toast.success("Course added to cart");
        } catch (error: any) {
            dispatch(addItemToCartFailure(error.message || "Failed to add item to cart"));
            toast.error(error.message || "Failed to add item to cart");
        }
    }

    if (viewMode === 'list') {
        return (
            <Card onClick={() => handleViewDetails(course._id)} className="w-full group hover:shadow-md hover:cursor-pointer transition-all duration-300 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700">
                <CardContent className="p-6">
                    <div className="flex gap-6">
                        <div className="flex-shrink-0">
                            <div className="relative overflow-hidden rounded-xl">
                                <img
                                    src={course.thumbnail ? getThumbnailUrl(course.thumbnail) : MissingImage.src}
                                    alt={course.name}
                                    className="w-[300px] h-[200px] object-cover transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-1 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                                        {course.name}
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                        {course.description}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 ml-4">
                                    <div className="text-right">
                                        <span className="text-sm text-slate-500 line-through block">${course.estimatedPrice}</span>
                                        <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">${course.price}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 mb-4">
                                <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-0">
                                    <Award className="h-3 w-3 mr-1" />
                                    {course.level}
                                </Badge>
                                <div className="flex items-center gap-1">
                                    {renderStars(course.ratings)}
                                    <span className="text-sm text-slate-600 dark:text-slate-400 ml-1 font-medium">
                                        {course.ratings}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <Users className="h-4 w-4" />
                                    <span className="font-medium">{course.purchased.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500 dark:text-slate-400">Category:</span>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {course.categories.map(cat => cat.title).join(', ')}
                                    </span>
                                </div>
                                <div className='flex justify-center items-center gap-2'>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleClickPreview(course)
                                        }}
                                        className="flex items-center gap-2 hover:cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900/70"
                                    >
                                        <Play className="h-4 w-4" />
                                        Preview
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddToCart(course._id)
                                        }}
                                        className='flex items-center gap-2 hover:cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900/70'
                                    >
                                        <ShoppingCart className="h-4 w-4" />
                                        Add to Cart
                                    </Button>

                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card onClick={() => handleViewDetails(course._id)} className="w-full group hover:shadow-md hover:cursor-pointer transition-all duration-300 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:-translate-y-1">
            <CardHeader className="p-0">
                <div className="relative overflow-hidden">
                    <img
                        src={getThumbnailUrl(course.thumbnail)}
                        alt={course.name}
                        className="w-full h-48 object-cover transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute top-3 right-3">
                        <Badge variant="secondary" className="bg-white/90 text-slate-800 border-0 shadow-sm">
                            <Award className="h-3 w-3 mr-1" />
                            {course.level}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 line-clamp-2 h-[60px] mb-2 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                    {course.name}
                </CardTitle>
                <div className='h-[70px]'>
                    <CardDescription className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                        {course.description}
                    </CardDescription>
                </div>

                <div className="flex items-center ">
                    {renderStars(course.ratings)}
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 ">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">: {course.purchased.toLocaleString()} students</span>
                </div>

                <div className="h-[80px]">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Category : </span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {course.categories.map(cat => cat.title).join(', ')}
                    </span>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-4 ">
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-500 line-through">${course.estimatedPrice}</span>
                        <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">${course.price}</span>
                    </div>
                    <div className='flex justify-between items-center gap-2'>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClickPreview(course)
                            }}
                            className="flex items-center hover:cursor-pointer gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 "
                        >
                            <Play className="h-4 w-4" />
                            Preview
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(course._id);
                            }}
                            className="flex items-center hover:cursor-pointer gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 "
                        >
                            <ShoppingCart className="h-4 w-4" />
                            Add To Cart
                        </Button>

                    </div>
                </div>

            </CardContent>
        </Card>
    );
};

export default CourseCard;