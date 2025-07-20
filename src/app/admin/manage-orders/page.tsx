
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal } from "lucide-react";
import { getOrders, updateOrderStatus } from "../actions";
import type { Order } from "@/types";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export default function ManageOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const data = await getOrders();
            setOrders(data);
        } catch (error) {
            toast({ variant: "destructive", title: "خطأ", description: "تعذر جلب الطلبات." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleStatusUpdate = async (orderId: string, status: Order['status']) => {
        const result = await updateOrderStatus(orderId, status);
        if (result.success) {
            toast({ title: "نجاح", description: result.message });
            fetchOrders(); // Refetch to show updated status
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
        }
    };
    
    const getStatusVariant = (status: Order['status']) => {
        switch (status) {
            case 'Delivered': return 'default';
            case 'Pending': return 'secondary';
            case 'Shipped': return 'outline';
            case 'Cancelled': return 'destructive';
            default: return 'outline';
        }
    };
    
    const getStatusText = (status: Order['status']) => {
        switch (status) {
            case 'Delivered': return 'تم التوصيل';
            case 'Pending': return 'قيد الانتظار';
            case 'Shipped': return 'تم الشحن';
            case 'Cancelled': return 'ملغي';
            default: return status;
        }
    };

    const statusOptions = {
        'Pending': 'تحديد كـ قيد الانتظار',
        'Shipped': 'تحديد كـ تم الشحن',
        'Delivered': 'تحديد كـ تم التوصيل',
        'Cancelled': 'تحديد كـ ملغي',
    }

    return (
        <div className="container mx-auto space-y-6">
            <PageHeader
                title="إدارة الطلبات"
                description="عرض وتحديث طلبات متجر المستخدمين."
            />
            <Card>
                <CardHeader>
                    <CardTitle>كل الطلبات</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>التاريخ</TableHead>
                                        <TableHead>المنتج</TableHead>
                                        <TableHead>العميل</TableHead>
                                        <TableHead>الهاتف</TableHead>
                                        <TableHead>السعر</TableHead>
                                        <TableHead>الحالة</TableHead>
                                        <TableHead className="text-left">الإجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell>{format(order.createdAt, "PP")}</TableCell>
                                            <TableCell className="flex items-center gap-2">
                                                <Image src={order.productImage} alt={order.productName} width={32} height={32} className="rounded-md" />
                                                <span className="font-medium">{order.productName}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div>{order.userName}</div>
                                                <div className="text-xs text-muted-foreground">{order.userEmail}</div>
                                            </TableCell>
                                            <TableCell>{order.deliveryPhoneNumber}</TableCell>
                                            <TableCell>${order.price.toFixed(2)}</TableCell>
                                            <TableCell><Badge variant={getStatusVariant(order.status)}>{getStatusText(order.status)}</Badge></TableCell>
                                            <TableCell className="text-left">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        {(Object.keys(statusOptions) as Array<keyof typeof statusOptions>).map(status => (
                                                            <DropdownMenuItem key={status} onClick={() => handleStatusUpdate(order.id, status)} disabled={order.status === status}>
                                                                {statusOptions[status]}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
