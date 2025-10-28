"use client";

import React, { useEffect, useState, useCallback } from "react";
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

    // Search states
    const [searchInput, setSearchInput] = useState("");
    const [appliedSearchQuery, setAppliedSearchQuery] = useState("");

    // Draft filters - được cập nhật khi user thay đổi trong UI
    const [draftFilters, setDraftFilters] = useState<FilterState>({
        selectedRole: "",
        verificationStatus: "all",
        surveyStatus: "all",
        sortBy: "createdAt",
        sortOrder: "desc"
    });

    // Applied filters - chỉ được cập nhật khi user ấn "Apply Filters"
    const [appliedFilters, setAppliedFilters] = useState<FilterState>({
        selectedRole: "",
        verificationStatus: "all",
        surveyStatus: "all",
        sortBy: "createdAt",
        sortOrder: "desc"
    });

    const [openUserDetailModal, setOpenUserDetailModal] = useState(false);

    // Modal states
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<IUserResponse | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Build query parameters dựa trên appliedFilters
    const buildQueryParams = useCallback(() => {
        const params = new URLSearchParams();

        params.set('page', pagination.currentPage.toString());
        params.set('limit', pagination.pageSize.toString());

        // Add search keyword if present
        if (appliedSearchQuery.trim()) {
            params.set('keyword', appliedSearchQuery.trim());
        }

        // Add role filter if selected
        if (appliedFilters.selectedRole) {
            params.set('role', appliedFilters.selectedRole);
        }

        // Add verification status (only if not 'all')
        if (appliedFilters.verificationStatus !== 'all') {
            params.set('isVerified', appliedFilters.verificationStatus);
        }

        // Add survey status (only if not 'all')
        if (appliedFilters.surveyStatus !== 'all') {
            params.set('isSurveyCompleted', appliedFilters.surveyStatus);
        }

        // Add sort parameters
        params.set('sortBy', appliedFilters.sortBy);
        params.set('sortOrder', appliedFilters.sortOrder);

        return params.toString();
    }, [pagination.currentPage, pagination.pageSize, appliedSearchQuery, appliedFilters]);

    // Fetch users
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

    // Fetch data khi component mount hoặc khi appliedFilters/pagination thay đổi
    useEffect(() => {
        handleFetchUsers();
    }, [handleFetchUsers]);

    // Search handlers
    const handleSearchChange = (value: string) => {
        setSearchInput(value);
    };

    const handleSearchSubmit = () => {
        setAppliedSearchQuery(searchInput.trim());
        // Reset về trang 1 khi search mới
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleClearSearch = () => {
        setSearchInput("");
        setAppliedSearchQuery("");
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Cập nhật draft filters khi user thay đổi trong UI
    const handleDraftFiltersChange = (newFilters: Partial<FilterState>) => {
        setDraftFilters(prev => ({ ...prev, ...newFilters }));
    };

    // Apply filters - được gọi khi user ấn nút "Apply Filters"
    const handleApplyFilters = () => {
        setAppliedFilters(draftFilters);
        // Reset về trang 1 khi apply filters mới
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Clear filters - reset cả draft và applied filters
    const handleClearFilters = () => {
        const defaultFilters: FilterState = {
            selectedRole: "",
            verificationStatus: "all",
            surveyStatus: "all",
            sortBy: "createdAt",
            sortOrder: "desc"
        };
        setDraftFilters(defaultFilters);
        setAppliedFilters(defaultFilters);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleRemoveFilter = (filterKey: keyof FilterState) => {
        const defaultValue = filterKey === 'selectedRole' ? '' :
            filterKey === 'sortBy' ? 'createdAt' :
                filterKey === 'sortOrder' ? 'desc' : 'all';

        setDraftFilters(prev => ({ ...prev, [filterKey]: defaultValue }));
        setAppliedFilters(prev => ({ ...prev, [filterKey]: defaultValue }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleRemoveSortFilter = () => {
        setDraftFilters(prev => ({
            ...prev,
            sortBy: 'createdAt',
            sortOrder: 'desc'
        }));
        setAppliedFilters(prev => ({
            ...prev,
            sortBy: 'createdAt',
            sortOrder: 'desc'
        }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
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

    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    return (
        <div className="w-full">
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
                currentSearch={appliedSearchQuery}
                roles={roles}
                filters={draftFilters}
                appliedFilters={appliedFilters}
                onFilterChange={handleDraftFiltersChange}
                onApplyFilters={handleApplyFilters}
                onClearFilters={handleClearFilters}
                onRemoveFilter={handleRemoveFilter}
                onRemoveSortFilter={handleRemoveSortFilter}
            />

            <UsersTable
                users={allUsers}
                onDelete={handleDeleteClick}
                isLoading={loading}
                setOpenUserDetailModal={setOpenUserDetailModal}
                setSelectedUserId={setSelectedUserId}
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
                isOpen={openUserDetailModal}
                onClose={() => {
                    setOpenUserDetailModal(false);
                    setSelectedUserId(null);
                }}
                userId={selectedUserId}
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