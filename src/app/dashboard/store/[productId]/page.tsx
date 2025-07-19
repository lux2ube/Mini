
"use client";

import { useState, useEffect } from "react";
import { useParams, notFound, useRouter } from 'next/navigation';
import Image from "next/image";
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Product } from "@/types";
import { Loader2, ArrowLeft, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/hooks/useAuthContext";
import { placeOrder } from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";


const purchaseSchema = z.object({
    phoneNumber: z.string().min(10, "Please enter a valid phone number."),
});
type PurchaseFormValues = z.infer<typeof purchaseSchema>;

function ProductPageSkeleton() {
    return (
        <div className="container mx-auto px-4 py-4 space-y-4">
            <Skeleton className="h-8 w-32" />
            <div className="grid md:grid-cols-2 gap-8">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <div className="space-y-3">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-5 w-1/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-10 w-full mt-4" />
                </div>
            </div>
        </div>
    )
}

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthContext();
    const { toast } = useToast();
    const productId = params.productId as string;

    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    const form = useForm<PurchaseFormValues>({
        resolver: zodResolver(purchaseSchema),
        defaultValues: { phoneNumber: "" }
    });

    useEffect(() => {
        const fetchProduct = async () => {
            if (!productId) return;
            setIsLoading(true);
            try {
                const productRef = doc(db, 'products', productId);
                const productSnap = await getDoc(productRef);
                if (productSnap.exists()) {
                    setProduct({ id: productSnap.id, ...productSnap.data() } as Product);
                } else {
                    notFound();
                }
            } catch (error) {
                console.error("Error fetching product:", error);
                notFound();
            } finally {
                setIsLoading(false);
            }
        };
        fetchProduct();
    }, [productId]);

    const handlePurchase = async (data: PurchaseFormValues) => {
        if (!user || !product) return;
        setIsSubmitting(true);
        const result = await placeOrder(user.uid, product.id, data.phoneNumber);

        if (result.success) {
            toast({ title: "Success!", description: result.message });
            setIsDialogOpen(false);
            router.push('/dashboard/store/orders');
        } else {
            toast({ variant: 'destructive', title: "Order Failed", description: result.message });
        }
        setIsSubmitting(false);
    }

    if (isLoading) {
        return <ProductPageSkeleton />;
    }

    if (!product) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-4 space-y-4">
             <Button variant="ghost" onClick={() => router.back()} className="mb-2 h-auto p-0 text-sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Store
            </Button>
            <div className="grid md:grid-cols-2 gap-8 items-start">
                <div className="aspect-square relative w-full overflow-hidden rounded-lg border">
                    <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-contain"
                        data-ai-hint="product image"
                    />
                </div>
                <div className="space-y-3">
                    <Badge variant="secondary">{product.categoryName}</Badge>
                    <h1 className="text-2xl font-bold font-headline">{product.name}</h1>
                    <p className="text-2xl font-bold text-primary">${product.price.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                    
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="lg" className="w-full mt-4" disabled={product.stock <= 0}>
                                {product.stock > 0 ? 'Buy Now with Cashback' : 'Out of Stock'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Confirm Purchase</DialogTitle>
                                <DialogDescription>
                                    Enter your phone number for delivery. ${product.price.toFixed(2)} will be deducted from your available cashback balance.
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handlePurchase)} className="space-y-4">
                                     <FormField
                                        control={form.control}
                                        name="phoneNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone Number</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <Input type="tel" placeholder="e.g., +1 555-123-4567" {...field} className="pl-10" />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button type="button" variant="secondary">Cancel</Button>
                                        </DialogClose>
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Confirm Order
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
