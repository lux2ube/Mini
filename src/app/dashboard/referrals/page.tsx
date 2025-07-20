
"use client";

import React, { useState, useEffect } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, KeyRound, Link as LinkIcon, Users, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthContext } from '@/hooks/useAuthContext';
import { useToast } from '@/hooks/use-toast';
import { db } from "@/lib/firebase/config";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import type { UserProfile } from "@/types";
import { format } from 'date-fns';

type ReferralInfo = Pick<UserProfile, 'uid' | 'name' | 'createdAt'>;

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
                title="Referral Program"
                description="Invite friends and earn rewards for every successful referral."
            />
            
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-2xl font-bold">{user?.profile?.referrals?.length ?? 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">Points Earned</CardTitle>
                        <Gift className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-2xl font-bold">{user?.profile?.points ?? 0}</div>
                    </CardContent>
                </Card>
            </div>


            <Card>
                <CardHeader className="p-4">
                    <CardTitle className="text-base">Share Your Link</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                    <div>
                         <label className="text-sm font-medium">Your Invite Code</label>
                         <div className="flex items-center gap-2">
                             <div className="relative flex-grow">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input readOnly value={referralCode} className="font-mono text-sm pl-10" />
                            </div>
                             <Button variant="outline" size="icon" onClick={() => copyToClipboard(referralCode, 'code')}>
                                <Copy className="h-4 w-4" />
                            </Button>
                         </div>
                    </div>
                     <div>
                         <label className="text-sm font-medium">Your Invite Link</label>
                        <div className="flex items-center gap-2">
                             <div className="relative flex-grow">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input readOnly value={referralLink || ''} className="text-xs pl-10" />
                            </div>
                            <Button variant="outline" size="icon" onClick={() => copyToClipboard(referralLink || '', 'link')}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="p-4">
                    <CardTitle className="text-base">Your Referrals</CardTitle>
                    <CardDescription className="text-xs">
                        A list of users who have signed up with your code.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs">Name</TableHead>
                                    <TableHead className="text-xs text-right">Join Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center h-24">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : referrals.length > 0 ? (
                                    referrals.map(ref => (
                                        <TableRow key={ref.uid}>
                                            <TableCell className="font-medium text-sm">{ref.name}</TableCell>
                                            <TableCell className="text-xs text-right">{ref.createdAt ? format(ref.createdAt, 'PP') : '-'}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center h-24 text-sm text-muted-foreground">
                                            You haven't referred anyone yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
