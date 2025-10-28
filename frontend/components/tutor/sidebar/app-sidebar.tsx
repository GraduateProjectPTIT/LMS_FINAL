"use client"

import React from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/redux/store"
import { Grip, FileText, TvMinimalPlay } from "lucide-react"
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

import NavMain from "@/components/tutor/sidebar/nav-main"
import NavUser from "@/components/tutor/sidebar/nav-user"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, useSidebar, } from "@/components/ui/sidebar"
import { Separator } from "../../ui/separator"

const sectionData = {
    sections: [
        // Data for tutor (course, student, order)
        {
            title: "Data",
            url: "/tutor/data",
            icon: FileText,
            isOpen: false,
            items: [
                {
                    title: "Courses Data",
                    url: "/tutor/data/courses",
                    value: "courses_data",
                },
                {
                    title: "Orders Data",
                    url: "/tutor/data/orders",
                    value: "orders_data",
                },
            ],
        },
        // Manage course for tutor
        {
            title: "Courses",
            url: "/tutor/courses",
            icon: TvMinimalPlay,
            items: [
                {
                    title: "Create Course",
                    url: "/tutor/courses/create_course",
                    value: "create_course",
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
