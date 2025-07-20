
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
import type { UserProfile } from "@/types";
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

type ReferralInfo = Pick<UserProfile, 'uid' | 'name' | 'createdAt'>;

const howItWorks = [
    {
        icon: Share2,
        title: "Share Your Link",
        description: "Copy your unique code or link and send it to your friends."
    },
    {
        icon: UserPlus,
        title: "Friend Signs Up",
        description: "Your friend creates an account using your referral code."
    },
    {
        icon: Award,
        title: "Earn Rewards",
        description: "You both receive points and unlock exclusive benefits."
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
        toast({ title: 'Copied!', description: `Referral ${type} copied to clipboard.` });
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
                        } as ReferralInfo;
                    });
                
                setReferrals(referredUsersData);
            } catch (error) {
                console.error("Error fetching referral details:", error);
                toast({ variant: 'destructive', title: "Error", description: "Could not fetch referral details." });
            } finally {
                setIsLoading(false);
            }
        };
        if (user) {
            fetchReferralDetails();
        }
    }, [user, toast]);
    
    return (
        <div className="max-w-md mx-auto w-full px-4 py-4 space-y-6">
            <PageHeader
                title="Invite & Earn"
                description="Share the love and get rewarded for every friend you invite."
            />
            
            <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
                <CardContent className="p-4 space-y-4">
                     <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Your Referral Code</p>
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
                        <p className="text-sm text-muted-foreground">Your Referral Link</p>
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
                    <CardTitle className="text-base">How It Works</CardTitle>
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
                <CardHeader className="p-4 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base">Your Referrals</CardTitle>
                        <CardDescription className="text-xs">
                            {user?.profile?.referrals?.length ?? 0} successful invites.
                        </CardDescription>
                    </div>
                     <div className="text-right">
                        <p className="text-sm text-muted-foreground">Points</p>
                        <p className="text-2xl font-bold text-primary">{user?.profile?.points ?? 0}</p>
                    </div>
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
                                    </div>
                                    <p className="text-xs text-muted-foreground text-right">
                                        Joined {ref.createdAt ? format(ref.createdAt, 'PP') : '-'}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center h-24 flex items-center justify-center text-sm text-muted-foreground">
                                You haven't referred anyone yet.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
