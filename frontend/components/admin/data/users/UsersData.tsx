"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import SearchUsers from "./SearchUsers";
import UsersTable from "./UsersTable";
import PaginationUsers from "./PaginationUsers";
import DeleteUsersModal from "./DeleteUsersModal";
import UserDetailModal from "./UserDetailModal";

interface IMedia {
    public_id?: string;
    url: string;
}

interface ISocial {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
}

interface IUserResponse {
    _id: string;
    name: string;
    email: string;
    role: string;
    isVerified: boolean;
    isSurveyCompleted: boolean;
    avatar: IMedia;
    socials: ISocial;
    createdAt: string;
    updatedAt: string;
}

interface PaginationInfo {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
}

interface FilterState {
    selectedRole: string;
    verificationStatus: string;
    surveyStatus: string;
    sortBy: string;
    sortOrder: string;
}

const UsersData = () => {
    const [allUsers, setAllUsers] = useState<IUserResponse[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo>({
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        pageSize: 10
    });
    const [loading, setLoading] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // Filter states
    const [filters, setFilters] = useState<FilterState>({
        selectedRole: "",
        verificationStatus: "all",
        surveyStatus: "all",
        sortBy: "createdAt",
        sortOrder: "desc"
    });

    // Modal states
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<IUserResponse | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [userToView, setUserToView] = useState<IUserResponse | null>(null);
    const [isViewing, setIsViewing] = useState(false);

    // Build query parameters
    const buildQueryParams = useCallback(() => {
        const params = new URLSearchParams();

        // Always include page and limit
        params.set('page', pagination.currentPage.toString());
        params.set('limit', pagination.pageSize.toString());

        // Add search keyword if present
        if (searchQuery.trim()) {
            params.set('keyword', searchQuery.trim());
        }

        // Add role filter if selected
        if (filters.selectedRole) {
            params.set('role', filters.selectedRole);
        }

        // Add verification status (only if not 'all')
        if (filters.verificationStatus !== 'all') {
            params.set('isVerified', filters.verificationStatus);
        }

        // Add survey status (only if not 'all')
        if (filters.surveyStatus !== 'all') {
            params.set('isSurveyCompleted', filters.surveyStatus);
        }

        // Add sort parameters
        if (filters.sortBy && filters.sortBy !== 'default') {
            params.set('sortBy', filters.sortBy);
            params.set('sortOrder', filters.sortOrder);
        }

        return params.toString();
    }, [pagination.currentPage, pagination.pageSize, searchQuery, filters]);

    // gọi hàm fetchUsers mỗi khi buildQueryParams thay đổi
    const handleFetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const queryParams = buildQueryParams();
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/admin/get_all_users?${queryParams}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: 'include',
                }
            );

            const usersData = await res.json();

            if (!res.ok) {
                toast.error(usersData.message || "Failed to fetch users");
                console.log("Fetching users failed: ", usersData.message);
                return;
            }

            setAllUsers(usersData.paginatedResult.data || []);
            setPagination({
                totalItems: usersData.paginatedResult.meta.totalItems,
                totalPages: usersData.paginatedResult.meta.totalPages,
                currentPage: usersData.paginatedResult.meta.currentPage,
                pageSize: usersData.paginatedResult.meta.pageSize
            });
        } catch (error: any) {
            toast.error("Error fetching users");
            console.log("Get all users error:", error?.message || error);
        } finally {
            setLoading(false);
        }
    }, [buildQueryParams]);

    // Fetch data when component mounts or when dependencies change
    useEffect(() => {
        handleFetchUsers();
    }, [handleFetchUsers]);

    // Reset về trang 1 khi search hoặc filter thay đổi
    useEffect(() => {
        if (pagination.currentPage !== 1) {
            setPagination(prev => ({ ...prev, currentPage: 1 }));
        }
    }, [searchQuery, filters]);

    const handleSearchChange = (value: string) => {
        setSearchInput(value);
    };

    const handleSearchSubmit = () => {
        setSearchQuery(searchInput.trim());
    };

    const handleClearSearch = () => {
        setSearchInput("");
        setSearchQuery("");
    };

    const handleFilterChange = (newFilters: Partial<FilterState>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleClearFilters = () => {
        setFilters({
            selectedRole: "",
            verificationStatus: "all",
            surveyStatus: "all",
            sortBy: "createdAt",
            sortOrder: "desc"
        });
    };

    // Pagination handlers
    const handlePageChange = (nextPage: number) => {
        setPagination(prev => ({ ...prev, currentPage: nextPage }));
    };

    const handleLimitChange = (nextLimit: number) => {
        setPagination(prev => ({
            ...prev,
            currentPage: 1,
            pageSize: nextLimit
        }));
    };

    // Delete handlers
    const handleDeleteClick = (user: IUserResponse) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;

        try {
            setIsDeleting(true);
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/admin/delete_user/${userToDelete._id}`,
                {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                }
            );

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Failed to delete user");
                console.log("Delete user failed: ", data.message);
                return;
            }

            toast.success("User deleted successfully");
            setIsDeleteModalOpen(false);
            setUserToDelete(null);

            // Refresh users list after deletion
            handleFetchUsers();
        } catch (err: any) {
            toast.error("Error deleting user");
            console.log(err?.message || err);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
    };

    // Available roles for filtering
    const roles = ["student", "admin", "tutor"];

    // Create pagination info for the PaginationUsers component
    const paginationInfo = {
        page: pagination.currentPage,
        limit: pagination.pageSize,
        total: pagination.totalItems,
        totalPages: pagination.totalPages,
        hasNextPage: pagination.currentPage < pagination.totalPages,
        hasPrevPage: pagination.currentPage > 1,
    };

    return (
        <div className="w-full p-4">
            <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-300 mt-1 uppercase font-semibold">
                    Manage and track all users
                </p>
            </div>

            <SearchUsers
                searchQuery={searchInput}
                onSearchChange={handleSearchChange}
                onSearchSubmit={handleSearchSubmit}
                onClearSearch={handleClearSearch}
                currentSearch={searchQuery}
                // Filter props
                roles={roles}
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
            />

            <UsersTable
                users={allUsers}
                onDelete={handleDeleteClick}
                isLoading={loading}
            />

            {!loading && allUsers.length > 0 && (
                <PaginationUsers
                    pagination={paginationInfo}
                    onPageChange={handlePageChange}
                    onLimitChange={handleLimitChange}
                    isLoading={loading}
                />
            )}

            <UserDetailModal
            />

            <DeleteUsersModal
                isOpen={isDeleteModalOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                userName={userToDelete?.name || ""}
                userEmail={userToDelete?.email || ""}
                isDeleting={isDeleting}
            />
        </div>
    );
};

export default UsersData;