"use client"

import { Bell, ChevronsUpDown, House } from "lucide-react"
import { BiMoon, BiSun } from "react-icons/bi"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"

import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"


interface NavUserProps {
    user: {
        name: string
        email: string
        avatar: any
    }
}

const NavUser = ({ user }: NavUserProps) => {
    const { isMobile } = useSidebar()
    const router = useRouter();
    const { theme, setTheme, systemTheme } = useTheme();

    const currentTheme = theme === 'system' ? systemTheme : theme;


    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>

                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg border">
                                {
                                    user?.avatar.url ? (
                                        <>
                                            <AvatarImage src={user.avatar.url} />
                                            <AvatarFallback>CN</AvatarFallback>
                                        </>
                                    ) : (
                                        <>
                                            <AvatarImage src="/anonymous.png" />
                                            <AvatarFallback>CN</AvatarFallback>
                                        </>
                                    )
                                }
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">{user.name}</span>
                                <span className="truncate text-xs">{user.email}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>

                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        {/* user information */}
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    {
                                        user?.avatar.url ? (
                                            <>
                                                <AvatarImage src={user.avatar.url} />
                                                <AvatarFallback>CN</AvatarFallback>
                                            </>
                                        ) : (
                                            <>
                                                <AvatarImage src="/anonymous.png" />
                                                <AvatarFallback>CN</AvatarFallback>
                                            </>
                                        )
                                    }
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">{user.name}</span>
                                    <span className="truncate text-xs">{user.email}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>

                        <DropdownMenuSeparator />

                        {/* change theme mode */}
                        <DropdownMenuGroup>
                            <DropdownMenuItem
                                onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
                                className="flex justify-start gap-2 cursor-pointer"
                            >
                                <button
                                    className="flex items-center justify-center cursor-pointer"

                                    aria-label="Toggle Theme"
                                >
                                    {currentTheme === 'dark' ? <BiSun size={25} /> : <BiMoon size={25} />}
                                </button>
                                {
                                    theme === "light" ? "Dark Mode" : "Light Mode"
                                }

                            </DropdownMenuItem>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator />

                        <DropdownMenuGroup>
                            <DropdownMenuItem
                                onClick={() => router.push("/notifications")}
                            >
                                <Bell />
                                Notifications
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.replace("/")}>
                                <House />
                                Back to application
                            </DropdownMenuItem>
                        </DropdownMenuGroup>

                    </DropdownMenuContent>

                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}

export default NavUser;
