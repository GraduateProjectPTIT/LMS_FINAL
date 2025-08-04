'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RootState } from "@/redux/store";
import { useSelector, useDispatch } from "react-redux";
import toast from 'react-hot-toast';
import { signOut } from "next-auth/react";
import { signOutSuccess } from '@/redux/user/userSlice';
import Link from 'next/link';
import Image from 'next/image';

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
import NavItems from '@/components/header/NavItems'
import ThemeSwitcher from '@/components/header/ThemeSwitcher'
import AnonymousImage from "@/public/anonymous.png"
import Logo from "@/assets/logo-lms.png"
import { Search, Bell } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const Header = () => {

  const router = useRouter();
  const { currentUser } = useSelector((state: RootState) => state.user);

  const dispatch = useDispatch();

  const [dropdownOpen, setDropdownOpen] = useState(false);

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
        setDropdownOpen(false);
      }
    } catch (error: any) {
      console.log(error.message)
    }
  }

  const searchParams = useSearchParams();
  const urlSearchTerm = searchParams?.get('search') || '';

  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    setSearchTerm(urlSearchTerm);
  }, [urlSearchTerm]);

  const onSearchChange = (e: any) => {
    setSearchTerm(e.target.value)
  }

  const handleSearchSubmit = (e: any) => {
    e.preventDefault();
    router.push(`/courses?search=${searchTerm}`);
  }


  return (
    <header className="sticky top-0 backdrop-blur-sm z-20 light-mode dark:dark-mode shadow-sm dark:shadow-slate-700 ">
      <div className='container'>
        <div className="flex justify-between items-center p-5">
          <Image onClick={() => router.push("/")} src={Logo} alt="logo" className='w-[100px] h-[40px] object-contain hover:cursor-pointer' />

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-[300px] md:w-[400px]">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={onSearchChange}
              className="pl-12 h-11 bg-slate-50 dark:bg-slate-700 focus:border-slate-500 dark:focus:border-slate-400 rounded-lg"
            />
          </form>

          <div className='flex justify-center items-center gap-2'>
            <div className='flex items-center gap-5 border-r pr-5 mr-5 border-gray-300 dark:border-slate-700 '>
              <span onClick={() => router.push("/policy")}>Policy</span>
              <span onClick={() => router.push("/about")}>About Us</span>
            </div>
            <Bell className='w-5 h-5' />
            <ThemeSwitcher />
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger>
                <Avatar className="w-9 h-9 border border-gray-300 dark:border-slate-800 shadow-md hover:cursor-pointer">
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
                      <DropdownMenuSeparator className='block md:hidden' />
                      <DropdownMenuItem onClick={() => router.push('/')} className='block md:hidden'>Home</DropdownMenuItem>
                      <DropdownMenuItem className='block md:hidden'>Courses</DropdownMenuItem>
                      <DropdownMenuItem className='block md:hidden'>About</DropdownMenuItem>
                      <DropdownMenuItem className='block md:hidden'>Policy</DropdownMenuItem>
                      <DropdownMenuItem className='block md:hidden'>Store</DropdownMenuItem>
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
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header