
"use client";

import { useAuthContext } from "@/hooks/useAuthContext";
import { Loader2, ChevronRight, ShieldCheck, UserCheck, Lock, Activity } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

function SettingsItem({ href, icon: Icon, title, description }: { href: string, icon: React.ElementType, title: string, description: string }) {
    return (
        <Link href={href}>
            <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-md">
                        <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-grow">
                        <h3 className="font-semibold">{title}</h3>
                        <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
            </Card>
        </Link>
    );
}

export default function SettingsPage() {
    const { user, isLoading } = useAuthContext();

    if (isLoading || !user?.profile) {
        return (
            <div className="flex items-center justify-center h-full min-h-[calc(100vh-theme(spacing.14))]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const { profile } = user;
    const isVerified = profile.isVerified ?? false;

    return (
        <div className="max-w-md mx-auto w-full px-4 py-4 space-y-6">
            <PageHeader title="Settings" description="Manage your account, security, and verification." />

            <Link href="/dashboard/profile">
                 <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4 flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarFallback className="text-2xl bg-primary/20 text-primary font-bold">
                                {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-grow space-y-1">
                            <h2 className="font-bold text-lg">{profile.name}</h2>
                            <div className="flex items-center gap-2">
                                <Badge variant={isVerified ? "default" : "secondary"}>
                                    <ShieldCheck className="mr-1.5 h-3 w-3" />
                                    {isVerified ? "Verified" : "Not Verified"}
                                 </Badge>
                                 <Badge variant="outline">{profile.tier || 'Bronze'}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground font-mono pt-1">UID: {profile.uid.slice(0, 12)}...</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </CardContent>
                </Card>
            </Link>

            <div className="space-y-3">
               <SettingsItem 
                    href="/dashboard/settings/verification"
                    icon={UserCheck}
                    title="Verification Center"
                    description="Complete KYC, email, and phone verification."
               />
               <SettingsItem 
                    href="/dashboard/settings/security"
                    icon={Lock}
                    title="Security Center"
                    description="Manage password and two-factor authentication."
               />
                <SettingsItem 
                    href="/dashboard/settings/activity-logs"
                    icon={Activity}
                    title="Activity Logs"
                    description="Review your recent account activity."
               />
            </div>
        </div>
    );
}
