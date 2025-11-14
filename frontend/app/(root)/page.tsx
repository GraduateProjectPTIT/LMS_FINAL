import React from 'react';
import Layout from '@/components/Layout'
import CallToAction from '@/sections/CallToAction'
import FAQ from '@/sections/FAQ'
import Hero from '@/sections/Hero'
import LogoTicker from '@/sections/LogoTicker'
import ProductShowcase from '@/sections/ProductShowcase'
import Testimonials from '@/sections/Testimonials'
import CategoryCarousel from '@/sections/CategoryCarousel'
import TopPurchasedCourses from '@/sections/TopPurchasedCourses'
import TopRatedCourses from '@/sections/TopRatedCourses'

const Page = () => {

  return (
    <Layout>

      <Hero />

      <LogoTicker />

      <ProductShowcase />

      <CategoryCarousel />

      <TopPurchasedCourses />

      <Testimonials />

      <TopRatedCourses />

      <FAQ />

      <CallToAction />

    </Layout>
  )
}

export default Page
