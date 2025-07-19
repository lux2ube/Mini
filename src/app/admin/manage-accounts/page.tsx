
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

function RejectAccountDialog({ accountId, onSuccess }: { accountId: string, onSuccess: () => void }) {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (!reason.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Rejection reason cannot be empty.' });
            return;
        }
        setIsSubmitting(true);
        const result = await updateTradingAccountStatus(accountId, 'Rejected', reason);
        if (result.success) {
            toast({ title: 'Success', description: result.message });
            onSuccess();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
        setIsSubmitting(false);
    }

    return (
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Reject Trading Account</AlertDialogTitle>
                <AlertDialogDescription>
                    Please provide a reason for rejecting this account. The user will be notified.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
                <Label htmlFor="reason">Rejection Reason</Label>
                <Textarea 
                    id="reason" 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Account number does not match our records."
                />
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm Rejection
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    )
}


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

    const handleApprove = async (accountId: string) => {
        const originalAccounts = [...accounts];
        setAccounts(accounts.map(acc => acc.id === accountId ? { ...acc, status: 'Approved' } : acc));

        const result = await updateTradingAccountStatus(accountId, 'Approved');
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
                                        <TableHead>Reason</TableHead>
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
                                            <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{account.rejectionReason}</TableCell>
                                            <TableCell className="space-x-2">
                                                <Button size="icon" variant="outline" className="h-8 w-8 text-green-600 hover:text-green-600" onClick={() => handleApprove(account.id)} disabled={account.status !== 'Pending'}>
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button size="icon" variant="outline" className="h-8 w-8 text-red-600 hover:text-red-600" disabled={account.status !== 'Pending'}>
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <RejectAccountDialog accountId={account.id} onSuccess={fetchAccounts} />
                                                </AlertDialog>
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
