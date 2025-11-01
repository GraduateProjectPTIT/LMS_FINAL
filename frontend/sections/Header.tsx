'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { signOut } from "next-auth/react";
import { signOutSuccess } from '@/redux/user/userSlice';
import { clearAll } from "@/redux/cart/cartSlice";
import { clearNotificationsState } from '@/redux/notification/notificationSlice';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import { useSearchHistory } from '@/hooks/useSearchHistory';

import SidebarMenuPanel from '@/sections/SidebarMenuPanel';
import ThemeSwitcher from '@/components/header/ThemeSwitcher'
import MobileSearch from '@/components/header/MobileSearch'
import Notifications from '@/components/header/Notifications';

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
import { Search, Menu, Clock, X, Trash2, ShoppingCart } from 'lucide-react';

import AnonymousImage from "@/public/anonymous.png"
import Logo from "@/assets/logo-lms.png"

const Header = () => {

  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state: RootState) => state.user);
  const { totalItems } = useSelector((state: RootState) => state.cart);
  const { history, addHistory, removeHistory, clearHistory } = useSearchHistory();

  // state management
  const urlSearchTerm = searchParams?.get('search') || '';

  const [searchTerm, setSearchTerm] = useState(urlSearchTerm);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isDesktopSearchHistoryVisible, setIsDesktopSearchHistoryVisible] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false); // check để tự động đóng mobile search nếu ở màn hình desktop

  const desktopSearchRef = useRef<HTMLDivElement>(null);

  // Theo dõi screen size và tự động đóng mobile search khi chuyển sang desktop
  useEffect(() => {
    const checkScreenSize = () => {
      const isDesktopSize = window.innerWidth >= 768; // md breakpoint
      setIsDesktop(isDesktopSize);

      // Tự động đóng mobile search khi chuyển sang desktop
      if (isDesktopSize && isMobileSearchOpen) {
        setIsMobileSearchOpen(false);
      }

      // Tự động đóng mobile menu khi chuyển sang desktop
      if (isDesktopSize && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, [isMobileSearchOpen, isMobileMenuOpen]);

  // Đồng bộ state với URL
  useEffect(() => {
    setSearchTerm(urlSearchTerm);
  }, [urlSearchTerm]);

  // Xử lý click ra ngoài để đóng search history trên desktop
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Nếu click không nằm trong vùng desktopSearchRef (ô tìm kiếm)
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(event.target as Node)) {
        setIsDesktopSearchHistoryVisible(false);
      }
    }

    // Khi dropdown lịch sử tìm kiếm đang mở, thêm listener để bắt sự kiện click ngoài
    if (isDesktopSearchHistoryVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Cleanup: khi component unmount hoặc khi dropdown đóng
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDesktopSearchHistoryVisible]);

  const handleMenuToggle = (isOpen: boolean) => setIsMobileMenuOpen(isOpen);
  const handleSearchToggle = (isOpen: boolean) => setIsMobileSearchOpen(isOpen);

  const handleDesktopSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      addHistory(searchTerm.trim());
      router.push(`/courses/search?keyword=${searchTerm}`);
      setIsDesktopSearchHistoryVisible(false);
    }
  };

  const handleDesktopHistoryClick = (term: string) => {
    addHistory(term);
    setSearchTerm(term);
    router.push(`/courses/search?keyword=${term}`);
    setIsDesktopSearchHistoryVisible(false);
  };

  const handleDesktopInputFocus = () => {
    setIsDesktopSearchHistoryVisible(true);
  };

  const handleDesktopInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsDesktopSearchHistoryVisible(true);
  };

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.message || "Logout failed.");
        return;
      }

      dispatch(signOutSuccess());
      dispatch(clearAll());
      dispatch(clearNotificationsState());
      toast.success("Logout successfully");
      router.replace('/');
    } catch (error: any) {
      toast.error(error.message || "An error occurred during logout.");
    }
  };

  return (
    <>
      <header className="sticky top-0 backdrop-blur-sm z-20 theme-mode shadow-sm dark:shadow-slate-700">
        <div className='container'>
          <div className="flex justify-between items-center p-5">
            {/* Left Side: Menu (mobile) & Logo */}
            <Menu
              onClick={() => handleMenuToggle(true)}
              className="w-6 h-6 block md:hidden hover:cursor-pointer text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"
            />

            <Image onClick={() => router.push("/")} src={Logo} alt="logo" className='hidden md:block w-[100px] h-[40px] object-contain hover:cursor-pointer' />

            {/* Middle: Desktop Search Bar */}
            <div ref={desktopSearchRef} className="hidden md:block relative w-[300px] md:w-[400px]">
              <form onSubmit={handleDesktopSearchSubmit}>
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="What are you looking for?"
                  value={searchTerm}
                  onChange={handleDesktopInputChange}
                  onFocus={handleDesktopInputFocus}
                  className="pl-12 h-11 bg-slate-50 dark:bg-slate-700 focus:border-slate-500 dark:focus:border-slate-400 rounded-lg"
                />
              </form>

              {/* Desktop Search History Dropdown */}
              {isDesktopSearchHistoryVisible && history.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg z-50">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent searches</span>
                      <button
                        onClick={() => {
                          clearHistory();
                          setIsDesktopSearchHistoryVisible(false);
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        Clear all
                      </button>
                    </div>
                    <div className="space-y-1">
                      {history.map((term, index) => (
                        <div
                          key={index}
                          className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 group transition-colors"
                        >
                          <button
                            onClick={() => handleDesktopHistoryClick(term)}
                            className="flex items-center gap-3 flex-1 text-left"
                          >
                            <Clock className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                            <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                              {term}
                            </span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeHistory(term);
                            }}
                            className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side: Navigation, Actions, and User Menu */}
            <div className='flex justify-center items-center gap-1 md:gap-2'>
              {/* Desktop Links */}
              <div className='hidden md:flex items-center gap-5 border-r pr-5 mr-5 border-gray-300 dark:border-slate-700 '>
                <Link href="/posts" className="hover:cursor-pointer hover:font-semibold">Posts</Link>
                {
                  currentUser?.role === 'student' && (
                    <Link href="/my-courses" className="hover:cursor-pointer hover:font-semibold">My Courses</Link>
                  )
                }
              </div>

              {/* Mobile and Desktop Icons */}
              <div className="flex justify-center items-center gap-5">
                <Search
                  onClick={() => handleSearchToggle(true)}
                  className='w-5 h-5 block md:hidden hover:cursor-pointer text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors'
                />

                <div className='relative'>
                  <ShoppingCart
                    onClick={() => router.push('/cart')}
                    className='w-5 h-5 hover:cursor-pointer text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors'
                  />

                  {currentUser && totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full"></span>
                  )}
                </div>

                <Notifications />

                <ThemeSwitcher />

                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Avatar className="w-7 h-7 border border-gray-300 dark:border-slate-800 shadow-md hover:cursor-pointer">
                      <AvatarImage src={currentUser?.avatar?.url || AnonymousImage.src} />
                      <AvatarFallback>
                        {currentUser?.name?.slice(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {currentUser ? (
                      <>
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {currentUser.role === 'admin' && (
                          <Link href="/admin"><DropdownMenuItem>Dashboard</DropdownMenuItem></Link>
                        )}
                        {currentUser.role === 'tutor' && (
                          <Link href="/tutor"><DropdownMenuItem>Dashboard</DropdownMenuItem></Link>
                        )}
                        <Link href="/profile"><DropdownMenuItem>Profile</DropdownMenuItem></Link>
                        <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <Link href="/signup"><DropdownMenuItem>Signup</DropdownMenuItem></Link>
                        <Link href="/login"><DropdownMenuItem>Login</DropdownMenuItem></Link>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search Component */}
        {!isDesktop && (
          <MobileSearch
            isOpen={isMobileSearchOpen}
            setIsOpen={setIsMobileSearchOpen}
            onClose={() => handleSearchToggle(false)}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            history={history}
            onAddHistory={addHistory}
            onRemoveHistory={removeHistory}
            onClearHistory={clearHistory}
          />
        )}
      </header>

      {/* Mobile Sidebar Panel and Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => handleMenuToggle(false)}
          className="fixed inset-0 bg-black/50 z-40"
        />
      )}

      <SidebarMenuPanel
        closeMainMenu={() => handleMenuToggle(false)}
        isMobileMenuOpen={isMobileMenuOpen}
      />
    </>
  )
}

export default Header