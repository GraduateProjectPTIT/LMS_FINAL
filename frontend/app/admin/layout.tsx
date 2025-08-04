import type { Metadata } from "next";
import { Poppins, Josefin_Sans } from "next/font/google";
import "../globals.css";

import CombineProvider from "@/providers/CombineProviders";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/admin/sidebar/app-sidebar";
import AdminProtectedLayout from "@/providers/AdminProtectedLayout";

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-Poppins",
});
const josefin = Josefin_Sans({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-Josefin",
});

export const metadata: Metadata = {
    title: "Admin Dashboard",
    description: "Dashboard for administration",
};

export default function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className={`${poppins.variable} ${josefin.variable} antialiased `}>
            <CombineProvider>
                <AdminProtectedLayout>
                    <SidebarProvider>
                        <AppSidebar />
                        <main className="w-full max-h-[1500px]">
                            <SidebarTrigger />
                            {children}
                        </main>
                    </SidebarProvider>
                </AdminProtectedLayout>
            </CombineProvider>
        </div>
    );
}
