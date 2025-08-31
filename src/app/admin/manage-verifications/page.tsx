
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getPendingVerifications, updateVerificationStatus } from "../actions";
import { Loader2, Check, X, User, Home, FileText } from "lucide-react";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import type { PendingVerification, KycData, AddressData } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";


const rejectReasonSchema = z.object({
    reason: z.string().min(10, "سبب الرفض مطلوب."),
});
type RejectReasonForm = z.infer<typeof rejectReasonSchema>;

function RejectDialog({ type, userId, onSuccess }: { type: 'kyc' | 'address', userId: string, onSuccess: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<RejectReasonForm>({
        resolver: zodResolver(rejectReasonSchema),
        defaultValues: { reason: "" },
    });

    const onSubmit = async (values: RejectReasonForm) => {
        setIsSubmitting(true);
        const result = await updateVerificationStatus(userId, type, 'Rejected', values.reason);
        if (result.success) {
            toast({ title: "نجاح", description: result.message });
            onSuccess();
            setIsOpen(false);
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
        }
        setIsSubmitting(false);
    };

    return (
         <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="destructive"><X className="ml-2 h-4 w-4"/>رفض</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>رفض طلب التحقق</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>سبب الرفض</FormLabel>
                                    <FormControl><Textarea placeholder="أدخل سببًا واضحًا للرفض..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">إلغاء</Button></DialogClose>
                            <Button type="submit" variant="destructive" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                تأكيد الرفض
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

function VerificationDataCell({ data }: { data: KycData | AddressData }) {
    return (
        <div className="text-xs space-y-1">
            {Object.entries(data).map(([key, value]) => {
                if (key === 'status') return null;
                const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                return <p key={key}><span className="font-semibold">{formattedKey}:</span> {value}</p>;
            })}
        </div>
    );
}

export default function ManageVerificationsPage() {
    const [requests, setRequests] = useState<PendingVerification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const data = await getPendingVerifications();
            setRequests(data);
        } catch (error) {
            toast({ variant: "destructive", title: "خطأ", description: "فشل تحميل طلبات التحقق." });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApprove = async (userId: string, type: 'KYC' | 'Address') => {
        const result = await updateVerificationStatus(userId, type.toLowerCase() as 'kyc' | 'address', 'Verified');
        if (result.success) {
            toast({ title: "نجاح", description: `تمت الموافقة على طلب ${type}.` });
            fetchRequests(); // Refresh the list
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
        }
    };

    const getTypeInfo = (type: 'KYC' | 'Address') => {
        if (type === 'KYC') {
            return { icon: FileText, text: 'تحقق الهوية' };
        }
        return { icon: Home, text: 'تحقق العنوان' };
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="container mx-auto space-y-6">
            <PageHeader
                title="طلبات التحقق المعلقة"
                description={`يوجد ${requests.length} طلب ينتظر المراجعة.`}
            />

            <Card>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>المستخدم</TableHead>
                                <TableHead>النوع</TableHead>
                                <TableHead>البيانات المقدمة</TableHead>
                                <TableHead>تاريخ الطلب</TableHead>
                                <TableHead className="text-left">الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.length > 0 ? requests.map((req, index) => {
                                const { icon: Icon, text } = getTypeInfo(req.type);
                                return (
                                    <TableRow key={`${req.userId}-${req.type}-${index}`}>
                                        <TableCell>
                                            <Button variant="link" className="p-0 h-auto" onClick={() => router.push(`/admin/users/${req.userId}`)}>
                                                {req.userName}
                                            </Button>
                                            <p className="text-xs text-muted-foreground">{req.userEmail}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="gap-2">
                                                <Icon className="h-4 w-4" /> {text}
                                            </Badge>
                                        </TableCell>
                                        <TableCell><VerificationDataCell data={req.data} /></TableCell>
                                        <TableCell>{format(req.requestedAt, 'PP')}</TableCell>
                                        <TableCell className="space-x-2 text-left">
                                            <Button size="sm" variant="default" onClick={() => handleApprove(req.userId, req.type)}>
                                                <Check className="ml-2 h-4 w-4"/>موافقة
                                            </Button>
                                            <RejectDialog type={req.type.toLowerCase() as 'kyc' | 'address'} userId={req.userId} onSuccess={fetchRequests} />
                                        </TableCell>
                                    </TableRow>
                                );
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        لا توجد طلبات تحقق معلقة.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
