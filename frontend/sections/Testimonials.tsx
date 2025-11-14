'use client'

import Image from "next/image";
import { motion } from "motion/react"
import React, { useState, useEffect } from "react";
import { Star, User } from "lucide-react";
import Loader from "@/components/Loader";
import { getValidThumbnail, isValidImageUrl } from "@/utils/handleImage";

interface IReview {
  course: {
    _id: string;
    name: string;
    thumbnail: {
      public_id?: string;
      url: string;
    };
  };
  review: {
    _id: string;
    rating: number;
    comment: string;
    createdAt: string;
    repliesCount: number;
  };
  user: {
    _id: string;
    name: string;
    email: string;
    avatar: {
      public_id?: string;
      url: string;
    };
  };
}

const TestimonialColumn = (props: {
  className?: string;
  testimonials: IReview[],
  duration?: number
}) => (
  <div className={props.className}>
    <motion.div
      className={"flex flex-col gap-6 pb-6"}
      animate={{
        translateY: "-50%"
      }}
      transition={{
        repeat: Infinity,
        ease: "linear",
        repeatType: "loop",
        duration: props.duration || 10
      }}
    >
      {
        [...new Array(2)].fill(0).map((_, index) => (
          <React.Fragment key={index}>
            {
              props.testimonials.map((item) => (
                <div key={item.review._id} className="card dark:shadow-slate-700/50">
                  {/* Rating stars */}
                  <div className="flex mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        className={`${star <= item.review.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300 dark:text-gray-600'
                          }`}
                      />
                    ))}
                  </div>

                  {/* Review comment */}
                  <div className="text-gray-700 dark:text-gray-300 mb-3">
                    {item.review.comment}
                  </div>

                  {/* Course name */}
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 italic">
                    "{item.course.name}"
                  </div>

                  {/* User info */}
                  <div className="flex items-center gap-2 mt-5">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-900 flex-shrink-0">
                      {item.user.avatar?.url && isValidImageUrl(item.user.avatar.url) ? (
                        <Image
                          src={item.user.avatar.url}
                          alt={item.user.name}
                          fill
                          sizes="40px"
                          style={{ objectFit: "cover" }}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User size={20} className="text-indigo-600 dark:text-indigo-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="font-medium tracking-tight leading-5">
                        {item.user.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 leading-5 tracking-tight">
                        {item.user.email}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            }
          </React.Fragment>
        ))
      }
    </motion.div>
  </div>
)

const Testimonials = () => {
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/latest-reviews?limit=10`,
          {
            method: 'GET',
            credentials: 'include',
          }
        );

        const data = await res.json();

        if (!res.ok) {
          console.log("Fetching reviews failed: ", data.message);
          return;
        }

        setReviews(data.reviews || []);
      } catch (error: any) {
        console.error("Error fetching reviews:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (loading) {
    return (
      <Loader />
    );
  }

  if (reviews.length === 0) {
    return (
      <section className="theme-mode">
        <div className="container">
          <div className="max-w-[540px] mt-5 mx-auto">
            <h2 className="section-title">What our users say</h2>
            <p className="section-desc mt-5">
              From intuitive design to powerful features, our app has become an essential tool for users around the world.
            </p>
          </div>
          <div className="flex justify-center items-center my-10 min-h-[400px]">
            <p className="text-gray-500 dark:text-gray-400">No reviews yet</p>
          </div>
        </div>
      </section>
    );
  }

  // Split reviews into 3 columns
  const columnCount = 3;
  const itemsPerColumn = Math.ceil(reviews.length / columnCount);

  const firstCol = reviews.slice(0, itemsPerColumn);
  const secondCol = reviews.slice(itemsPerColumn, itemsPerColumn * 2);
  const thirdCol = reviews.slice(itemsPerColumn * 2);

  return (
    <section className="theme-mode">
      <div className="container">
        <div className="max-w-[540px] mt-5 mx-auto">
          <h2 className="section-title">What our users say</h2>
          <p className="section-desc mt-5">
            From intuitive design to powerful features, our app has become an essential tool for users around the world.
          </p>
        </div>
        <div className="flex justify-center max-h-[738px] overflow-hidden gap-6 my-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)]">
          <TestimonialColumn duration={15} testimonials={firstCol} />
          {secondCol.length > 0 && (
            <TestimonialColumn
              duration={18}
              testimonials={secondCol}
              className="hidden md:block"
            />
          )}
          {thirdCol.length > 0 && (
            <TestimonialColumn
              duration={14}
              testimonials={thirdCol}
              className="hidden lg:block"
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;