import Layout from '@/components/Layout'
import CallToAction from '@/sections/CallToAction'
import FAQ from '@/sections/FAQ'
import Hero from '@/sections/Hero'
import LogoTicker from '@/sections/LogoTicker'
import ProductShowcase from '@/sections/ProductShowcase'
import Testimonials from '@/sections/Testimonials'
import CategoryCarousel from '@/sections/CategoryCarousel'
import FavouriteCourses from '@/sections/FavouriteCourses'
import RecommendCourses from '@/sections/RecommendCourses'

const Page = () => {
  return (
    <Layout>
      <Hero />
      <LogoTicker />
      <CategoryCarousel />
      <FavouriteCourses />
      <ProductShowcase />
      <RecommendCourses />
      <Testimonials />
      <FAQ />
      <CallToAction />
    </Layout>
  )
}

export default Page
