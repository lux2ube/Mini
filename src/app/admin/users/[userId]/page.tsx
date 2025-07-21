
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
import { getUserDetails } from "../../actions";
import { Loader2, User, Wallet, Briefcase, Gift, ArrowRight } from "lucide-react";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

type UserDetails = Awaited<ReturnType<typeof getUserDetails>>;

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
    
    useEffect(() => {
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
    
    const { userProfile, balance, tradingAccounts, cashbackTransactions, referredByName, referralsWithNames } = details;

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Approved': return 'default';
            case 'Pending': return 'secondary';
            case 'Rejected': return 'destructive';
            default: return 'outline';
        }
    }
    
    const getStatusText = (status: string) => {
        switch (status) {
            case 'Approved': return 'مقبول';
            case 'Pending': return 'معلق';
            case 'Rejected': return 'مرفوض';
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
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2"><Briefcase/> حسابات التداول</CardTitle>
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
                </div>
            </div>
        </div>
    )
}
