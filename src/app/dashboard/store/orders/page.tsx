"use client";

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useAuthContext } from '@/hooks/useAuthContext';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import type { Order } from '@/types';
import { format } from 'date-fns';

export default function MyOrdersPage() {
    const { user } = useAuthContext();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                // This query requires a composite index on userId and createdAt.
                // It is better to fetch and sort in memory if the index is not created.
                const q = query(
                    collection(db, 'orders'),
                    where('userId', '==', user.uid)
                );
                const querySnapshot = await getDocs(q);
                const userOrders = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        createdAt: (data.createdAt as Timestamp).toDate(),
                    } as Order;
                });
                // Sort orders in memory instead of in the query
                userOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                setOrders(userOrders);
            } catch (error) {
                console.error("Error fetching orders:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if(user) {
            fetchOrders();
        }
    }, [user]);

    const getStatusVariant = (status: Order['status']) => {
        switch (status) {
            case 'Delivered': return 'default';
            case 'Pending': return 'secondary';
            case 'Shipped': return 'outline';
            case 'Cancelled': return 'destructive';
            default: return 'outline';
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[calc(100vh-theme(spacing.14))]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-4 space-y-4">
            <PageHeader title="My Orders" description="Track your purchases from the store." />

            <div className="space-y-4">
                {orders.length > 0 ? (
                    orders.map(order => (
                        <Card key={order.id}>
                            <CardHeader className="p-4">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-sm">Order ID: {order.id.slice(0, 8)}...</CardTitle>
                                    <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                                </div>
                                <CardDescription className="text-xs">
                                    {format(order.createdAt, 'PPp')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="flex items-center gap-4">
                                    <Image 
                                        src={order.productImage} 
                                        alt={order.productName} 
                                        width={48} 
                                        height={48}
                                        className="rounded-md border aspect-square object-contain"
                                    />
                                    <div className="flex-grow">
                                        <p className="font-semibold text-sm">{order.productName}</p>
                                        <p className="text-xs text-muted-foreground">Qty: 1</p>
                                    </div>
                                    <p className="font-semibold text-base">${order.price.toFixed(2)}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card>
                        <CardContent className="p-10 text-center">
                            <p className="text-muted-foreground text-sm">You haven't placed any orders yet.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

    