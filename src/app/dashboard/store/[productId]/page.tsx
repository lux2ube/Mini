
"use client";

import { useState, useEffect } from "react";
import { useParams, notFound, useRouter } from 'next/navigation';
import Image from "next/image";
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Product } from "@/types";
import { Loader2, ArrowLeft, Phone, ShoppingCart, Info, User, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/hooks/useAuthContext";
import { placeOrder } from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const purchaseSchema = z.object({
    userName: z.string().min(3, "الاسم الكامل مطلوب."),
    userEmail: z.string().email("الرجاء إدخال بريد إلكتروني صحيح."),
    deliveryPhoneNumber: z.string().min(10, "الرجاء إدخال رقم هاتف صحيح."),
});
type PurchaseFormValues = z.infer<typeof purchaseSchema>;

function PurchaseForm({ product, onPurchaseSuccess }: { product: Product; onPurchaseSuccess: () => void; }) {
    const { user } = useAuthContext();
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const form = useForm<PurchaseFormValues>({
        resolver: zodResolver(purchaseSchema),
        defaultValues: { 
            userName: user?.profile?.name || "",
            userEmail: user?.profile?.email || "",
            deliveryPhoneNumber: "" 
        }
    });
    
    const handlePurchase = async (data: PurchaseFormValues) => {
        if (!user || !product) return;
        setIsSubmitting(true);
        const result = await placeOrder(user.uid, product.id, data);

        if (result.success) {
            toast({ title: "تم بنجاح!", description: result.message });
            onPurchaseSuccess();
            router.push('/dashboard/store/orders');
        } else {
            toast({ variant: 'destructive', title: "فشل الطلب", description: result.message });
        }
        setIsSubmitting(false);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="lg" className="w-full h-12 text-base shadow-lg" disabled={product.stock <= 0}>
                    <ShoppingCart className="ml-2 h-5 w-5" />
                    {product.stock > 0 ? 'شراء الآن' : 'نفدت الكمية'}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader className="text-right">
                    <DialogTitle>تأكيد الشراء: {product.name}</DialogTitle>
                    <DialogDescription>
                        سيتم خصم ${product.price.toFixed(2)} من رصيد الكاش باك المتاح لديك. أدخل التفاصيل الخاصة بك للتسليم.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handlePurchase)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="userName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>الاسم الكامل</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="اسمك الكامل" {...field} className="pr-10 text-right" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="userEmail"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>البريد الإلكتروني</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input type="email" placeholder="بريدك الإلكتروني" {...field} className="pr-10 text-right" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="deliveryPhoneNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>رقم هاتف التوصيل</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input type="tel" placeholder="مثال: +966..." {...field} className="pr-10 text-right" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                تأكيد الطلب
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function ProductPageSkeleton() {
    return (
        <div className="w-full animate-pulse">
            <div className="h-[50vh] bg-slate-900/10 flex items-center justify-center">
                 <Skeleton className="h-48 w-48 rounded-lg bg-slate-200" />
            </div>
            <div className="container mx-auto px-4 py-8 space-y-6 max-w-2xl">
                 <Skeleton className="h-6 w-1/4" />
                 <Skeleton className="h-10 w-3/4" />
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-5/6" />
            </div>
        </div>
    )
}

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.productId as string;

    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
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

    if (isLoading) {
        return <ProductPageSkeleton />;
    }

    if (!product) {
        notFound();
    }

    return (
        <div className="bg-slate-900 text-white">
            <div className="relative">
                 <div 
                    className="absolute inset-0 bg-cover bg-center opacity-10"
                    style={{ backgroundImage: `url(${product.imageUrl})`}}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>

                <div className="relative container mx-auto px-4 pt-16 pb-8 text-center">
                     <Button variant="ghost" onClick={() => router.back()} className="absolute top-4 right-4 z-20 bg-black/20 hover:bg-black/40 text-white h-auto p-2 rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                        {product.categoryName}
                    </Badge>
                     <h1 className="text-3xl font-bold font-headline mt-2 text-shadow-lg shadow-black/50">{product.name}</h1>
                </div>
            </div>

            <div className="bg-background text-foreground rounded-t-3xl pb-28 relative z-10">
                <div className="container mx-auto p-6 max-w-2xl space-y-6 text-right">
                    
                    <Card>
                        <CardContent className="p-4 space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground">السعر باستخدام رصيد الكاش باك</p>
                                <p className="text-4xl font-bold text-primary">${product.price.toFixed(2)}</p>
                            </div>
                             <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                                <h2 className="text-base font-semibold text-foreground flex items-center justify-end gap-2">الوصف <Info className="h-5 w-5 text-primary"/></h2>
                                <p>{product.description}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <div>
                        <PurchaseForm product={product} onPurchaseSuccess={() => {}} />
                    </div>
                </div>
            </div>
        </div>
    );
}
