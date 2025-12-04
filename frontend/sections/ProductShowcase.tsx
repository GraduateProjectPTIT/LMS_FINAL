'use client'

import { useRouter } from "next/navigation";
import { Sparkles } from 'lucide-react';

const ProductShowcase = () => {

  const router = useRouter();

  return (
    <section id="product-showcase" className="bg-gradient-to-b from-[#FFFFFF] to-[#E6EBFF] dark:bg-[radial-gradient(ellipse_200%_100%_at_bottom_left,#0A1D56,#0D1B2A_100%)] py-24 overflow-x-clip">
      <div className="container">
        <div className="max-w-[540px] mx-auto">
          <div className="flex justify-center">
            <div className="tag">AI Virtual Try-On</div>
          </div>
          <h2 className="section-title dark:from-white dark:to-gray-400 mt-5">Learn makeup smarter with AI Virtual Try-On</h2>
          <p className="section-desc mt-5">Instantly try makeup looks from tutorials directly on your face using AI. Find your perfect style before you even start.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10">
          <button
            onClick={() => router.push('/virtual-try-on')}
            className="group px-8 py-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-slate-800 hover:border-gray-300 dark:hover:border-gray-600 font-medium rounded-xl shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              Try AI Virtual Makeup
              <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform text-slate-700 dark:text-slate-300" />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
