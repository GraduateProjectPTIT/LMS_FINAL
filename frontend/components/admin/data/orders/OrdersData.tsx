"use client";

import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import SearchOrders from "./SearchOrders";
import OrdersTable from "./OrdersTable";
import PaginationOrders from "./PaginationOrders";

interface IPaymentInfo {
    id: string;
    status: string;
    amount: number;
    currency: string;
    payer_id?: string;
    order_token?: string;
    payer_email?: string;
    payer_name?: string;
}

interface IOrderItem {
    courseId: string;
    price: number;
    _id: string;
}

interface IOrderResponse {
    _id: string;
    payment_info: IPaymentInfo;
    payment_method: string;
    userId: string;
    items: IOrderItem[];
    total: number;
    emailSent: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

interface PaginationInfo {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
}

interface FilterState {
    status: string;
    method: string;
    dateFrom: string;
    dateTo: string;
    sortBy: string;
    sortOrder: string;
}

const OrdersData = () => {
    const [allOrders, setAllOrders] = useState<IOrderResponse[]>([]);
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
        status: "all",
        method: "all",
        dateFrom: "",
        dateTo: "",
        sortBy: "createdAt",
        sortOrder: "desc"
    });

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

        // Add status filter if selected
        if (filters.status && filters.status !== 'all') {
            params.set('status', filters.status);
        }

        // Add payment method filter if selected
        if (filters.method && filters.method !== 'all') {
            params.set('method', filters.method);
        }

        // Add date range filters
        if (filters.dateFrom) {
            params.set('dateFrom', filters.dateFrom);
        }
        if (filters.dateTo) {
            params.set('dateTo', filters.dateTo);
        }

        // Add sort parameters
        if (filters.sortBy && filters.sortBy !== 'default') {
            params.set('sortBy', filters.sortBy);
            params.set('sortOrder', filters.sortOrder);
        }

        return params.toString();
    }, [pagination.currentPage, pagination.pageSize, searchQuery, filters]);

    // Fetch orders
    const handleFetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const queryParams = buildQueryParams();
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/order/get_all_orders?${queryParams}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: 'include',
                }
            );

            const ordersData = await res.json();

            if (!res.ok) {
                toast.error(ordersData.message || "Failed to fetch orders");
                console.log("Fetching orders failed: ", ordersData.message);
                return;
            }

            setAllOrders(ordersData.paginatedResult.data || []);
            setPagination({
                totalItems: ordersData.paginatedResult.meta.totalItems,
                totalPages: ordersData.paginatedResult.meta.totalPages,
                currentPage: ordersData.paginatedResult.meta.currentPage,
                pageSize: ordersData.paginatedResult.meta.pageSize
            });
        } catch (error: any) {
            toast.error("Error fetching orders");
            console.log("Get all orders error:", error?.message || error);
        } finally {
            setLoading(false);
        }
    }, [buildQueryParams]);

    // Fetch data when component mounts or when dependencies change
    useEffect(() => {
        handleFetchOrders();
    }, [handleFetchOrders]);

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
            status: "all",
            method: "all",
            dateFrom: "",
            dateTo: "",
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

    // Available payment statuses and methods for filtering
    const paymentStatuses = ["succeeded", "pending", "failed"];
    const paymentMethods = ["paypal", "stripe", "momo"];

    // Create pagination info for the PaginationOrders component
    const paginationInfo = {
        page: pagination.currentPage,
        limit: pagination.pageSize,
        total: pagination.totalItems,
        totalPages: pagination.totalPages,
        hasNextPage: pagination.currentPage < pagination.totalPages,
        hasPrevPage: pagination.currentPage > 1,
    };

    return (
        <div className="w-full">
            <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-300 mt-1 uppercase font-semibold">
                    Manage and track all orders
                </p>
            </div>

            <SearchOrders
                searchQuery={searchInput}
                onSearchChange={handleSearchChange}
                onSearchSubmit={handleSearchSubmit}
                onClearSearch={handleClearSearch}
                currentSearch={searchQuery}
                paymentStatuses={paymentStatuses}
                paymentMethods={paymentMethods}
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
            />

            <OrdersTable
                orders={allOrders}
                isLoading={loading}
            />

            {!loading && allOrders.length > 0 && (
                <PaginationOrders
                    pagination={paginationInfo}
                    onPageChange={handlePageChange}
                    onLimitChange={handleLimitChange}
                    isLoading={loading}
                />
            )}
        </div>
    );
};

export default OrdersData;