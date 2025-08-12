"use client"

import { useState } from "react"
import { LayoutDashboard, ChevronRight, type LucideIcon } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from "@/components/ui/sidebar"
import Link from "next/link";

interface NavMainProps {
    sectionItems: {
        title: string
        url?: string
        icon?: LucideIcon
        isActive?: boolean
        isOpen?: boolean,
        items?: {
            title: string
            url: string
            value: string
        }[]
    }[],
    selected: string;
    handleSelect: (value1: string, value2: string) => void
}

const NavMain = ({ sectionItems, selected, handleSelect }: NavMainProps) => {

    return (
        <SidebarGroup>

            <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
            <Link
                href="/admin"
                onClick={() => handleSelect("dashboard", "dashboard")}
            >
                <SidebarMenuButton className={`cursor-pointer hover:bg-gray-200 hover:text-blue-500 dark:hover:bg-slate-700 dark:hover:text-blue-400 ${selected === "dashboard" ? "bg-gray-200 dark:bg-slate-600 text-blue-500 dark:text-blue-400" : ""}  `}>
                    <LayoutDashboard />
                    <span className="text-[16px] font-[500]">Dashboard</span>

                </SidebarMenuButton>
            </Link>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarMenu>
                {sectionItems.map((section, index) => {

                    const hasChildren = section.items && section.items.length > 0;

                    return (
                        <Collapsible
                            key={index}
                            asChild
                            defaultOpen={section.isOpen}
                            className="group/collapsible"
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton
                                        className={`${section.isActive
                                            ? "bg-gray-200 dark:bg-slate-600 text-blue-500 dark:text-blue-400"
                                            : "hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-slate-700 dark:hover:text-blue-400"
                                            }`}
                                        tooltip={section.title}
                                    >
                                        {section.icon && <section.icon />}
                                        <span className="text-[16px] font-[500]">{section.title}</span>
                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                {
                                    hasChildren && (
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {section.items?.map((subSection, index) => {
                                                    return (
                                                        <SidebarMenuSubItem key={index}>
                                                            <SidebarMenuSubButton asChild>
                                                                <Link
                                                                    onClick={() => handleSelect(section.title, subSection.title)}
                                                                    href={subSection.url}
                                                                    className={` hover:bg-gray-300 hover:text-blue-500 dark:hover:bg-slate-700 dark:hover:text-blue-400
                                                                        ${subSection.title === selected ? "font-semibold text-blue-500 dark:text-blue-400" : ""}`}
                                                                >
                                                                    {subSection.title}
                                                                </Link>
                                                            </SidebarMenuSubButton>
                                                        </SidebarMenuSubItem>
                                                    )
                                                })}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    )
                                }
                            </SidebarMenuItem>
                        </Collapsible>
                    )

                })}
            </SidebarMenu>
        </SidebarGroup>
    )
}

export default NavMain