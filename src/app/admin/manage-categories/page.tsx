
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { getCategories, addCategory, updateCategory, deleteCategory } from "../actions";
import { PlusCircle, Loader2, Edit, Trash2 } from "lucide-react";
import type { ProductCategory } from "@/types";
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

const formSchema = z.object({
    name: z.string().min(2, "Category name must be at least 2 characters."),
    description: z.string().min(10, "Description must be at least 10 characters."),
});

type FormData = z.infer<typeof formSchema>;

export default function ManageCategoriesPage() {
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
    const { toast } = useToast();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: "", description: "" },
    });

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const data = await getCategories();
            setCategories(data);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not fetch categories." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        const result = editingCategory
            ? await updateCategory(editingCategory.id, data)
            : await addCategory(data);

        if (result.success) {
            toast({ title: "Success", description: result.message });
            form.reset();
            setEditingCategory(null);
            fetchCategories();
        } else {
            toast({ variant: "destructive", title: "Error", description: result.message });
        }
        setIsSubmitting(false);
    };

    const handleEdit = (category: ProductCategory) => {
        setEditingCategory(category);
        form.reset(category);
    };

    const handleCancelEdit = () => {
        setEditingCategory(null);
        form.reset({ name: "", description: "" });
    };

    const handleDelete = async (id: string) => {
        const result = await deleteCategory(id);
        if (result.success) {
            toast({ title: "Success", description: result.message });
            fetchCategories();
        } else {
            toast({ variant: "destructive", title: "Error", description: result.message });
        }
    };

    return (
        <div className="container mx-auto space-y-6">
            <PageHeader
                title="Manage Product Categories"
                description="Add, edit, or remove categories for your store."
            />

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>{editingCategory ? "Edit" : "Add"} Category</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Category Name</FormLabel>
                                                <FormControl><Input placeholder="e.g., T-Shirts" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl><Textarea placeholder="Describe the category..." {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex gap-2">
                                        {editingCategory && (
                                            <Button type="button" variant="secondary" onClick={handleCancelEdit} className="w-full">
                                                Cancel
                                            </Button>
                                        )}
                                        <Button type="submit" disabled={isSubmitting} className="w-full">
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {editingCategory ? "Save Changes" : "Add Category"}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Existing Categories</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {categories.map((cat) => (
                                            <TableRow key={cat.id}>
                                                <TableCell className="font-medium">{cat.name}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{cat.description}</TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleEdit(cat)}>
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
                                                          <AlertDialogDescription>
                                                            This will permanently delete the category. This action cannot be undone.
                                                          </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                          <AlertDialogAction onClick={() => handleDelete(cat.id)}>Delete</AlertDialogAction>
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
            </div>
        </div>
    );
}
