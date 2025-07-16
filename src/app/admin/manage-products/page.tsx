
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getProducts, addProduct, updateProduct, deleteProduct, getCategories } from "../actions";
import { PlusCircle, Loader2, Edit, Trash2 } from "lucide-react";
import type { Product, ProductCategory } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";

const formSchema = z.object({
    name: z.string().min(2, "Product name is too short."),
    description: z.string().min(10, "Description is too short."),
    price: z.coerce.number().positive("Price must be a positive number."),
    imageUrl: z.string().url("Must be a valid image URL."),
    categoryId: z.string({ required_error: "Please select a category."}),
    stock: z.coerce.number().int().min(0, "Stock cannot be negative."),
});

type FormData = z.infer<typeof formSchema>;

function ProductForm({ product, categories, onSuccess, onCancel }: { product?: Product | null; categories: ProductCategory[]; onSuccess: () => void; onCancel: () => void; }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: product ? {
            ...product,
        } : {
            name: "",
            description: "",
            price: 0,
            imageUrl: "",
            categoryId: undefined,
            stock: 0,
        },
    });

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        const category = categories.find(c => c.id === data.categoryId);
        if (!category) {
            toast({ variant: "destructive", title: "Error", description: "Invalid category selected." });
            setIsSubmitting(false);
            return;
        }

        const payload = { ...data, categoryName: category.name };

        const result = product
            ? await updateProduct(product.id, payload)
            : await addProduct(payload);

        if (result.success) {
            toast({ title: "Success", description: result.message });
            onSuccess();
        } else {
            toast({ variant: "destructive", title: "Error", description: result.message });
        }
        setIsSubmitting(false);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="imageUrl" render={({ field }) => (
                    <FormItem><FormLabel>Image URL</FormLabel><FormControl><Input placeholder="https://placehold.co/400x400.png" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="price" render={({ field }) => (
                        <FormItem><FormLabel>Price ($)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="stock" render={({ field }) => (
                        <FormItem><FormLabel>Stock</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                <FormField control={form.control} name="categoryId" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}/>
                <div className="flex justify-end gap-2">
                    <DialogClose asChild><Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {product ? "Save Changes" : "Create Product"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}

export default function ManageProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const { toast } = useToast();

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [productsData, categoriesData] = await Promise.all([
                getProducts(),
                getCategories(),
            ]);
            setProducts(productsData);
            setCategories(categoriesData);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not fetch store data." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: string) => {
        const result = await deleteProduct(id);
        if (result.success) {
            toast({ title: "Success", description: result.message });
            fetchData();
        } else {
            toast({ variant: "destructive", title: "Error", description: result.message });
        }
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setEditingProduct(null);
        setIsFormOpen(true);
    }
    
    const handleFormSuccess = () => {
        setIsFormOpen(false);
        setEditingProduct(null);
        fetchData();
    };

    const handleFormCancel = () => {
        setIsFormOpen(false);
        setEditingProduct(null);
    }

    return (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <div className="container mx-auto space-y-6">
                <div className="flex justify-between items-start">
                    <PageHeader
                        title="Manage Products"
                        description="Add, edit, or remove products in your store."
                    />
                    <DialogTrigger asChild>
                        <Button onClick={handleAdd}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Product
                        </Button>
                    </DialogTrigger>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Image</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Stock</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.map((prod) => (
                                        <TableRow key={prod.id}>
                                            <TableCell>
                                                <Image src={prod.imageUrl} alt={prod.name} width={40} height={40} className="rounded-md" data-ai-hint="product image" />
                                            </TableCell>
                                            <TableCell className="font-medium">{prod.name}</TableCell>
                                            <TableCell>{prod.categoryName}</TableCell>
                                            <TableCell>${prod.price.toFixed(2)}</TableCell>
                                            <TableCell>{prod.stock}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleEdit(prod)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                  <AlertDialogTrigger asChild>
                                                    <Button size="icon" variant="destructive" className="h-8 w-8">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                  </AlertDialogTrigger>
                                                  <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                      <AlertDialogDescription>This will permanently delete the product.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                      <AlertDialogAction onClick={() => handleDelete(prod.id)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                  </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
            
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                </DialogHeader>
                <ProductForm 
                    product={editingProduct} 
                    categories={categories} 
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
                />
            </DialogContent>
        </Dialog>
    );
}
