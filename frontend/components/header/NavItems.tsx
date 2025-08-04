import React from 'react'
import Link from 'next/link';
import { usePathname } from 'next/navigation'

export const navItemsData = [
    { name: "Home", url: "/" },
    { name: "Courses", url: "/courses" },
];

const NavItems = () => {
    const pathname = usePathname();

    return (
        <div className="hidden md:flex md:gap-1 xl:gap-6 items-center">
            {navItemsData.map((item, index) => {
                const isActive = pathname === item.url;
                return (
                    <Link
                        href={item.url}
                        key={index}
                        className={`
                            group text-[18px] px-6 cursor-pointer relative transition-colors duration-300
                            ${isActive
                                ? "dark:text-[#37a39a] text-[crimson]"
                                : "dark:text-white text-black hover:text-[crimson] dark:hover:text-[#37a39a]"
                            }
                        `}
                    >
                        {/* Animated bar */}
                        <span
                            className={`
                                absolute left-1/2 -translate-x-1/2
                                h-[3px] w-[30px] rounded-full
                                transition-all duration-300
                                ${isActive
                                    ? "top-[-10px] opacity-100 dark:bg-[#37a39a] bg-red-600"
                                    : "top-[-10px] opacity-0 group-hover:top-[-8px] group-hover:opacity-100 dark:group-hover:bg-[#37a39a] group-hover:bg-red-600"
                                }
                            `}
                        />
                        {item.name}
                    </Link>
                );
            })}
        </div>
    );
}

export default NavItems;
