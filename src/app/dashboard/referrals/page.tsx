
"use client";

import React, { useState, useEffect } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, KeyRound, Link as LinkIcon, Users, Gift, Share2, UserPlus, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthContext } from '@/hooks/useAuthContext';
import { useToast } from '@/hooks/use-toast';
import { db } from "@/lib/firebase/config";
import { doc, getDoc, Timestamp, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import type { UserProfile, UserStatus, CashbackTransaction } from "@/types";
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


type ReferralInfo = Pick<UserProfile, 'uid' | 'name' | 'createdAt' | 'status'>;

const getStatusText = (status: UserStatus) => {
    switch (status) {
        case 'NEW': return 'جديد';
        case 'Active': return 'نشط';
        case 'Trader': return 'متداول';
        default: return 'غير معروف';
    }
};

const getStatusVariant = (status: UserStatus) => {
    switch (status) {
        case 'NEW': return 'secondary';
        case 'Active': return 'outline';
        case 'Trader': return 'default';
        default: return 'secondary';
    }
};

async function getCommissionHistory(userId: string): Promise<CashbackTransaction[]> {
    // Broaden the query to get all cashback transactions for the user.
    const q = query(
        collection(db, "cashbackTransactions"),
        where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    const allTransactions = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            date: (data.date as Timestamp).toDate(),
        } as CashbackTransaction;
    });

    // Filter and sort in code to avoid needing a composite index.
    const commissionTransactions = allTransactions.filter(
        tx => tx.sourceType === 'cashback' || tx.sourceType === 'store_purchase'
    );
    
    commissionTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    return commissionTransactions;
}


function CommissionHistoryTab() {
    const { user } = useAuthContext();
    const [history, setHistory] = useState<CashbackTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            getCommissionHistory(user.uid).then(data => {
                setHistory(data);
                setIsLoading(false);
            });
        }
    }, [user]);
    
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <Card>
            <CardHeader className="p-4">
                <CardTitle className="text-base">سجل العمولات</CardTitle>
                <CardDescription className="text-xs">
                    جميع العمولات التي كسبتها من إحالاتك.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>التاريخ</TableHead>
                            <TableHead>المصدر</TableHead>
                            <TableHead className="text-left">المبلغ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history.length > 0 ? history.map(tx => (
                            <TableRow key={tx.id}>
                                <TableCell className="text-xs">{format(tx.date, "PP")}</TableCell>
                                <TableCell>
                                    <p className="text-xs font-medium">{tx.tradeDetails}</p>
                                    <p className="text-xs text-muted-foreground">
                                        من {tx.sourceType === 'cashback' ? 'كاش باك' : 'شراء من المتجر'}
                                    </p>
                                </TableCell>
                                <TableCell className="text-left font-semibold text-primary text-xs">
                                    +${tx.cashbackAmount.toFixed(2)}
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24 text-sm text-muted-foreground">
                                    لم تكسب أي عمولات بعد.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}


function ReferralsListTab() {
    const { user } = useAuthContext();
    const { toast } = useToast();
    const [referrals, setReferrals] = useState<ReferralInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

     useEffect(() => {
        const fetchReferralDetails = async () => {
            if (!user || !user.profile || !user.profile.referrals) {
                setIsLoading(false);
                return;
            }
            
            try {
                const referredUsersPromises = user.profile.referrals.map(uid => getDoc(doc(db, 'users', uid)));
                const referredUsersDocs = await Promise.all(referredUsersPromises);

                const referredUsersData = referredUsersDocs
                    .filter(docSnap => docSnap.exists())
                    .map(docSnap => {
                        const data = docSnap.data();
                        return {
                            uid: docSnap.id,
                            name: data.name,
                            createdAt: (data.createdAt as Timestamp).toDate(),
                            status: data.status || 'NEW',
                        } as ReferralInfo;
                    });
                
                setReferrals(referredUsersData);
            } catch (error) {
                console.error("Error fetching referral details:", error);
                toast({ variant: 'destructive', title: "خطأ", description: "تعذر جلب تفاصيل الإحالة." });
            } finally {
                setIsLoading(false);
            }
        };
        if (user) {
            fetchReferralDetails();
        }
    }, [user, toast]);

    return (
        <Card>
            <CardHeader className="p-4">
                <CardTitle className="text-base">سجل الإحالات الخاص بك</CardTitle>
                <CardDescription className="text-xs">
                    قائمة بالمستخدمين الذين دعوتهم بنجاح.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="space-y-1 p-2 max-h-80 overflow-y-auto">
                     {isLoading ? (
                        <div className="flex justify-center items-center h-24">
                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : referrals.length > 0 ? (
                        referrals.map(ref => (
                            <div key={ref.uid} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                                <Avatar>
                                    <AvatarFallback>{ref.name ? ref.name.charAt(0).toUpperCase() : '?'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-grow">
                                    <p className="font-medium text-sm">{ref.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        انضم في {ref.createdAt ? format(ref.createdAt, 'PP') : '-'}
                                    </p>
                                </div>
                                <Badge variant={getStatusVariant(ref.status)}>{getStatusText(ref.status)}</Badge>
                            </div>
                        ))
                    ) : (
                        <div className="text-center h-24 flex items-center justify-center text-sm text-muted-foreground">
                            لم تقم بإحالة أي شخص بعد.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export default function ReferralsPage() {
    const { user } = useAuthContext();
    const { toast } = useToast();
    
    const referralLink = user && typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${user.profile?.referralCode}` : '';
    const referralCode = user?.profile?.referralCode || '';

    const copyToClipboard = (text: string, type: 'link' | 'code') => {
        navigator.clipboard.writeText(text);
        toast({ title: 'تم النسخ!', description: `تم نسخ ${type === 'link' ? 'رابط' : 'كود'} الإحالة إلى الحافظة.` });
    };

    return (
        <div className="max-w-md mx-auto w-full px-4 py-4 space-y-6">
            <PageHeader
                title="ادع واربح"
                description="شارك الحب واحصل على مكافأة مقابل كل صديق تدعوه."
            />

            <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
                <CardContent className="p-4 space-y-4">
                     <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">كود الإحالة الخاص بك</p>
                        <div className="flex items-center gap-2">
                            <div className="flex-grow p-2 text-center rounded-md border border-dashed border-primary/50 bg-background/50">
                                <p className="font-bold text-2xl text-primary tracking-widest">{referralCode}</p>
                            </div>
                            <Button variant="default" size="icon" onClick={() => copyToClipboard(referralCode || '', 'code')}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">رابط الإحالة الخاص بك</p>
                         <div className="flex items-center gap-2">
                            <Input readOnly value={referralLink || ''} className="text-xs bg-background/50" />
                            <Button variant="default" size="icon" onClick={() => copyToClipboard(referralLink || '', 'link')}>
                                <LinkIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="referrals" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="referrals">إحالاتي</TabsTrigger>
                    <TabsTrigger value="history">سجل العمولات</TabsTrigger>
                </TabsList>
                <TabsContent value="referrals" className="mt-4">
                    <ReferralsListTab />
                </TabsContent>
                <TabsContent value="history" className="mt-4">
                   <CommissionHistoryTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
