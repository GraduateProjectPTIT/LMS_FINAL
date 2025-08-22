import type { Metadata } from "next";
import { Poppins, Josefin_Sans } from "next/font/google";
import "../globals.css";

import CombineProvider from "@/providers/CombineProviders";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/tutor/sidebar/app-sidebar";
import TutorProtectedLayout from "@/providers/TutorProtectedLayout";

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
    title: "Tutor Dashboard",
    description: "Dashboard for tutor",
};

export default function TutorLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className={`${poppins.variable} ${josefin.variable} antialiased `}>
            <CombineProvider>
                <TutorProtectedLayout>
                    <SidebarProvider>
                        <AppSidebar />
                        <main className="w-full max-h-[1500px]">
                            <SidebarTrigger />
                            {children}
                        </main>
                    </SidebarProvider>
                </TutorProtectedLayout>
            </CombineProvider>
        </div>
    );
}
