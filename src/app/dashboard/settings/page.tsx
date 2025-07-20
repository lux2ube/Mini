
"use client";

import { useAuthContext } from "@/hooks/useAuthContext";
import { Loader2, UserCheck, Lock, Activity, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
    const { user, isLoading } = useAuthContext();
    const router = useRouter();

    if (isLoading || !user?.profile) {
        return (
            <div className="flex items-center justify-center h-full min-h-[calc(100vh-theme(spacing.14))]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="max-w-md mx-auto w-full px-4 py-4 space-y-6">
            <Button variant="ghost" onClick={() => router.push('/dashboard')} className="h-auto p-0 text-sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                العودة إلى لوحة التحكم
            </Button>
            <PageHeader title="الإعدادات" description="إدارة حسابك والأمان والتحقق." />

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">مرحبا بك في الإعدادات</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        استخدم القائمة للتنقل عبر ملفك الشخصي وإعدادات الأمان والتحقق. 
                        انقر فوق أيقونة الملف الشخصي في الزاوية العلوية اليمنى لفتح لوحة الإعدادات في أي وقت.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
