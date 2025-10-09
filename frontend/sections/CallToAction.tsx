'use client'
import { useRouter } from "next/navigation";
import ArrowRight from "@/assets/arrow-right.svg"

const CallToAction = () => {
  const router = useRouter();

  const handleClick = () => {
    router.push('/signup');
  }

  return (
    <section className="bg-gradient-to-b from-white to-[#F0F3FF] dark:from-[#1a1a2e] dark:to-[#121212] py-24 overflow-x-clip transition-colors border">
      <div className="container">
        <div className="max-w-[540px] mx-auto relative">
          <h2 className="section-title dark:text-white">Sign up for free today</h2>
          <p className="section-desc mt-5 dark:text-gray-300">Celebrate the joy of accomplishment with an app designed to track your progress and motivate your efforts.</p>
        </div>
        <div className="flex gap-2 mt-10 justify-center">
          <button onClick={handleClick} className="btn btn-primary cursor-pointer hover:bg-black/60 dark:bg-white dark:text-black dark:hover:bg-white/80">Get for free</button>
          <button onClick={handleClick} className="btn btn-text gap-1 cursor-pointer hover:text-black/60 dark:text-white dark:hover:text-gray-400">
            <span>Learn more</span>
            <ArrowRight className='w-5 h-5' />
          </button>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
