
"use client";

import { useState, useEffect } from "react";
import { useParams, notFound, useRouter } from 'next/navigation';
import Image from "next/image";
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, useInView } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Product } from "@/types";
import { Loader2, ArrowLeft, Phone, ShoppingCart, Info, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/hooks/useAuthContext";
import { placeOrder } from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import React from "react";


const purchaseSchema = z.object({
    phoneNumber: z.string().min(10, "Please enter a valid phone number."),
});
type PurchaseFormValues = z.infer<typeof purchaseSchema>;

function ProductPageSkeleton() {
    return (
        <div className="w-full animate-pulse">
            <div className="h-[50vh] bg-muted flex items-center justify-center">
                 <Skeleton className="h-48 w-48 rounded-lg" />
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

const AnimatedSection = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.3 });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 30 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    );
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
        <>
            <div className="w-full bg-slate-900 text-white relative">
                 <div 
                    className="absolute inset-0 bg-cover bg-center opacity-20"
                    style={{ backgroundImage: `url(${product.imageUrl})`}}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>

                <div className="min-h-[60vh] relative z-10 flex flex-col justify-center items-center container mx-auto px-4 py-12 text-center">
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}>
                        <Image
                            src={product.imageUrl}
                            alt={product.name}
                            width={256}
                            height={256}
                            className="object-contain drop-shadow-2xl"
                            priority
                            data-ai-hint="product image"
                        />
                    </motion.div>
                </div>

                <Button variant="ghost" onClick={() => router.back()} className="absolute top-4 left-4 z-20 bg-black/20 hover:bg-black/40 text-white h-auto p-2 rounded-full">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </div>
            
            <div className="bg-slate-900">
                <div className="bg-background rounded-t-3xl pt-8 pb-24">
                    <div className="container mx-auto px-4 max-w-2xl space-y-8">
                        <AnimatedSection>
                            <Badge variant="outline">{product.categoryName}</Badge>
                            <h1 className="text-4xl lg:text-5xl font-bold font-headline mt-2">{product.name}</h1>
                        </AnimatedSection>
                        
                        <AnimatedSection>
                             <div className="flex items-baseline gap-4">
                                <p className="text-4xl font-bold text-primary">${product.price.toFixed(2)}</p>
                                <span className="text-sm text-muted-foreground">with Cashback Balance</span>
                             </div>
                        </AnimatedSection>

                        <AnimatedSection>
                            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><Info className="h-5 w-5 text-primary"/> Description</h2>
                                <p>{product.description}</p>
                            </div>
                        </AnimatedSection>
                    </div>
                </div>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                 <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t z-50">
                    <div className="container mx-auto max-w-2xl">
                         <DialogTrigger asChild>
                            <Button size="lg" className="w-full h-12 text-base shadow-lg bg-gradient-to-r from-primary to-accent text-primary-foreground hover:from-primary/90 hover:to-accent/90" disabled={product.stock <= 0}>
                                {product.stock > 0 ? 'Proceed to Purchase' : 'Out of Stock'}
                            </Button>
                        </DialogTrigger>
                    </div>
                </div>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Purchase: {product.name}</DialogTitle>
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
        </>
    );
}

