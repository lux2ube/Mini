
"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getPaymentMethods, addPaymentMethod, updatePaymentMethod, deletePaymentMethod } from "../actions";
import { PlusCircle, Loader2, Edit, Trash2, GripVertical, Info } from "lucide-react";
import type { PaymentMethod, PaymentMethodField } from "@/types";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const fieldSchema = z.object({
    name: z.string().min(2, "Name is required"),
    label: z.string().min(2, "Label is required"),
    type: z.enum(['text', 'number']),
    placeholder: z.string().optional(),
    validation: z.object({
        required: z.boolean(),
        minLength: z.coerce.number().optional(),
        maxLength: z.coerce.number().optional(),
        regex: z.string().optional(),
        regexErrorMessage: z.string().optional(),
    }),
});

const formSchema = z.object({
    name: z.string().min(2, "Method name is required"),
    description: z.string().min(5, "Description is required"),
    isEnabled: z.boolean(),
    type: z.enum(['crypto', 'internal_transfer', 'other']),
    fields: z.array(fieldSchema),
});

type FormData = z.infer<typeof formSchema>;

function PaymentMethodForm({ method, onSuccess, onCancel }: { method?: PaymentMethod | null; onSuccess: () => void; onCancel: () => void; }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: method ? {
            ...method,
        } : {
            name: "",
            description: "",
            isEnabled: true,
            type: 'crypto',
            fields: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "fields",
    });

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        const result = method
            ? await updatePaymentMethod(method.id, data)
            : await addPaymentMethod(data);

        if (result.success) {
            toast({ title: "Success", description: result.message });
            onSuccess();
        } else {
            toast({ variant: "destructive", title: "Error", description: result.message });
        }
        setIsSubmitting(false);
    };

    const addNewField = () => {
        append({
            name: "",
            label: "",
            type: "text",
            placeholder: "",
            validation: { required: true, minLength: 0, maxLength: 0, regex: "", regexErrorMessage: "" },
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Method Name</FormLabel><FormControl><Input placeholder="e.g., USDT (TRC20)" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="type" render={({ field }) => (
                        <FormItem><FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="crypto">Crypto</SelectItem>
                                <SelectItem value="internal_transfer">Internal Transfer</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select><FormMessage /></FormItem>
                    )}/>
                </div>
                 <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="e.g., Withdraw USDT on the TRON network." {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="isEnabled" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Enable Method</FormLabel><FormDescription>Users can see and use this method.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                )}/>
                
                <Separator />
                
                <div>
                    <h3 className="text-lg font-medium">Required Fields</h3>
                    <p className="text-sm text-muted-foreground">Define the fields users must fill out for this method.</p>
                </div>
                
                <div className="space-y-4">
                    {fields.map((field, index) => (
                        <Card key={field.id} className="p-4 relative">
                           <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 z-10" onClick={() => remove(index)}>
                               <Trash2 className="h-4 w-4"/>
                           </Button>
                           <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name={`fields.${index}.name`} render={({ field }) => (
                                        <FormItem><FormLabel>Field Name</FormLabel><FormControl><Input placeholder="e.g., walletAddress" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name={`fields.${index}.label`} render={({ field }) => (
                                        <FormItem><FormLabel>Field Label</FormLabel><FormControl><Input placeholder="e.g., Wallet Address" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name={`fields.${index}.placeholder`} render={({ field }) => (
                                        <FormItem><FormLabel>Placeholder</FormLabel><FormControl><Input placeholder="e.g., 0x..." {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                     <FormField control={form.control} name={`fields.${index}.type`} render={({ field }) => (
                                        <FormItem><FormLabel>Field Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                                            <SelectContent><SelectItem value="text">Text</SelectItem><SelectItem value="number">Number</SelectItem></SelectContent>
                                        </Select><FormMessage /></FormItem>
                                    )}/>
                                </div>
                                <div className="p-3 border rounded-md space-y-4">
                                    <h4 className="font-medium">Validation Rules</h4>
                                     <FormField control={form.control} name={`fields.${index}.validation.required`} render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Required</FormLabel></div></FormItem>
                                    )}/>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name={`fields.${index}.validation.minLength`} render={({ field }) => (
                                            <FormItem><FormLabel>Min Length</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={form.control} name={`fields.${index}.validation.maxLength`} render={({ field }) => (
                                            <FormItem><FormLabel>Max Length</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                       <FormField control={form.control} name={`fields.${index}.validation.regex`} render={({ field }) => (
                                            <FormItem><FormLabel>Regex Pattern</FormLabel><FormControl><Input placeholder="^0x[a-fA-F0-9]{40}$" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={form.control} name={`fields.${index}.validation.regexErrorMessage`} render={({ field }) => (
                                            <FormItem><FormLabel>Regex Error Message</FormLabel><FormControl><Input placeholder="Invalid address format" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                    </div>
                                </div>
                           </div>
                        </Card>
                    ))}
                </div>

                <Button type="button" variant="outline" onClick={addNewField}>
                    <PlusCircle className="mr-2 h-4 w-4"/> Add Field
                </Button>

                <DialogFooter className="pt-4">
                    <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {method ? "Save Changes" : "Create Method"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}


export default function ManagePaymentMethodsPage() {
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
    const { toast } = useToast();

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await getPaymentMethods();
            setMethods(data);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not fetch payment methods." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: string) => {
        const result = await deletePaymentMethod(id);
        if (result.success) {
            toast({ title: "Success", description: result.message });
            fetchData();
        } else {
            toast({ variant: "destructive", title: "Error", description: result.message });
        }
    };

    const handleEdit = (method: PaymentMethod) => {
        setEditingMethod(method);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setEditingMethod(null);
        setIsFormOpen(true);
    }
    
    const handleFormSuccess = () => {
        setIsFormOpen(false);
        setEditingMethod(null);
        fetchData();
    };

    const handleFormCancel = () => {
        setIsFormOpen(false);
        setEditingMethod(null);
    }

    return (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <div className="container mx-auto space-y-6">
                <div className="flex justify-between items-start">
                    <PageHeader
                        title="Manage Payment Methods"
                        description="Configure how users can withdraw their funds."
                    />
                    <DialogTrigger asChild>
                        <Button onClick={handleAdd}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Method
                        </Button>
                    </DialogTrigger>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Configured Methods</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {methods.map((method) => (
                                        <TableRow key={method.id}>
                                            <TableCell className="font-medium">{method.name}</TableCell>
                                            <TableCell><Badge variant="outline">{method.type}</Badge></TableCell>
                                            <TableCell>
                                                <Badge variant={method.isEnabled ? 'default' : 'secondary'}>
                                                    {method.isEnabled ? 'Enabled' : 'Disabled'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleEdit(method)}>
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
                                                      <AlertDialogDescription>This will permanently delete the payment method.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                      <AlertDialogAction onClick={() => handleDelete(method.id)}>Delete</AlertDialogAction>
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
            
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editingMethod ? "Edit" : "Add New"} Payment Method</DialogTitle>
                </DialogHeader>
                <div className="p-1">
                    <PaymentMethodForm 
                        method={editingMethod}
                        onSuccess={handleFormSuccess}
                        onCancel={handleFormCancel}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}

    