
"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { getFeedbackForms, addFeedbackForm, updateFeedbackForm, deleteFeedbackForm } from "../actions";
import { PlusCircle, Loader2, Edit, Trash2, Send, List, Shield, Type, GripVertical } from "lucide-react";
import type { FeedbackForm } from "@/types";
import { format } from "date-fns";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const questionSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  text: z.string().min(3, "نص السؤال مطلوب."),
  type: z.enum(['text', 'rating', 'multiple-choice']),
  options: z.array(z.string()).optional(),
});

const formSchema = z.object({
  title: z.string().min(5, "العنوان مطلوب."),
  description: z.string().min(10, "الوصف مطلوب."),
  status: z.enum(['active', 'inactive']),
  questions: z.array(questionSchema).min(1, "يجب إضافة سؤال واحد على الأقل."),
});

type FormData = z.infer<typeof formSchema>;

function FeedbackFormDialog({ form: existingForm, onSuccess }: { form?: FeedbackForm | null; onSuccess: () => void; }) {
  const [isOpen, setIsOpen] = useState(!!existingForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const formMethods = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: existingForm ? {
        ...existingForm,
    } : {
      title: "",
      description: "",
      status: 'inactive',
      questions: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: formMethods.control,
    name: "questions",
  });
  
  const handleClose = () => {
    formMethods.reset();
    onSuccess(); // To signal parent to clear editing state
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const result = existingForm
      ? await updateFeedbackForm(existingForm.id, data)
      : await addFeedbackForm(data);

    if (result.success) {
      toast({ title: "نجاح", description: result.message });
      handleClose();
    } else {
      toast({ variant: "destructive", title: "خطأ", description: result.message });
    }
    setIsSubmitting(false);
  };

  const addQuestion = () => {
    append({ text: "", type: "text", options: [] });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{existingForm ? "تعديل" : "إنشاء"} نموذج ملاحظات</DialogTitle>
          </DialogHeader>
          <Form {...formMethods}>
            <form onSubmit={formMethods.handleSubmit(onSubmit)} className="space-y-6 p-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={formMethods.control} name="title" render={({ field }) => (<FormItem><FormLabel>عنوان النموذج</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={formMethods.control} name="status" render={({ field }) => (<FormItem><FormLabel>الحالة</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="active">نشط</SelectItem><SelectItem value="inactive">غير نشط</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
              </div>
              <FormField control={formMethods.control} name="description" render={({ field }) => (<FormItem><FormLabel>الوصف</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)}/>
              
              <Separator />

              <div>
                  <h3 className="text-lg font-medium">الأسئلة</h3>
              </div>
              <div className="space-y-4">
                  {fields.map((field, index) => (
                      <Card key={field.id} className="p-4 relative bg-muted/50">
                          <Button type="button" variant="destructive" size="icon" className="absolute top-2 left-2 h-6 w-6 z-10" onClick={() => remove(index)}><Trash2 className="h-4 w-4"/></Button>
                          <div className="space-y-4">
                              <FormField control={formMethods.control} name={`questions.${index}.text`} render={({ field }) => (
                                  <FormItem><FormLabel>نص السؤال</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                              )}/>
                              <FormField control={formMethods.control} name={`questions.${index}.type`} render={({ field }) => (
                                  <FormItem><FormLabel>نوع السؤال</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="text">نصي</SelectItem><SelectItem value="rating">تقييم (1-5)</SelectItem><SelectItem value="multiple-choice">اختيار من متعدد</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                              )}/>
                          </div>
                      </Card>
                  ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addQuestion}><PlusCircle className="ml-2 h-4 w-4"/> إضافة سؤال</Button>
              <DialogFooter className="pt-4">
                <Button type="button" variant="secondary" onClick={handleClose}>إلغاء</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  {existingForm ? "حفظ التغييرات" : "إنشاء نموذج"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
    </Dialog>
  );
}


export default function ManageFeedbackPage() {
    const [forms, setForms] = useState<FeedbackForm[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingForm, setEditingForm] = useState<FeedbackForm | null>(null);
    const { toast } = useToast();

    const fetchForms = async () => {
        setIsLoading(true);
        try {
            const data = await getFeedbackForms();
            setForms(data);
        } catch (error) {
            toast({ variant: "destructive", title: "خطأ", description: "تعذر جلب النماذج." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchForms();
    }, []);

    const handleDelete = async (id: string) => {
        const result = await deleteFeedbackForm(id);
        if (result.success) {
            toast({ title: "نجاح", description: result.message });
            fetchForms();
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
        }
    };

    const handleEdit = (form: FeedbackForm) => {
        setEditingForm(form);
    };

    const handleAdd = () => {
        setEditingForm({} as FeedbackForm); // Trigger dialog with empty object
    }
    
    const handleFormSuccess = () => {
        setEditingForm(null);
        fetchForms();
    };

    return (
        <div className="container mx-auto space-y-6">
            <div className="flex justify-between items-start">
                <PageHeader
                    title="إدارة الملاحظات والنماذج"
                    description="إنشاء وإدارة نماذج الملاحظات للمستخدمين."
                />
                <Button onClick={handleAdd}>
                    <PlusCircle className="ml-2 h-4 w-4" /> إضافة نموذج
                </Button>
            </div>
            
            {editingForm && <FeedbackFormDialog form={editingForm} onSuccess={handleFormSuccess} />}
            
            <Card>
                <CardHeader>
                    <CardTitle>النماذج الحالية</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>العنوان</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead>الاستجابات</TableHead>
                                    <TableHead>تاريخ الإنشاء</TableHead>
                                    <TableHead className="text-left">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {forms.map((form) => (
                                    <TableRow key={form.id}>
                                        <TableCell className="font-medium">{form.title}</TableCell>
                                        <TableCell><span className={`px-2 py-1 rounded-full text-xs ${form.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{form.status === 'active' ? 'نشط' : 'غير نشط'}</span></TableCell>
                                        <TableCell>{form.responseCount || 0}</TableCell>
                                        <TableCell>{format(form.createdAt, "PP")}</TableCell>
                                        <TableCell className="text-left space-x-2">
                                            <Button size="sm" variant="outline" disabled><Send className="ml-2 h-4 w-4" /> إرسال</Button>
                                            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleEdit(form)}><Edit className="h-4 w-4" /></Button>
                                            <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                                <Button size="icon" variant="destructive" className="h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                                              </AlertDialogTrigger>
                                              <AlertDialogContent>
                                                <AlertDialogHeader>
                                                  <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                                  <AlertDialogDescription>سيؤدي هذا إلى حذف النموذج وجميع استجاباته بشكل دائم.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                  <AlertDialogAction onClick={() => handleDelete(form.id)}>حذف</AlertDialogAction>
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
    );
}
