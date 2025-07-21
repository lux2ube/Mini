
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
    name: z.string().min(2, "يجب أن يكون اسم الفئة حرفين على الأقل."),
    description: z.string().min(10, "يجب أن يكون الوصف 10 أحرف على الأقل."),
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
            toast({ variant: "destructive", title: "خطأ", description: "تعذر جلب الفئات." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        // Add a default "Courses" category if it doesn't exist
        const addDefaultCategory = async () => {
            const existingCategories = await getCategories();
            if (!existingCategories.some(cat => cat.name === "الكورسات")) {
                await addCategory({ name: "الكورسات", description: "الدورات التعليمية والتدريبية" });
                fetchCategories();
            }
        };
        addDefaultCategory();
    }, []);

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        const result = editingCategory
            ? await updateCategory(editingCategory.id, data)
            : await addCategory(data);

        if (result.success) {
            toast({ title: "نجاح", description: result.message });
            form.reset();
            setEditingCategory(null);
            fetchCategories();
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
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
            toast({ title: "نجاح", description: result.message });
            fetchCategories();
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
        }
    };

    return (
        <div className="container mx-auto space-y-6">
            <PageHeader
                title="إدارة فئات المنتجات"
                description="إضافة أو تعديل أو إزالة الفئات لمتجرك."
            />

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>{editingCategory ? "تعديل" : "إضافة"} فئة</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>اسم الفئة</FormLabel>
                                                <FormControl><Input placeholder="مثال: قمصان" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>الوصف</FormLabel>
                                                <FormControl><Textarea placeholder="صف الفئة..." {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex gap-2">
                                        {editingCategory && (
                                            <Button type="button" variant="secondary" onClick={handleCancelEdit} className="w-full">
                                                إلغاء
                                            </Button>
                                        )}
                                        <Button type="submit" disabled={isSubmitting} className="w-full">
                                            {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                            {editingCategory ? "حفظ التغييرات" : "إضافة فئة"}
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
                            <CardTitle>الفئات الحالية</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>الاسم</TableHead>
                                            <TableHead>الوصف</TableHead>
                                            <TableHead className="text-left">الإجراءات</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {categories.map((cat) => (
                                            <TableRow key={cat.id}>
                                                <TableCell className="font-medium">{cat.name}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{cat.description}</TableCell>
                                                <TableCell className="text-left space-x-2">
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
                                                          <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                                          <AlertDialogDescription>
                                                            سيؤدي هذا إلى حذف الفئة بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
                                                          </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                          <AlertDialogAction onClick={() => handleDelete(cat.id)}>حذف</AlertDialogAction>
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

    