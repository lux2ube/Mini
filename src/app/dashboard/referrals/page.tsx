
"use client";

import React, { useState, useEffect } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, KeyRound } from "lucide-react";
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

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied!', description: 'Referral link copied to clipboard.' });
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
        <div className="max-w-[400px] mx-auto w-full px-4 py-4 space-y-4">
            <PageHeader
                title="Referral Program"
                description="Your referral statistics and invite link."
            />
            
            <Card>
                <CardHeader className="p-4">
                    <CardTitle className="text-base">Your Invite Link</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex items-center gap-2">
                    <div className="relative flex-grow">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input readOnly value={referralLink || ''} className="text-xs pl-10" />
                    </div>
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(referralLink || '')}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="p-4">
                    <CardTitle className="text-base">Your Referrals</CardTitle>
                    <CardDescription className="text-xs">
                        You have invited {referrals.length} {referrals.length === 1 ? 'user' : 'users'}.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs">Name</TableHead>
                                    <TableHead className="text-xs">Join Date</TableHead>
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
                                            <TableCell className="font-medium text-xs">{ref.name}</TableCell>
                                            <TableCell className="text-xs">{ref.createdAt ? format(ref.createdAt, 'PP') : '-'}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center h-24 text-xs">
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
