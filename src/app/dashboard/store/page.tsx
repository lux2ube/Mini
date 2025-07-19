
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getProducts, getCategories } from '@/app/admin/actions';
import type { Product, ProductCategory, Order } from '@/types';
import { Loader2, ShoppingCart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthContext } from '@/hooks/useAuthContext';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';

function ProductCard({ product }: { product: Product }) {
    return (
        <Card className="flex flex-col overflow-hidden">
            <div className="aspect-square relative w-full">
                <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                    data-ai-hint="product image"
                />
            </div>
            <div className="p-2 flex-grow flex flex-col">
                <h3 className="font-semibold text-xs leading-tight line-clamp-2 flex-grow">{product.name}</h3>
                <p className="font-bold text-sm text-primary mt-1">${product.price.toFixed(2)}</p>
            </div>
            <CardFooter className="p-2 pt-0">
                <Button asChild size="sm" className="w-full text-xs">
                    <Link href={`/dashboard/store/${product.id}`}>View</Link>
                </Button>
            </CardFooter>
        </Card>
    )
}

function StoreSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-4">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="aspect-square w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                ))}
            </div>
        </div>
    )
}

function MyOrdersList() {
    const { user } = useAuthContext();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
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
            <div className="flex items-center justify-center h-full min-h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
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
    );
}

export default function StorePage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [productsData, categoriesData] = await Promise.all([
                    getProducts(),
                    getCategories()
                ]);
                setProducts(productsData);
                setCategories(categoriesData);
            } catch (error) {
                console.error("Failed to fetch store data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const productsByCategory = useMemo(() => {
        return categories.map(category => ({
            ...category,
            products: products.filter(p => p.categoryId === category.id)
        }));
    }, [products, categories]);

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-6">
                <StoreSkeleton />
            </div>
        )
    }

    const renderGrid = (items: Product[]) => (
         <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-4">
             {items.length > 0 ? (
                items.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))
             ) : (
                <p className="col-span-full text-center text-muted-foreground py-10">No products in this category yet.</p>
             )}
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-6 space-y-6">
             <Tabs defaultValue="store" className="w-full">
                <div className="flex justify-between items-center">
                    <PageHeader title="Store" description="Spend your cashback on awesome products." />
                    <TabsList>
                        <TabsTrigger value="store">Store</TabsTrigger>
                        <TabsTrigger value="orders">My Orders</TabsTrigger>
                    </TabsList>
                </div>
                
                <TabsContent value="store" className="space-y-6">
                     <Tabs defaultValue={categories[0]?.id || 'all'} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                            <TabsTrigger value="all">All</TabsTrigger>
                            {categories.map(cat => (
                                <TabsTrigger key={cat.id} value={cat.id}>{cat.name}</TabsTrigger>
                            ))}
                        </TabsList>
                        <TabsContent value="all" className="mt-6">
                            {renderGrid(products)}
                        </TabsContent>
                        {productsByCategory.map(category => (
                            <TabsContent key={category.id} value={category.id} className="mt-6">
                            {renderGrid(category.products)}
                            </TabsContent>
                        ))}
                    </Tabs>
                </TabsContent>
                 <TabsContent value="orders">
                    <MyOrdersList />
                </TabsContent>
            </Tabs>
        </div>
    );
}
