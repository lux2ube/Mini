
"use client";

import { useState, useEffect } from "react";
import { useParams, notFound } from 'next/navigation';
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getUserDetails, getBrokers, adminAddTradingAccount } from "../../actions";
import { Loader2, User, Wallet, Briefcase, Gift, ArrowRight, ArrowUpFromLine, ShoppingBag, PlusCircle } from "lucide-react";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import type { Broker } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type UserDetails = Awaited<ReturnType<typeof getUserDetails>>;

const addAccountSchema = z.object({
  brokerName: z.string({ required_error: "الرجاء اختيار وسيط." }),
  accountNumber: z.string().min(3, "رقم الحساب قصير جدًا."),
});

type AddAccountForm = z.infer<typeof addAccountSchema>;

function AddAccountDialog({ userId, onSuccess }: { userId: string, onSuccess: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [brokers, setBrokers] = useState<Broker[]>([]);
    const { toast } = useToast();
    
    useEffect(() => {
        if(isOpen) {
            getBrokers().then(setBrokers);
        }
    }, [isOpen]);

    const form = useForm<AddAccountForm>({
        resolver: zodResolver(addAccountSchema),
        defaultValues: {
            accountNumber: "",
        },
    });

    const onSubmit = async (values: AddAccountForm) => {
        setIsSubmitting(true);
        const result = await adminAddTradingAccount(userId, values.brokerName, values.accountNumber);
        if (result.success) {
            toast({ title: "نجاح", description: result.message });
            onSuccess();
            setIsOpen(false);
            form.reset();
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
        }
        setIsSubmitting(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button size="sm"><PlusCircle className="ml-2 h-4 w-4" /> إضافة حساب</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>إضافة حساب تداول</DialogTitle>
                    <DialogDescription>
                        أضف حسابًا جديدًا لهذا المستخدم. سيتم الموافقة عليه تلقائيًا.
                    </DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="brokerName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>الوسيط</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="اختر وسيطًا" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {brokers.map(b => <SelectItem key={b.id} value={b.basicInfo?.broker_name || b.name}>{b.basicInfo?.broker_name || b.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="accountNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>رقم الحساب</FormLabel>
                                    <FormControl><Input placeholder="12345678" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">إلغاء</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                إضافة حساب
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

function InfoRow({ label, value, children }: { label: string, value?: any, children?: React.ReactNode }) {
    if (!value && !children) return null;
    return (
        <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-right">
                {children || value}
            </span>
        </div>
    )
}

export default function UserDetailPage() {
    const params = useParams();
    const userId = params.userId as string;
    const { toast } = useToast();
    const [details, setDetails] = useState<UserDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const fetchDetails = async () => {
        if (!userId) return;
        setIsLoading(true);
        try {
            const data = await getUserDetails(userId);
            if ('error' in data) {
                toast({ variant: 'destructive', title: "خطأ", description: data.error });
                return notFound();
            }
            setDetails(data);
        } catch (error) {
            toast({ variant: 'destructive', title: "خطأ", description: "فشل جلب تفاصيل المستخدم." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [userId, toast]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!details || !details.userProfile) {
        return notFound();
    }
    
    const { userProfile, balance, tradingAccounts, cashbackTransactions, withdrawals, orders, referredByName, referralsWithNames } = details;

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Approved': return 'default';
            case 'Pending': return 'secondary';
            case 'Rejected': return 'destructive';
            case 'Completed': return 'default';
            case 'Processing': return 'secondary';
            case 'Failed': return 'destructive';
            case 'Delivered': return 'default';
            case 'Shipped': return 'outline';
            case 'Cancelled': return 'destructive';
            default: return 'outline';
        }
    }
    
    const getStatusText = (status: string) => {
        switch (status) {
            case 'Approved': return 'مقبول';
            case 'Pending': return 'معلق';
            case 'Rejected': return 'مرفوض';
            case 'Completed': return 'مكتمل';
            case 'Processing': return 'قيد المعالجة';
            case 'Failed': return 'فشل';
            case 'Delivered': return 'تم التوصيل';
            case 'Shipped': return 'تم الشحن';
            case 'Cancelled': return 'ملغي';
            default: return status;
        }
    }

    return (
        <div className="container mx-auto space-y-6">
            <PageHeader
                title={userProfile.name}
                description={`عرض شامل للمستخدم ${userProfile.clientId}`}
            />
            
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2"><User/> ملخص المستخدم</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                           <InfoRow label="معرف العميل" value={userProfile.clientId} />
                           <InfoRow label="البريد الإلكتروني" value={userProfile.email} />
                           <InfoRow label="تاريخ الانضمام" value={userProfile.createdAt ? format(userProfile.createdAt, 'PP') : '-'} />
                           <InfoRow label="UID" value={userProfile.uid} />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2"><Wallet/> ملخص مالي</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                           <InfoRow label="الرصيد المتاح"><span className="text-primary font-bold">${balance.availableBalance.toFixed(2)}</span></InfoRow>
                           <InfoRow label="إجمالي المكتسب" value={`$${balance.totalEarned.toFixed(2)}`} />
                           <InfoRow label="إجمالي المسحوب" value={`$${balance.completedWithdrawals.toFixed(2)}`} />
                           <InfoRow label="سحوبات معلقة" value={`$${balance.pendingWithdrawals.toFixed(2)}`} />
                           <InfoRow label="المصروف في المتجر" value={`$${balance.totalSpentOnOrders.toFixed(2)}`} />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2"><Gift/> ملخص الإحالات</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <InfoRow label="النقاط" value={userProfile.points} />
                            <InfoRow label="تمت إحالته بواسطة" value={referredByName || 'لا يوجد'} />
                            <Separator />
                            <div>
                                <h4 className="font-medium text-sm mb-2">المستخدمون المحالون ({referralsWithNames.length})</h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {referralsWithNames.length > 0 ? referralsWithNames.map(ref => (
                                        <Link key={ref.uid} href={`/admin/users/${ref.uid}`} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-muted">
                                            <span>{ref.name}</span>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground"/>
                                        </Link>
                                    )) : <p className="text-sm text-muted-foreground">لم يحل أي مستخدمين.</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Briefcase/>
                                <CardTitle className="text-base">حسابات التداول</CardTitle>
                            </div>
                            <AddAccountDialog userId={userId} onSuccess={fetchDetails} />
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>الوسيط</TableHead>
                                        <TableHead>رقم الحساب</TableHead>
                                        <TableHead>الحالة</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tradingAccounts.length > 0 ? tradingAccounts.map(acc => (
                                        <TableRow key={acc.id}>
                                            <TableCell>{acc.broker}</TableCell>
                                            <TableCell>{acc.accountNumber}</TableCell>
                                            <TableCell><Badge variant={getStatusVariant(acc.status)}>{getStatusText(acc.status)}</Badge></TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={3} className="text-center">لا توجد حسابات مرتبطة.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">سجل الكاش باك</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>التاريخ</TableHead>
                                        <TableHead>التفاصيل</TableHead>
                                        <TableHead className="text-left">المبلغ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                     {cashbackTransactions.length > 0 ? cashbackTransactions.map(tx => (
                                        <TableRow key={tx.id}>
                                            <TableCell>{format(tx.date, 'PP')}</TableCell>
                                            <TableCell>{tx.tradeDetails}</TableCell>
                                            <TableCell className="text-left font-medium text-primary">${tx.cashbackAmount.toFixed(2)}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={3} className="text-center">لا توجد معاملات كاش باك.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-base flex items-center gap-2"><ArrowUpFromLine /> سجل السحب</CardTitle></CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader><TableRow><TableHead>التاريخ</TableHead><TableHead>الطريقة</TableHead><TableHead>الحالة</TableHead><TableHead className="text-left">المبلغ</TableHead></TableRow></TableHeader>
                                <TableBody>
                                     {withdrawals.length > 0 ? withdrawals.map(w => (
                                        <TableRow key={w.id}>
                                            <TableCell>{format(w.requestedAt, 'PP')}</TableCell>
                                            <TableCell>{w.paymentMethod}</TableCell>
                                            <TableCell><Badge variant={getStatusVariant(w.status)}>{getStatusText(w.status)}</Badge></TableCell>
                                            <TableCell className="text-left font-medium">${w.amount.toFixed(2)}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={4} className="text-center">لا توجد طلبات سحب.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShoppingBag /> سجل طلبات المتجر</CardTitle></CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader><TableRow><TableHead>التاريخ</TableHead><TableHead>المنتج</TableHead><TableHead>الحالة</TableHead><TableHead className="text-left">السعر</TableHead></TableRow></TableHeader>
                                <TableBody>
                                     {orders.length > 0 ? orders.map(o => (
                                        <TableRow key={o.id}>
                                            <TableCell>{format(o.createdAt, 'PP')}</TableCell>
                                            <TableCell>{o.productName}</TableCell>
                                            <TableCell><Badge variant={getStatusVariant(o.status)}>{getStatusText(o.status)}</Badge></TableCell>
                                            <TableCell className="text-left font-medium">${o.price.toFixed(2)}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={4} className="text-center">لا توجد طلبات من المتجر.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
