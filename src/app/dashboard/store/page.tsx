
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
import type { Product, ProductCategory } from '@/types';
import { Loader2, ShoppingCart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
            <PageHeader title="Store" description="Spend your cashback on awesome products." />
            
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
        </div>
    );
}
