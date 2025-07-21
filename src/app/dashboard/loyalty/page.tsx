
"use client";

import React from 'react';
import { useAuthContext } from "@/hooks/useAuthContext";
import { Loader2, ArrowLeft, Star, Gem, Target, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { LoyaltyTier, UserProfile } from '@/types';
import { useRouter } from 'next/navigation';

const loyaltyTiers: LoyaltyTier[] = [
    { name: 'New', monthlyPointsRequired: 0, referralCommissionPercent: 0, storeDiscountPercent: 0 },
    { name: 'Bronze', monthlyPointsRequired: 100, referralCommissionPercent: 5, storeDiscountPercent: 2 },
    { name: 'Silver', monthlyPointsRequired: 500, referralCommissionPercent: 10, storeDiscountPercent: 5 },
    { name: 'Gold', monthlyPointsRequired: 2000, referralCommissionPercent: 15, storeDiscountPercent: 10 },
    { name: 'Diamond', monthlyPointsRequired: 10000, referralCommissionPercent: 25, storeDiscountPercent: 20 },
];

const earningMethods = [
    { title: "ربط حساب تداول", points: "+50 نقطة لكل حساب" },
    { title: "الحصول على كاش باك", points: "+1 نقطة لكل 1$ مكتسب" },
    { title: "الشراء من المتجر", points: "+1 نقطة لكل 1$ يتم إنفاقه" },
    { title: "دعوة صديق", points: "+25 نقطة لكل صديق" },
];

const getTierDetails = (tierName: UserProfile['tier']): LoyaltyTier => {
    return loyaltyTiers.find(t => t.name === tierName) || loyaltyTiers[0];
};

const getNextTier = (currentTierName: UserProfile['tier']): LoyaltyTier | null => {
    const currentIndex = loyaltyTiers.findIndex(t => t.name === currentTierName);
    if (currentIndex < loyaltyTiers.length - 1) {
        return loyaltyTiers[currentIndex + 1];
    }
    return null;
};

export default function LoyaltyPage() {
    const { user, isLoading } = useAuthContext();
    const router = useRouter();

    if (isLoading || !user || !user.profile) {
        return (
            <div className="flex items-center justify-center h-full min-h-[calc(100vh-theme(spacing.14))]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const currentTier = getTierDetails(user.profile.tier);
    const nextTier = getNextTier(user.profile.tier);
    
    const progress = nextTier ? Math.min((user.profile.monthlyPoints / nextTier.monthlyPointsRequired) * 100, 100) : 100;
    const pointsNeeded = nextTier ? nextTier.monthlyPointsRequired - user.profile.monthlyPoints : 0;

    return (
        <div className="max-w-md mx-auto w-full px-4 py-4 space-y-6">
            <Button variant="ghost" onClick={() => router.back()} className="h-auto p-0 text-sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                العودة إلى الإعدادات
            </Button>
            <PageHeader title="برنامج الولاء" description="اكسب نقاطًا، ارتقِ في المستويات، وافتح مكافآت حصرية." />

            <Card className="bg-gradient-to-tr from-primary to-accent text-primary-foreground overflow-hidden">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>مستواك الحالي</CardTitle>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/20">
                            <Gem className="h-4 w-4" />
                            <span className="font-bold">{currentTier.name}</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex justify-around text-center">
                    <div>
                        <p className="text-xs opacity-80">عمولة الإحالة</p>
                        <p className="text-lg font-bold">{currentTier.referralCommissionPercent}%</p>
                    </div>
                    <div>
                        <p className="text-xs opacity-80">خصم المتجر</p>
                        <p className="text-lg font-bold">{currentTier.storeDiscountPercent}%</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">تقدمك الشهري</CardTitle>
                </CardHeader>
                <CardContent>
                    {nextTier ? (
                        <div className="space-y-3">
                            <Progress value={progress} />
                            <div className="flex justify-between text-sm">
                                <span className="font-semibold text-primary">{user.profile.monthlyPoints.toLocaleString()} نقطة</span>
                                <span className="text-muted-foreground">الهدف: {nextTier.monthlyPointsRequired.toLocaleString()} نقطة</span>
                            </div>
                            <p className="text-center text-sm text-muted-foreground">
                                أنت بحاجة إلى <span className="font-bold text-primary">{pointsNeeded.toLocaleString()}</span> نقطة أخرى للوصول إلى مستوى {nextTier.name}.
                            </p>
                        </div>
                    ) : (
                        <p className="text-center font-semibold text-primary">لقد وصلت إلى أعلى مستوى! تهانينا!</p>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
                 <Card>
                    <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي النقاط</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">{user.profile.points.toLocaleString()}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">نقاط هذا الشهر</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">{user.profile.monthlyPoints.toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">كيف تكسب النقاط</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {earningMethods.map(method => (
                        <div key={method.title} className="flex items-center p-3 rounded-md bg-muted/50">
                            <CheckCircle className="h-5 w-5 text-primary ml-3" />
                            <div className="flex-grow">
                                <p className="font-medium text-sm">{method.title}</p>
                            </div>
                            <p className="text-sm font-semibold text-primary">{method.points}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>

        </div>
    );
}
