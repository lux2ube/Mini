
"use client"

import { useAuthContext } from "@/hooks/useAuthContext";
import React, { useState } from 'react';
import { Loader2, ChevronRight, Mail, Phone, User, Home, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { sendVerificationEmail, submitKycData, submitAddressData } from "@/app/actions";
import type { KycData, AddressData } from "@/types";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// KYC Form Schema and Component
const kycSchema = z.object({
  documentType: z.enum(['id_card', 'passport'], { required_error: "نوع الوثيقة مطلوب"}),
  documentNumber: z.string().min(5, "رقم الوثيقة مطلوب"),
  gender: z.enum(['male', 'female'], { required_error: "الجنس مطلوب"}),
});
type KycFormValues = z.infer<typeof kycSchema>;

function KycFormDialog({ onKycSubmit }: { onKycSubmit: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuthContext();
    const { toast } = useToast();

    const form = useForm<KycFormValues>({
        resolver: zodResolver(kycSchema),
        defaultValues: {
            documentType: undefined,
            documentNumber: "",
            gender: undefined,
        },
    });

    const onSubmit = async (data: KycFormValues) => {
        if (!user) return;
        setIsSubmitting(true);
        const result = await submitKycData(user.uid, data);
        if (result.success) {
            toast({ title: "تم الإرسال", description: "تم إرسال معلومات التحقق الخاصة بك للمراجعة." });
            onKycSubmit();
            setIsOpen(false);
        } else {
            toast({ variant: 'destructive', title: "خطأ", description: result.error });
        }
        setIsSubmitting(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="h-full w-full p-0 justify-start">
                    <VerificationItemContent icon={User} title="التحقق من الهوية (KYC)" status="Not Verified" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                 <DialogHeader>
                    <DialogTitle>التحقق من الهوية (KYC)</DialogTitle>
                    <DialogDescription>أدخل تفاصيل وثيقة الهوية الخاصة بك.</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="documentType" render={({ field }) => (
                            <FormItem>
                                <FormLabel>نوع الوثيقة</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="اختر نوع الوثيقة" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="id_card">بطاقة الهوية</SelectItem>
                                        <SelectItem value="passport">جواز السفر</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="documentNumber" render={({ field }) => (<FormItem><FormLabel>رقم الوثيقة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="gender" render={({ field }) => (
                             <FormItem>
                                <FormLabel>الجنس</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="اختر الجنس" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="male">ذكر</SelectItem>
                                        <SelectItem value="female">أنثى</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                إرسال للمراجعة
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// Address Form Schema and Component
const addressSchema = z.object({
  country: z.string().min(2, "الدولة مطلوبة"),
  city: z.string().min(2, "المدينة مطلوبة"),
  streetAddress: z.string().min(5, "عنوان الشارع مطلوب"),
});
type AddressFormValues = z.infer<typeof addressSchema>;

function AddressFormDialog({ onAddressSubmit }: { onAddressSubmit: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuthContext();
    const { toast } = useToast();

    const form = useForm<AddressFormValues>({
        resolver: zodResolver(addressSchema),
        defaultValues: {
            country: "",
            city: "",
            streetAddress: "",
        },
    });
    
    const onSubmit = async (data: AddressFormValues) => {
        if (!user) return;
        setIsSubmitting(true);
        const result = await submitAddressData(user.uid, data);
        if (result.success) {
            toast({ title: "تم الإرسال", description: "تم إرسال عنوانك للمراجعة." });
            onAddressSubmit();
            setIsOpen(false);
        } else {
            toast({ variant: 'destructive', title: "خطأ", description: result.error });
        }
        setIsSubmitting(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button variant="ghost" className="h-full w-full p-0 justify-start">
                    <VerificationItemContent icon={Home} title="التحقق من العنوان" status="Not Verified" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                 <DialogHeader>
                    <DialogTitle>التحقق من العنوان</DialogTitle>
                    <DialogDescription>أدخل تفاصيل عنوانك.</DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                     <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="country" render={({ field }) => (<FormItem><FormLabel>الدولة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>المدينة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="streetAddress" render={({ field }) => (<FormItem><FormLabel>عنوان الشارع</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                إرسال للمراجعة
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// Reusable UI part for each verification item
function VerificationItemContent({ icon: Icon, title, status }: { icon: React.ElementType, title: string, status: 'Verified' | 'Not Verified' | 'Pending' | 'Add' }) {
    const getStatusText = () => {
        switch (status) {
            case 'Verified': return 'تم التحقق';
            case 'Not Verified': return 'لم يتم التحقق';
            case 'Pending': return 'قيد المراجعة';
            case 'Add': return 'إضافة';
            default: return status;
        }
    }
    return (
        <Card className="hover:bg-muted/50 transition-colors w-full">
            <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-md">
                    <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-grow">
                    <h3 className="font-semibold">{title}</h3>
                </div>
                <Badge variant={status === 'Verified' ? 'default' : status === 'Add' ? 'outline' : status === 'Pending' ? 'secondary' : 'destructive'}>
                    {getStatusText()}
                </Badge>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
        </Card>
    );
}

export default function VerificationPage() {
    const { user, isLoading, refetchUserData } = useAuthContext();
    const { toast } = useToast();
    
    const handleSendVerificationEmail = async () => {
        const result = await sendVerificationEmail();
        if (result.success) {
            toast({ title: "تم الإرسال!", description: "تم إرسال بريد التحقق. يرجى التحقق من صندوق الوارد الخاص بك." });
        } else {
            toast({ variant: 'destructive', title: "خطأ", description: result.error });
        }
    };
    
    const router = useRouter();
    const handleAddPhoneNumber = () => {
        router.push('/dashboard/profile');
    };

    if (isLoading || !user?.profile) {
        return (
            <div className="flex items-center justify-center h-full min-h-[calc(100vh-theme(spacing.14))]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const { profile } = user;

    // Determine statuses
    const emailStatus = user.emailVerified ? 'Verified' : 'Not Verified';
    const phoneStatus = !profile.phoneNumber ? 'Add' : profile.phoneNumberVerified ? 'Verified' : 'Pending';
    const kycStatus = !profile.kycData ? 'Not Verified' : profile.kycData.status;
    const addressStatus = !profile.addressData ? 'Not Verified' : profile.addressData.status;

    return (
        <div className="space-y-3">
            {/* Email Verification */}
            <button
                className="w-full text-left"
                onClick={emailStatus === 'Not Verified' ? handleSendVerificationEmail : undefined}
                disabled={emailStatus === 'Verified'}
            >
                <VerificationItemContent icon={Mail} title="التحقق من البريد الإلكتروني" status={emailStatus} />
            </button>

            {/* Phone Verification */}
            <button 
                className="w-full text-left"
                onClick={phoneStatus === 'Add' ? handleAddPhoneNumber : undefined}
                disabled={phoneStatus !== 'Add'}
            >
                <VerificationItemContent icon={Phone} title="التحقق من رقم الهاتف" status={phoneStatus} />
            </button>
             
            {/* Identity (KYC) Verification */}
            {kycStatus === 'Verified' || kycStatus === 'Pending' ? (
                 <VerificationItemContent icon={User} title="التحقق من الهوية (KYC)" status={kycStatus} />
            ) : (
                <KycFormDialog onKycSubmit={refetchUserData} />
            )}

            {/* Address Verification */}
            {addressStatus === 'Verified' || addressStatus === 'Pending' ? (
                 <VerificationItemContent icon={Home} title="التحقق من العنوان" status={addressStatus} />
            ) : (
                <AddressFormDialog onAddressSubmit={refetchUserData} />
            )}
        </div>
    );
}
