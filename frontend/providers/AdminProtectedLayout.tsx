"use client";

import AdminProtected from "@/hooks/useAdminProtected";

const AdminProtectedLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <AdminProtected>
            {children}
        </AdminProtected>
    )
}

export default AdminProtectedLayout;
