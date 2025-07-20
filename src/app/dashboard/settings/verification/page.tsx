
"use client"

import { useAuthContext } from "@/hooks/useAuthContext";
import { Loader2, ChevronRight, Mail, Phone, User, Home, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

function VerificationItem({ icon: Icon, title, status, onClick }: { icon: React.ElementType, title: string, status: 'Verified' | 'Not Verified' | 'Pending', onClick: () => void }) {
    
    const getStatusText = (status: string) => {
        switch (status) {
            case 'Verified': return 'تم التحقق';
            case 'Not Verified': return 'لم يتم التحقق';
            case 'Pending': return 'قيد المراجعة';
            default: return status;
        }
    }
    
    return (
        <Card className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={onClick}>
            <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-md">
                    <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-grow">
                    <h3 className="font-semibold">{title}</h3>
                </div>
                <Badge variant={status === 'Verified' ? 'default' : status === 'Pending' ? 'secondary' : 'destructive'}>
                    {getStatusText(status)}
                </Badge>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
        </Card>
    );
}

export default function VerificationPage() {
    const { user, isLoading } = useAuthContext();
    const router = useRouter();

    if (isLoading || !user?.profile) {
        return (
            <div className="flex items-center justify-center h-full min-h-[calc(100vh-theme(spacing.14))]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // These would come from the user's profile in a real implementation
    const verificationStatus = {
        email: 'Verified',
        phone: 'Not Verified',
        identity: 'Pending',
        address: 'Not Verified',
    };

    return (
        <div className="max-w-md mx-auto w-full px-4 py-4 space-y-6">
             <Button variant="ghost" onClick={() => router.back()} className="h-auto p-0 text-sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                العودة إلى الإعدادات
            </Button>
            <PageHeader title="مركز التحقق" description="قم بتأمين حسابك وفتح حدود أعلى." />

            <div className="space-y-3">
                <VerificationItem 
                    icon={Mail}
                    title="التحقق من البريد الإلكتروني"
                    status={verificationStatus.email as any}
                    onClick={() => {}}
                />
                <VerificationItem 
                    icon={Phone}
                    title="التحقق من رقم الهاتف"
                    status={verificationStatus.phone as any}
                    onClick={() => {}}
                />
                 <VerificationItem 
                    icon={User}
                    title="التحقق من الهوية (KYC)"
                    status={verificationStatus.identity as any}
                    onClick={() => {}}
                />
                 <VerificationItem 
                    icon={Home}
                    title="التحقق من العنوان"
                    status={verificationStatus.address as any}
                    onClick={() => {}}
                />
            </div>
        </div>
    );
}
