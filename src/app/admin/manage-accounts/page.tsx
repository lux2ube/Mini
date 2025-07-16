
"use client";

import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { getTradingAccounts, updateTradingAccountStatus } from '../actions';
import type { TradingAccount } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Timestamp } from 'firebase/firestore';

export default function ManageAccountsPage() {
    const [accounts, setAccounts] = useState<TradingAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchAccounts = async () => {
        setIsLoading(true);
        try {
            const fetchedAccounts = await getTradingAccounts();
            // Sort by most recent first
            fetchedAccounts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            setAccounts(fetchedAccounts);
        } catch (error) {
            console.error("Failed to fetch accounts:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch trading accounts.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const handleStatusUpdate = async (accountId: string, status: 'Approved' | 'Rejected') => {
        const originalAccounts = [...accounts];
        // Optimistic update
        setAccounts(accounts.map(acc => acc.id === accountId ? { ...acc, status } : acc));

        const result = await updateTradingAccountStatus(accountId, status);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
            setAccounts(originalAccounts); // Revert on failure
        } else {
            toast({ title: 'Success', description: result.message });
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Approved': return 'default';
            case 'Pending': return 'secondary';
            case 'Rejected': return 'destructive';
            default: return 'outline';
        }
    }

    return (
        <div className="container mx-auto space-y-6">
            <PageHeader title="Manage Trading Accounts" description="Approve or reject user-submitted trading accounts." />
            <Card>
                <CardHeader>
                    <CardTitle>All Accounts</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User ID</TableHead>
                                        <TableHead>Broker</TableHead>
                                        <TableHead>Account #</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {accounts.map(account => (
                                        <TableRow key={account.id}>
                                            <TableCell className="text-xs text-muted-foreground truncate" style={{ maxWidth: '100px' }}>{account.userId}</TableCell>
                                            <TableCell>{account.broker}</TableCell>
                                            <TableCell>{account.accountNumber}</TableCell>
                                            <TableCell><Badge variant={getStatusVariant(account.status)}>{account.status}</Badge></TableCell>
                                            <TableCell className="space-x-2">
                                                <Button size="icon" variant="outline" className="h-8 w-8 text-green-600 hover:text-green-600" onClick={() => handleStatusUpdate(account.id, 'Approved')} disabled={account.status === 'Approved'}>
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="outline" className="h-8 w-8 text-red-600 hover:text-red-600" onClick={() => handleStatusUpdate(account.id, 'Rejected')} disabled={account.status === 'Rejected'}>
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
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
