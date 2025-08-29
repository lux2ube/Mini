
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
import { doc, getDoc, Timestamp } from "firebase/firestore";
import type { UserProfile, UserStatus } from "@/types";
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

type ReferralInfo = Pick<UserProfile, 'uid' | 'name' | 'createdAt' | 'status'>;

const howItWorks = [
    {
        icon: Share2,
        title: "شارك رابطك",
        description: "انسخ الكود أو الرابط الفريد الخاص بك وأرسله إلى أصدقائك."
    },
    {
        icon: UserPlus,
        title: "صديقك يسجل",
        description: "صديقك ينشئ حسابًا باستخدام رمز الإحالة الخاص بك."
    },
    {
        icon: Award,
        title: "اربحوا المكافآت",
        description: "تحصلون كلاكما على نقاط وتفتحون مزايا حصرية."
    }
]

export default function ReferralsPage() {
    const { user } = useAuthContext();
    const { toast } = useToast();
    const [referrals, setReferrals] = useState<ReferralInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const referralLink = user && typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${user.profile?.referralCode}` : '';
    const referralCode = user?.profile?.referralCode || '';

    const copyToClipboard = (text: string, type: 'link' | 'code') => {
        navigator.clipboard.writeText(text);
        toast({ title: 'تم النسخ!', description: `تم نسخ ${type === 'link' ? 'رابط' : 'كود'} الإحالة إلى الحافظة.` });
    };

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
                            status: data.status || 'NEW', // Default to NEW if status is missing
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

    return (
        <div className="max-w-md mx-auto w-full px-4 py-4 space-y-6">
            <PageHeader
                title="ادع واربح"
                description="شارك الحب واحصل على مكافأة مقابل كل صديق تدعوه."
            />

            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إحالاتك</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">{user?.profile?.referrals?.length ?? 0}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">نقاطك</CardTitle>
                        <Gift className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-primary">{user?.profile?.points ?? 0}</div>
                    </CardContent>
                </Card>
            </div>
            
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


            <Card>
                <CardHeader>
                    <CardTitle className="text-base">كيف تعمل</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   {howItWorks.map((item, index) => (
                       <div key={item.title} className="flex items-start gap-4">
                           <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center">
                               <item.icon className="h-5 w-5" />
                           </div>
                           <div className="flex-grow">
                               <h3 className="font-semibold text-sm">{item.title}</h3>
                               <p className="text-xs text-muted-foreground">{item.description}</p>
                           </div>
                       </div>
                   ))}
                </CardContent>
            </Card>

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
        </div>
    );
}
