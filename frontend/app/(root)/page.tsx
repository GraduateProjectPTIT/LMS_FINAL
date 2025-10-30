"use client"

import React from 'react';
import { useSelector } from 'react-redux';

import Layout from '@/components/Layout'
import CallToAction from '@/sections/CallToAction'
import FAQ from '@/sections/FAQ'
import Hero from '@/sections/Hero'
import LogoTicker from '@/sections/LogoTicker'
import ProductShowcase from '@/sections/ProductShowcase'
import Testimonials from '@/sections/Testimonials'
import CategoryCarousel from '@/sections/CategoryCarousel'
import RecommendCourses from '@/sections/RecommendCourses'
import TopPurchasedCourses from '@/sections/TopPurchasedCourses'
import TopRatedCourses from '@/sections/TopRatedCourses'
import { RootState } from '@/redux/store';

const Page = () => {

  const { currentUser } = useSelector((state: RootState) => state.user);


  return (
    <Layout>

      <Hero />

      <LogoTicker />

      <TopPurchasedCourses />

      <CategoryCarousel />

      <TopRatedCourses />

      <ProductShowcase />

      {
        currentUser && (
          <RecommendCourses />
        )
      }

      <Testimonials />

      <FAQ />

      <CallToAction />

    </Layout>
  )
}

export default Page
