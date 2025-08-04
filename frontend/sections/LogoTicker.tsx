'use client'
import acmeLogo from "@/assets/logo-acme.png";
import quantumLogo from "@/assets/logo-quantum.png";
import echoLogo from "@/assets/logo-echo.png";
import celestialLogo from "@/assets/logo-celestial.png";
import pulseLogo from "@/assets/logo-pulse.png";
import apexLogo from "@/assets/logo-apex.png";
import Image from "next/image";
import { motion } from "motion/react"

const LogoTicker = () => {
  return (
    <section className="py-8 light-mode dark:dark-mode border shadow-md dark:shadow-slate-400">
      <div className="container">
        <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black,transparent)]">
          <motion.div
            className="flex gap-14 flex-none pr-14"
            animate={{
              translateX: "-50%",
            }}
          // transition={{
          //   duration: 20,
          //   repeat: Infinity,
          //   ease: "linear",
          //   repeatType: "loop"
          // }}
          >
            <Image className="logo-ticker-image" src={acmeLogo} alt="Acme logo" />
            <Image className="logo-ticker-image" src={quantumLogo} alt="Quantum logo" />
            <Image className="logo-ticker-image" src={echoLogo} alt="Echo logo" />
            <Image className="logo-ticker-image" src={celestialLogo} alt="Celestial logo" />
            <Image className="logo-ticker-image" src={pulseLogo} alt="Pulse logo" />
            <Image className="logo-ticker-image" src={apexLogo} alt="Apex logo" />
            <Image className="logo-ticker-image" src={acmeLogo} alt="Acme logo" />
            <Image className="logo-ticker-image" src={quantumLogo} alt="Quantum logo" />
            <Image className="logo-ticker-image" src={echoLogo} alt="Echo logo" />
            <Image className="logo-ticker-image" src={celestialLogo} alt="Celestial logo" />
            <Image className="logo-ticker-image" src={pulseLogo} alt="Pulse logo" />
            <Image className="logo-ticker-image" src={apexLogo} alt="Apex logo" />
          </motion.div>
        </div>
      </div>
    </section>
  )
};

export default LogoTicker;
