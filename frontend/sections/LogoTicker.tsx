'use client'

import logoMac from "@/assets/logo-MAC.png"
import logoNars from "@/assets/logo-nars.png"
import logoSephora from "@/assets/logo-sephora.png"
import logoDior from "@/assets/logo-dior.png"
import logoLoreal from "@/assets/logo-loreal.png"
import logoMaybelline from "@/assets/logo-maybelline.png"
import logoRomand from "@/assets/logo-romand.png"
import logoTheFaceShop from "@/assets/logo-face-shop.png"
import Image from "next/image";
import { motion } from "motion/react"

const logos = [
  { src: logoMac, className: "logo-ticker-medium" },
  { src: logoNars, className: "logo-ticker-small" },
  { src: logoSephora, className: "logo-ticker-medium" },
  { src: logoDior, className: "logo-ticker-large" },
  { src: logoRomand, className: "logo-ticker-medium" },
  { src: logoTheFaceShop, className: "logo-ticker-medium" },
  { src: logoLoreal, className: "logo-ticker-medium" },
  { src: logoMaybelline, className: "logo-ticker-medium" },
];

const LogoTicker = () => {
  return (
    <section className="h-[100px] flex items-center theme-mode border shadow-md dark:shadow-slate-400">
      <div className="container">
        <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black,transparent)]">
          <motion.div
            className="flex items-center gap-14 flex-none"
            animate={{
              x: ["0%", "-50%"],
            }}
            // transition={{
            //   duration: 20,
            //   repeat: Infinity,
            //   ease: "linear",
            // }}
            style={{ minWidth: "200%" }} // Ensures enough width for two sets
          >
            {/* First set of logos */}
            {logos.map((logo, idx) => (
              <Image key={idx} className={logo.className} src={logo.src} alt="logo" />
            ))}
            {/* Duplicate set of logos for seamless loop */}
            {logos.map((logo, idx) => (
              <Image key={logos.length + idx} className={logo.className} src={logo.src} alt="logo" />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
};

export default LogoTicker;
