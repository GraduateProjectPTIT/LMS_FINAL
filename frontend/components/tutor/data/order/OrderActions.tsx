"use client"

import React from 'react';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Copy } from "lucide-react";
import toast from 'react-hot-toast';

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

interface OrderActionsProps {
    order: IOrderResponse;
    selectedOrderId: string | null;
    setSelectedOrderId: React.Dispatch<React.SetStateAction<string | null>>;
    setOpenOrderDetailModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const OrderActions = ({ order, selectedOrderId, setSelectedOrderId, setOpenOrderDetailModal }: OrderActionsProps) => {

    const handleCopyId = () => {
        navigator.clipboard.writeText(order._id);
        toast.success("Order ID copied to clipboard");
    };

    const handleViewOrderDetail = (orderId: string) => {
        setSelectedOrderId(orderId);
        setOpenOrderDetailModal(true);
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
                <DropdownMenuItem onClick={handleCopyId} className="cursor-pointer">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Order ID
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleViewOrderDetail(order._id)} className="cursor-pointer">
                    <Eye className="mr-2 h-4 w-4" />
                    View Order
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default OrderActions