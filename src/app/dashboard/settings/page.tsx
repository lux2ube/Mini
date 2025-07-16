
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthContext } from "@/hooks/useAuthContext";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, PlusCircle, Wallet, Verified, ShieldAlert } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

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

function ProfileInfoItem({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <div className="text-sm font-medium">{children}</div>
        </div>
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
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  const { profile, paymentMethods } = user;

  return (
    <div className="max-w-md mx-auto w-full px-4 py-4 space-y-4">
        <PageHeader title="My Profile" description="Manage your account details and settings." />
        
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <ProfileInfoItem label="Name">
                   {profile.name}
                </ProfileInfoItem>
                <Separator/>
                <ProfileInfoItem label="Email">
                    <div className="flex items-center gap-2">
                        <span>{profile.email}</span>
                        {user.emailVerified ? (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700"><Verified className="mr-1 h-3 w-3" /> Verified</Badge>
                        ) : (
                             <Badge variant="destructive"><ShieldAlert className="mr-1 h-3 w-3" /> Not Verified</Badge>
                        )}
                    </div>
                </ProfileInfoItem>
                <Separator/>
                <ProfileInfoItem label="Phone">
                    <div className="flex items-center gap-2">
                         <span>{profile.phoneNumber || "Not set"}</span>
                         {profile.phoneNumber && (
                             profile.phoneNumberVerified ? (
                                <Badge variant="default" className="bg-green-600 hover:bg-green-700"><Verified className="mr-1 h-3 w-3" /> Verified</Badge>
                            ) : (
                                <Button size="sm" variant="secondary" disabled>Verify</Button>
                            )
                         )}
                    </div>
                </ProfileInfoItem>
                <Separator/>
                <ProfileInfoItem label="Level">
                    <div>
                        <Badge variant="secondary">{profile.tier}</Badge>
                    </div>
                </ProfileInfoItem>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-base">Payment Methods</CardTitle>
                    <CardDescription className="text-xs">Your saved withdrawal accounts.</CardDescription>
                </div>
                <AddPaymentMethodDialog adminMethods={adminMethods} onMethodAdded={refetchUserData}/>
            </CardHeader>
            <CardContent>
                <PaymentMethodsList methods={paymentMethods || []} onMethodDeleted={refetchUserData} />
            </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle className="text-base">Change Password</CardTitle>
                <CardDescription className="text-xs">
                   Update your account password.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
