'use client'
import productImage from "@/assets/product-image.png"
import Image from "next/image";
import { motion, useScroll, useTransform, useMotionValueEvent } from "motion/react"
import { useRef } from "react"

const ProductShowcase = () => {

  return (
    <section className="bg-gradient-to-b from-[#FFFFFF] to-[#E6EBFF] dark:bg-[radial-gradient(ellipse_200%_100%_at_bottom_left,#0A1D56,#0D1B2A_100%)] py-24 overflow-x-clip">
      <div className="container">
        <div className="max-w-[540px] mx-auto">
          <div className="flex justify-center">
            <div className="tag">Empower Your Learning</div>
          </div>
          <h2 className="section-title dark:from-white dark:to-gray-400 mt-5">Transform the way you learn with an interactive LMS</h2>
          <p className="section-desc mt-5">Unlock your potential with an intuitive LMS designed to simplify learning, track progress, and enhance engagement</p>
        </div>
        <div className="relative">
          <Image src={productImage} alt="product image" className="mt-10" />

        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
