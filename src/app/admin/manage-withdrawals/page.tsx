
"use client";

import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { getWithdrawals, updateWithdrawalStatus } from '../actions';
import type { Withdrawal } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function ManageWithdrawalsPage() {
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
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
        fetchWithdrawals();
    }, [toast]);

    const handleStatusUpdate = async (withdrawalId: string, status: 'Completed' | 'Failed') => {
        const originalWithdrawals = [...withdrawals];
        // Optimistic update
        setWithdrawals(withdrawals.map(w => w.id === withdrawalId ? { ...w, status } : w));

        const result = await updateWithdrawalStatus(withdrawalId, status);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
            setWithdrawals(originalWithdrawals); // Revert on failure
        } else {
            toast({ title: 'Success', description: result.message });
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
                                        <TableHead>Network</TableHead>
                                        <TableHead>Address</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {withdrawals.map(w => (
                                        <TableRow key={w.id}>
                                            <TableCell>{format(new Date(w.requestedAt), 'PP')}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground truncate" style={{ maxWidth: '100px' }}>{w.userId}</TableCell>
                                            <TableCell className="font-medium">${w.amount.toFixed(2)}</TableCell>
                                            <TableCell><Badge variant="outline">{w.network.toUpperCase()}</Badge></TableCell>
                                            <TableCell className="text-xs text-muted-foreground truncate" style={{ maxWidth: '150px' }}>{w.walletAddress}</TableCell>
                                            <TableCell><Badge variant={getStatusVariant(w.status)}>{w.status}</Badge></TableCell>
                                            <TableCell className="space-x-2">
                                                {w.status === 'Processing' && (
                                                    <>
                                                    <Button size="icon" variant="outline" className="h-8 w-8 text-green-600 hover:text-green-600" onClick={() => handleStatusUpdate(w.id, 'Completed')}>
                                                        <CheckCircle className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="outline" className="h-8 w-8 text-red-600 hover:text-red-600" onClick={() => handleStatusUpdate(w.id, 'Failed')}>
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                    </>
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
