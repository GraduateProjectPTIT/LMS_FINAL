'use client'

import Layout from '@/components/Layout'
import CallToAction from '@/sections/CallToAction'
import FAQ from '@/sections/FAQ'
import Hero from '@/sections/Hero'
import LogoTicker from '@/sections/LogoTicker'
import ProductShowcase from '@/sections/ProductShowcase'
import Testimonials from '@/sections/Testimonials'
import React, { useState } from 'react'

const Page = () => {
  return (
    <Layout>
      <Hero />
      <LogoTicker />
      <ProductShowcase />
      <Testimonials />
      <FAQ />
      <CallToAction />
    </Layout>
  )
}

export default Page
