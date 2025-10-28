"use client";

import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import SearchOrders from "./SearchOrders";
import OrdersTable from "./OrdersTable";
import PaginationOrders from "./PaginationOrders";
import OrderDetailModal from "./OrderDetailModal";

interface IPaymentInfo {
    id: string;
    status: string;
    amount: number;
    currency: string;
    payer_id?: string;
    order_token?: string;
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
    const [openOrderDetailModal, setOpenOrderDetailModal] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    // Draft filters - được cập nhật khi user thay đổi trong UI
    const [draftFilters, setDraftFilters] = useState<FilterState>({
        status: "all",
        method: "all",
        dateFrom: "",
        dateTo: "",
        sortBy: "createdAt",
        sortOrder: "desc"
    });

    // Applied filters - chỉ được cập nhật khi user ấn "Apply Filters"
    const [appliedFilters, setAppliedFilters] = useState<FilterState>({
        status: "all",
        method: "all",
        dateFrom: "",
        dateTo: "",
        sortBy: "createdAt",
        sortOrder: "desc"
    });

    // Build query parameters dựa trên appliedFilters
    const buildQueryParams = useCallback(() => {
        const params = new URLSearchParams();

        params.set('page', pagination.currentPage.toString());
        params.set('limit', pagination.pageSize.toString());

        if (appliedFilters.status && appliedFilters.status !== 'all') {
            params.set('status', appliedFilters.status);
        }

        if (appliedFilters.method && appliedFilters.method !== 'all') {
            params.set('method', appliedFilters.method);
        }

        if (appliedFilters.dateFrom) {
            params.set('dateFrom', appliedFilters.dateFrom);
        }

        if (appliedFilters.dateTo) {
            params.set('dateTo', appliedFilters.dateTo);
        }

        params.set('sortBy', appliedFilters.sortBy);
        params.set('sortOrder', appliedFilters.sortOrder);

        return params.toString();
    }, [pagination.currentPage, pagination.pageSize, appliedFilters]);

    // Fetch orders
    const handleFetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const queryParams = buildQueryParams();
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/order/tutor/get_orders?${queryParams}`,
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

    // Fetch data khi component mount hoặc khi appliedFilters/pagination thay đổi
    useEffect(() => {
        handleFetchOrders();
    }, [handleFetchOrders]);

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
            status: "all",
            method: "all",
            dateFrom: "",
            dateTo: "",
            sortBy: "createdAt",
            sortOrder: "desc"
        };
        setDraftFilters(defaultFilters);
        setAppliedFilters(defaultFilters);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleRemoveFilter = (filterKey: keyof FilterState) => {
        setDraftFilters(prev => ({
            ...prev,
            [filterKey]: filterKey === 'sortBy' ? 'createdAt' : filterKey === 'sortOrder' ? 'desc' : ''
        }));
        setAppliedFilters(prev => ({
            ...prev,
            [filterKey]: filterKey === 'sortBy' ? 'createdAt' : filterKey === 'sortOrder' ? 'desc' : ''
        }));
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
                paymentStatuses={paymentStatuses}
                paymentMethods={paymentMethods}
                filters={draftFilters}
                appliedFilters={appliedFilters}
                onFilterChange={handleDraftFiltersChange}
                onApplyFilters={handleApplyFilters}
                onClearFilters={handleClearFilters}
                onRemoveFilter={handleRemoveFilter}
                onRemoveSortFilter={handleRemoveSortFilter}
            />

            <OrdersTable
                orders={allOrders}
                isLoading={loading}
                selectedOrderId={selectedOrderId}
                setSelectedOrderId={setSelectedOrderId}
                setOpenOrderDetailModal={setOpenOrderDetailModal}
            />

            {!loading && allOrders.length > 0 && (
                <PaginationOrders
                    pagination={paginationInfo}
                    onPageChange={handlePageChange}
                    onLimitChange={handleLimitChange}
                    isLoading={loading}
                />
            )}

            <OrderDetailModal
                isOpen={openOrderDetailModal}
                onClose={() => {
                    setOpenOrderDetailModal(false);
                    setSelectedOrderId(null);
                }}
                orderId={selectedOrderId}
            />
        </div>
    );
};

export default OrdersData;