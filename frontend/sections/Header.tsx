'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { RootState } from "@/redux/store";
import { useSelector, useDispatch } from "react-redux";
import toast from 'react-hot-toast';
import { signOut } from "next-auth/react";
import { signOutSuccess } from '@/redux/user/userSlice';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

import SidebarMenuPanel from '@/sections/SidebarMenuPanel';
import ThemeSwitcher from '@/components/header/ThemeSwitcher'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from '@/components/ui/input';
import { Search, Bell, Menu } from 'lucide-react';

import AnonymousImage from "@/public/anonymous.png"
import Logo from "@/assets/logo-lms.png"

const Header = () => {

  const router = useRouter();
  const { currentUser } = useSelector((state: RootState) => state.user);

  const dispatch = useDispatch();

  // responsive states
  const [dropdownOpenAccount, setDropdownOpenAccount] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const handleLogout = async (e: any) => {
    e.preventDefault();
    try {
      await signOut({ redirect: false });
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        console.error(data.message);
        return;
      } else {
        dispatch(signOutSuccess());
        toast.success("Logout successfully");
        router.replace('/');
        setDropdownOpenAccount(false);
      }
    } catch (error: any) {
      console.log(error.message)
    }
  }

  const openMainMenu = () => {
    setIsMobileMenuOpen(true);
    setIsMobileSearchOpen(false);
  };

  const openMobileSearch = () => {
    setIsMobileSearchOpen(true);
    setIsMobileMenuOpen(false);
  };

  const closeMobileSearch = () => {
    setIsMobileSearchOpen(false);
  };

  const closeMainMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const searchParams = useSearchParams();
  const urlSearchTerm = searchParams?.get('search') || '';

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [mobileSearchTerm, setMobileSearchTerm] = useState<string>("");
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(urlSearchTerm);
    setMobileSearchTerm(urlSearchTerm);
  }, [urlSearchTerm]);

  const onSearchChange = (e: any) => {
    setSearchTerm(e.target.value)
  }

  const onMobileSearchChange = (e: any) => {
    setMobileSearchTerm(e.target.value)
  }

  const handleSearchSubmit = (e: any) => {
    e.preventDefault();
    router.push(`/courses?search=${searchTerm}`);
  }

  const handleMobileSearchSubmit = (e: any) => {
    e.preventDefault();
    router.push(`/courses?search=${mobileSearchTerm}`);
    closeMobileSearch();
  }

  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target) && isMobileSearchOpen) {
        closeMobileSearch();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isMobileSearchOpen]);


  return (
    <>
      <header className="sticky top-0 backdrop-blur-sm z-20 theme-mode dark:theme-mode shadow-sm dark:shadow-slate-700 ">
        <div className='container'>
          <div className="flex justify-between items-center p-5">
            {/* Menu button on mobile screen */}
            <Menu
              onClick={openMainMenu}
              className="w-6 h-6 block md:hidden hover:cursor-pointer hover:text-gray-600 dark:hover:text-gray-400"
            />

            <Image onClick={() => router.push("/")} src={Logo} alt="logo" className='hidden md:block w-[100px] h-[40px] object-contain hover:cursor-pointer' />

            {/* Search bar on desktop */}
            <form onSubmit={handleSearchSubmit} className="hidden md:block relative w-[300px] md:w-[400px]">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={onSearchChange}
                className="pl-12 h-11 bg-slate-50 dark:bg-slate-700 focus:border-slate-500 dark:focus:border-slate-400 rounded-lg"
              />
            </form>

            {/* Right Side */}
            <div className='flex justify-center items-center gap-1 md:gap-2'>
              <div className='hidden md:flex items-center gap-5 border-r pr-5 mr-5 border-gray-300 dark:border-slate-700 '>
                <Link href="/policy" className="hover:cursor-pointer hover:font-semibold">Policy</Link>
                <Link href='/about' className="hover:cursor-pointer hover:font-semibold">About Us</Link>
              </div>

              {!isMobileSearchOpen ? (
                <>
                  <Search
                    onClick={openMobileSearch}
                    className='w-5 h-5 block md:hidden hover:cursor-pointer mr-4 hover:text-gray-600 dark:hover:text-gray-400'
                  />
                  <Bell className='w-5 h-5 hover:cursor-pointer' />
                  <ThemeSwitcher />
                  <DropdownMenu
                    open={dropdownOpenAccount}
                    onOpenChange={setDropdownOpenAccount}>
                    <DropdownMenuTrigger>
                      <Avatar className="w-8 h-8 border border-gray-300 dark:border-slate-800 shadow-md hover:cursor-pointer">
                        {
                          currentUser?.avatar.url ? (
                            <>
                              <AvatarImage src={currentUser.avatar.url} />
                              <AvatarFallback>CN</AvatarFallback>
                            </>
                          ) : (
                            <>
                              <AvatarImage src={AnonymousImage.src} />
                              <AvatarFallback>CN</AvatarFallback>
                            </>
                          )
                        }
                      </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {
                        currentUser ? (
                          <>
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {
                              currentUser.role === 'admin' && (
                                <Link href="/admin">
                                  <DropdownMenuItem>Dashboard</DropdownMenuItem>
                                </Link>
                              )
                            }
                            <Link href="/profile">
                              <DropdownMenuItem>Profile</DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <Link href="/signup">
                              <DropdownMenuItem>Signup</DropdownMenuItem>
                            </Link>
                            <Link href="/login">
                              <DropdownMenuItem>Login</DropdownMenuItem>
                            </Link>
                          </>
                        )
                      }
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div ref={mobileSearchRef} className="flex md:hidden items-center w-full max-w-[250px]">
                  <form onSubmit={handleMobileSearchSubmit} className="relative w-full">
                    <Input
                      placeholder="Search courses..."
                      value={mobileSearchTerm}
                      onChange={onMobileSearchChange}
                      className="pl-10 h-9 bg-slate-50 dark:bg-slate-700 focus:border-slate-500 dark:focus:border-slate-400 rounded-lg text-sm"
                      autoFocus
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Background Overlay - Only for Menu */}
      {isMobileMenuOpen && (
        <div
          onClick={closeMainMenu}
          className="fixed inset-0 bg-black/50 z-40"
        />
      )}

      {/* Mobile Menu Panel - Left Side */}
      <SidebarMenuPanel
        closeMainMenu={closeMainMenu}
        isMobileMenuOpen={isMobileMenuOpen}
      />
    </>
  )
}

export default Header