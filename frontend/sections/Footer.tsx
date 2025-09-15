import logo from "@/assets/logosaas.png"
import Image from "next/image";
import SocialX from "@/assets/social-x.svg";
import SocialInsta from "@/assets/social-insta.svg";
import SocialLinkedin from "@/assets/social-linkedin.svg";
import SocialYoutube from "@/assets/social-youtube.svg";
import SocialPin from "@/assets/social-pin.svg";
import LogoImage from "@/assets/logo-lms.png"

const Footer = () => {
  return (
    <footer className="theme-mode text-sm py-10 text-center border-t-[1px] border-theme">
      <div className="container">
        <div className="inline-flex">
          <Image src={LogoImage.src} width={100} height={100} alt="logo" className="relative" />
        </div>
        <nav className="flex flex-col gap-6 mt-6 md:flex-row md:justify-center">
          <a className="cursor-pointer" href="#">About</a>
          <a className="cursor-pointer" href="#">Features</a>
          <a className="cursor-pointer" href="#">Customers</a>
          <a className="cursor-pointer" href="#">Pricing</a>
          <a className="cursor-pointer" href="#">Help</a>
          <a className="cursor-pointer" href="#">Careers</a>
        </nav>
        <div className="flex justify-center gap-6 my-6">
          <SocialX className="cursor-pointer" />
          <SocialInsta className="cursor-pointer" />
          <SocialLinkedin className="cursor-pointer" />
          <SocialYoutube className="cursor-pointer" />
          <SocialPin className="cursor-pointer" />
        </div>
        <p>&copy; 2025 Your Company, Inc. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
