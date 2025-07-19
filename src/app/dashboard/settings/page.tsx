
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthContext } from "@/hooks/useAuthContext";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, PlusCircle, ChevronRight, Copy } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPaymentMethods, addUserPaymentMethod, deleteUserPaymentMethod } from "@/app/admin/actions";
import type { PaymentMethod, UserPaymentMethod } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";


const addMethodSchema = z.object({
  paymentMethodId: z.string().min(1, "Please select a method type."),
  details: z.record(z.any()),
});
type AddMethodFormValues = z.infer<typeof addMethodSchema>;

function AddPaymentMethodDialog({ adminMethods, onMethodAdded }: { adminMethods: PaymentMethod[], onMethodAdded: () => void }) {
    const { user } = useAuthContext();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const form = useForm<AddMethodFormValues>({
        resolver: zodResolver(addMethodSchema),
        defaultValues: {
            paymentMethodId: "",
            details: {},
        }
    });

    const selectedMethodId = form.watch("paymentMethodId");
    const selectedMethod = adminMethods.find(m => m.id === selectedMethodId);

    const onSubmit = async (data: AddMethodFormValues) => {
        if (!user || !selectedMethod) return;
        setIsSubmitting(true);
        
        try {
            const result = await addUserPaymentMethod({
                userId: user.uid,
                paymentMethodId: selectedMethod.id,
                methodName: selectedMethod.name,
                methodType: selectedMethod.type,
                details: data.details,
            });

            if (result.success) {
                toast({ title: "Success", description: result.message });
                onMethodAdded();
                setIsOpen(false);
                form.reset();
            } else {
                 toast({ variant: 'destructive', title: "Error", description: result.message });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "An unexpected error occurred." });
        }
        setIsSubmitting(false);
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add New</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add a New Payment Method</DialogTitle>
                    <DialogDescription>Save your withdrawal details for faster checkouts.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="paymentMethodId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Method Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a type..." /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {adminMethods.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        {selectedMethod && selectedMethod.fields.map(customField => {
                             const fieldName = `details.${customField.name}` as const;
                             return (
                                 <FormField
                                     key={customField.name}
                                     control={form.control}
                                     name={fieldName}
                                     render={({ field }) => (
                                         <FormItem>
                                             <FormLabel>{customField.label}</FormLabel>
                                             <FormControl>
                                                <Input 
                                                    type={customField.type} 
                                                    placeholder={customField.placeholder} 
                                                    {...field}
                                                    value={form.watch(fieldName) || ''}
                                                />
                                             </FormControl>
                                             <FormMessage />
                                         </FormItem>
                                     )}
                                 />
                             )
                        })}
                        
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Method
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

function PaymentMethodsList({ methods, onMethodDeleted }: { methods: UserPaymentMethod[], onMethodDeleted: () => void }) {
    const { toast } = useToast();
    
    const handleDelete = async (id: string) => {
        const result = await deleteUserPaymentMethod(id);
        if (result.success) {
            toast({ title: "Success", description: result.message });
            onMethodDeleted();
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.message });
        }
    }
    
    return (
        <div className="space-y-3">
            {methods.length > 0 ? methods.map(method => (
                <div key={method.id} className="border p-3 rounded-md flex justify-between items-start">
                    <div className="space-y-1">
                        <p className="font-semibold text-sm">{method.methodName}</p>
                        {Object.entries(method.details).map(([key, value]) => (
                            <div key={key} className="text-xs text-muted-foreground">
                                <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}: </span>
                                <span>{value}</span>
                            </div>
                        ))}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(method.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )) : <p className="text-sm text-muted-foreground text-center py-4">You have no saved payment methods.</p>}
        </div>
    )
}

function ProfileCard() {
    const { user } = useAuthContext();
    const { toast } = useToast();
    
    if (!user || !user.profile) return null;

    const { profile } = user;
    
    const handleCopy = () => {
        if (profile.clientId) {
            navigator.clipboard.writeText(String(profile.clientId));
            toast({ title: 'Copied!', description: 'Client ID copied to clipboard.' });
        }
    }

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-xl bg-primary/20 text-primary font-bold">
                            {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-grow space-y-1">
                        <h2 className="font-bold text-lg">{profile.name}</h2>
                        {profile.clientId ? (
                            <div className="flex items-center gap-2">
                               <p className="text-xs text-muted-foreground">Client ID: {profile.clientId}</p>
                               <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
                                   <Copy className="h-3 w-3" />
                               </Button>
                            </div>
                        ) : (
                             <p className="text-xs text-muted-foreground">Client ID: Not Assigned</p>
                        )}
                        {profile.tier && <Badge variant="secondary">{profile.tier}</Badge>}
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/profile">
                            <ChevronRight className="h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default function SettingsPage() {
  const { user, isLoading, refetchUserData } = useAuthContext();
  const [adminMethods, setAdminMethods] = useState<PaymentMethod[]>([]);
  
  useEffect(() => {
    getPaymentMethods().then(methods => {
        setAdminMethods(methods.filter(m => m.isEnabled && m.type !== 'trading_account'));
    });
  }, []);

  if (isLoading || !user?.profile) {
    return (
        <div className="flex items-center justify-center h-full min-h-[calc(100vh-theme(spacing.14))]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  const { paymentMethods } = user;

  return (
    <div className="max-w-md mx-auto w-full px-4 py-4 space-y-4">
        <PageHeader title="Settings" description="Manage your account details and settings." />
        
        <ProfileCard />
        
        <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4">
                <div>
                    <CardTitle className="text-base">Payment Methods</CardTitle>
                    <CardDescription className="text-xs">Your saved withdrawal accounts.</CardDescription>
                </div>
                <AddPaymentMethodDialog adminMethods={adminMethods} onMethodAdded={refetchUserData}/>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <PaymentMethodsList methods={paymentMethods || []} onMethodDeleted={refetchUserData} />
            </CardContent>
        </Card>

         <Card>
            <CardHeader className="p-4">
                <CardTitle className="text-base">Change Password</CardTitle>
                <CardDescription className="text-xs">
                   Update your account password.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" />
                </div>
                <Button className="w-full" size="sm">Update Password</Button>
            </CardContent>
        </Card>
    </div>
  );
}
