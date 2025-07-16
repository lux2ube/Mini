
"use client";

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { getUsers } from '../actions';
import type { UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';

type EnrichedUser = UserProfile & { referredByName?: string };

export default function ManageUsersPage() {
    const [users, setUsers] = useState<EnrichedUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            try {
                const fetchedUsers = await getUsers();

                // Enrich users with referrer names
                const enriched = fetchedUsers.map(user => {
                    const referrer = fetchedUsers.find(u => u.uid === user.referredBy);
                    return {
                        ...user,
                        referredByName: referrer ? referrer.name : '-'
                    };
                });

                enriched.sort((a, b) => {
                    // Handle both Timestamp and Date objects
                    const timeA = a.createdAt && typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
                    const timeB = b.createdAt && typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
                    return timeB - timeA;
                });
                setUsers(enriched);
            } catch (error) {
                console.error("Failed to fetch users:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch users.' });
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [toast]);

    const filteredUsers = useMemo(() => {
        if (!searchQuery) return users;
        const lowerCaseQuery = searchQuery.toLowerCase();
        return users.filter(user =>
            user.name.toLowerCase().includes(lowerCaseQuery) ||
            user.email.toLowerCase().includes(lowerCaseQuery) ||
            (user.referralCode && user.referralCode.toLowerCase().includes(lowerCaseQuery))
        );
    }, [searchQuery, users]);

    const getSafeDate = (timestamp: any) => {
        if (!timestamp) return '-';
        if (typeof timestamp.toDate === 'function') {
            return format(timestamp.toDate(), 'PP');
        }
        if (timestamp instanceof Date) {
            return format(timestamp, 'PP');
        }
        return '-';
    }


    return (
        <div className="container mx-auto space-y-6">
            <PageHeader title="Manage Users" description="View and manage all registered users." />
            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>
                        Found {filteredUsers.length} of {users.length} users.
                    </CardDescription>
                    <Input 
                        placeholder="Search by name, email, referral code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-sm"
                    />
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead>Referrals</TableHead>
                                        <TableHead>Points</TableHead>
                                        <TableHead>Referred By</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map(user => (
                                        <TableRow key={user.uid}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{getSafeDate(user.createdAt)}</TableCell>
                                            <TableCell>{user.referrals?.length || 0}</TableCell>
                                            <TableCell>{user.points || 0}</TableCell>
                                            <TableCell>{user.referredByName}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
