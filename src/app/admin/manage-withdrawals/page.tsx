

"use client";

import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { approveWithdrawal, getWithdrawals, rejectWithdrawal } from '../actions';
import type { Withdrawal } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function ApproveWithdrawalDialog({ withdrawalId, onSuccess }: { withdrawalId: string, onSuccess: () => void }) {
    const [txId, setTxId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (!txId.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Transaction ID cannot be empty.' });
            return;
        }
        setIsSubmitting(true);
        const result = await approveWithdrawal(withdrawalId, txId);
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
                <AlertDialogTitle>Approve Withdrawal</AlertDialogTitle>
                <AlertDialogDescription>
                    Enter the blockchain transaction ID (TXID) or internal reference to confirm this withdrawal has been sent.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
                <Label htmlFor="txid">Transaction ID / Reference</Label>
                <Input 
                    id="txid" 
                    value={txId} 
                    onChange={(e) => setTxId(e.target.value)}
                    placeholder="0x..."
                />
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Approve
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    )
}

function WithdrawalDetail({ label, value }: { label: string, value: any }) {
    if (!value) return null;
    return (
        <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold">{label}:</span>
            <span className="text-muted-foreground truncate" style={{ maxWidth: '150px' }}>
                {value}
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(value); }}>
                <Copy className="h-3 w-3" />
            </Button>
        </div>
    )
}

export default function ManageWithdrawalsPage() {
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchWithdrawals = async () => {
        setIsLoading(true);
        try {
            const data = await getWithdrawals();
            setWithdrawals(data);
        } catch (error) {
            console.error("Failed to fetch withdrawals:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch withdrawals.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const handleReject = async (withdrawalId: string) => {
        const result = await rejectWithdrawal(withdrawalId);
        if (result.success) {
            toast({ title: 'Success', description: result.message });
            fetchWithdrawals();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Completed': return 'default';
            case 'Processing': return 'secondary';
            case 'Failed': return 'destructive';
            default: return 'outline';
        }
    }

    return (
        <div className="container mx-auto space-y-6">
            <PageHeader title="Manage Withdrawals" description="Process user withdrawal requests." />
            <Card>
                <CardHeader>
                    <CardTitle>All Withdrawal Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                         <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>User ID</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Details</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {withdrawals.map(w => (
                                        <TableRow key={w.id}>
                                            <TableCell>{format(new Date(w.requestedAt), 'PP')}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground truncate" style={{ maxWidth: '100px' }}>{w.userId}</TableCell>
                                            <TableCell className="font-medium">${w.amount.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{w.paymentMethod}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                {Object.entries(w.withdrawalDetails).map(([key, value]) => (
                                                    <WithdrawalDetail key={key} label={key} value={value} />
                                                ))}
                                                {w.walletAddress && <WithdrawalDetail label="Wallet Address (Old)" value={w.walletAddress} />}
                                                </div>
                                            </TableCell>
                                            <TableCell><Badge variant={getStatusVariant(w.status)}>{w.status}</Badge></TableCell>
                                            <TableCell className="text-right space-x-2">
                                                {w.status === 'Processing' && (
                                                    <>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button size="icon" variant="outline" className="h-8 w-8 text-green-600 hover:text-green-600">
                                                                <CheckCircle className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <ApproveWithdrawalDialog withdrawalId={w.id} onSuccess={fetchWithdrawals} />
                                                    </AlertDialog>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                             <Button size="icon" variant="destructive" className="h-8 w-8">
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>This will mark the withdrawal as failed. This action cannot be undone.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleReject(w.id)}>Confirm Reject</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                    </>
                                                )}
                                                {w.status === 'Completed' && w.txId && (
                                                     <WithdrawalDetail label="TXID" value={w.txId} />
                                                )}
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
