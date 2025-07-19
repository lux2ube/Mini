
"use client";

import { useAuthContext } from "@/hooks/useAuthContext";
import { Loader2, Copy, Verified, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

function ProfileInfoItem({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
    const { toast } = useToast();
    
    const handleCopy = () => {
        if (value) {
            navigator.clipboard.writeText(value);
            toast({ title: 'Copied!', description: `${label} copied to clipboard.` });
        }
    }

    return (
        <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <div className="text-sm font-medium flex items-center gap-2">
                <span className="truncate">{children || value}</span>
                {value && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
                        <Copy className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    )
}

export default function ProfilePage() {
    const { user, isLoading } = useAuthContext();

    if (isLoading || !user || !user.profile) {
        return (
            <div className="flex items-center justify-center h-full min-h-[calc(100vh-theme(spacing.14))]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const { profile } = user;

    return (
        <div className="max-w-md mx-auto w-full px-4 py-4 space-y-4">
            <PageHeader title="Profile Details" description="Your personal account information." />
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Identity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ProfileInfoItem label="Full Name" value={profile.name} />
                    <ProfileInfoItem label="Email Address">
                        <div className="flex items-center gap-2">
                            <span>{profile.email}</span>
                            {user.emailVerified ? (
                                <Badge variant="default" className="bg-green-600 hover:bg-green-700"><Verified className="mr-1 h-3 w-3" /> Verified</Badge>
                            ) : (
                                <Badge variant="destructive"><ShieldAlert className="mr-1 h-3 w-3" /> Not Verified</Badge>
                            )}
                        </div>
                    </ProfileInfoItem>
                    <ProfileInfoItem label="User ID (UID)" value={profile.uid} />
                </CardContent>
            </Card>
        </div>
    )
}
