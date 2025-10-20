"use client"

import React, { useState } from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/redux/store"
import { Grip, LayoutDashboard, FileText, TvMinimalPlay, SlidersHorizontal, ChartNoAxesCombined } from "lucide-react"
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

import NavMain from "@/components/admin/sidebar/nav-main"
import NavUser from "@/components/admin/sidebar/nav-user"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, useSidebar, } from "@/components/ui/sidebar"
import { Separator } from "../../ui/separator"

const sectionData = {
    sections: [
        // Statistics for admin (user, course, revenue)
        {
            title: "Statistics",
            url: "/admin/statistics",
            icon: ChartNoAxesCombined,
            isOpen: false,
            items: [
                {
                    title: "Users Analytics",
                    url: "/admin/statistics/users",
                    value: "users_analytic",
                },
                {
                    title: "Courses Analytics",
                    url: "/admin/statistics/courses",
                    value: "courses_analytic",
                },
                {
                    title: "Revenue Analytics",
                    url: "/admin/statistics/revenues",
                    value: "revenue_analytic",
                },
            ],
        },
        // Data for admin (user, course, order)
        {
            title: "Data",
            url: "/admin/data",
            icon: FileText,
            isOpen: false,
            items: [
                {
                    title: "Users Data",
                    url: "/admin/data/users",
                    value: "users_data",
                },
                {
                    title: "Courses Data",
                    url: "/admin/data/courses",
                    value: "courses_data",
                },
                {
                    title: "Orders Data",
                    url: "/admin/data/orders",
                    value: "orders_data",
                },
            ],
        },
        // Manage system layout
        {
            title: "Customization",
            url: "/admin/customizations",
            icon: SlidersHorizontal,
            isOpen: false,
            items: [
                {
                    title: "Hero",
                    url: "/admin/customizations/hero",
                    value: "hero",
                },
                {
                    title: "FAQ",
                    url: "/admin/customizations/faq",
                    value: "faq",
                },
                {
                    title: "Categories",
                    url: "/admin/customizations/categories",
                    value: "categories",
                },
            ],
        },
        // Posts management
        {
            title: "Posts",
            url: "/admin/posts",
            icon: FileText,
            isOpen: false,
            items: [
                {
                    title: "Manage Posts",
                    url: "/admin/posts",
                    value: "manage_posts",
                },
            ],
        },
    ]
}

const headerData = {
    title: "Dashboard",
    icon: Grip,
}

const AppSidebar = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {

    const { currentUser } = useSelector((state: RootState) => state.user);
    const { state } = useSidebar();
    const pathname = usePathname();

    // để kiểm tra xem pathname có bằng sections.items.url không và thêm thuộc tính isActive vào các phần
    const sectionWithActiveState = sectionData.sections.map((section) => {
        const isActiveItem = pathname === section.url || section.items?.some((subItem) => pathname === subItem.url);
        return { ...section, isActive: isActiveItem };
    })

    return (
        <Sidebar
            collapsible="icon"
            {...props}
            className="h-screen max-h-[1500px] border border-t-0 border-l-0 border-gray-300 dark:border-slate-700"
        >
            <SidebarHeader>
                <div className="my-[10px] h-[22px] flex items-center justify-center gap-[10px]">
                    <headerData.icon className="w-5 h-5 text-blue-500 dark:text-blue-300" />
                    {
                        state === "expanded" && (
                            <motion.span
                                className="text-2xl text-blue-500 dark:text-blue-300 uppercase font-bold whitespace-nowrap"
                                initial={{ opacity: 0, width: 0 }}
                                animate={{
                                    opacity: state === "expanded" ? 1 : 0,
                                    width: state === "expanded" ? "auto" : 0,
                                }}
                            >
                                {headerData.title}
                            </motion.span>
                        )
                    }
                </div>
            </SidebarHeader>
            <Separator className="border dark:border-slate-600" />
            <SidebarContent>
                <NavMain sectionItems={sectionWithActiveState} pathname={pathname} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={currentUser} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}

export default AppSidebar
