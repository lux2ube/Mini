
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { addCashbackTransaction, getUsers } from '../actions';
import type { UserProfile, TradingAccount } from '@/types';
import { useAdminData } from '@/hooks/useAdminData';

const formSchema = z.object({
  userId: z.string().min(1, { message: "Please select a user." }),
  accountId: z.string().min(1, { message: "Please select an account." }),
  tradeDetails: z.string().min(3, { message: "Please enter trade details." }),
  cashbackAmount: z.coerce.number().positive({ message: "Amount must be positive." }),
});

export default function ManageCashbackPage() {
    const { users, accounts, isLoading: isDataLoading } = useAdminData();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });

    const selectedUserId = form.watch('userId');
    const [filteredAccounts, setFilteredAccounts] = useState<TradingAccount[]>([]);

    useEffect(() => {
        if (selectedUserId) {
            setFilteredAccounts(accounts.filter(acc => acc.userId === selectedUserId && acc.status === 'Approved'));
            form.resetField('accountId');
        } else {
            setFilteredAccounts([]);
        }
    }, [selectedUserId, accounts, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        const selectedAccount = accounts.find(acc => acc.id === values.accountId);
        if (!selectedAccount) {
            toast({ variant: 'destructive', title: 'Error', description: 'Selected account not found.' });
            setIsSubmitting(false);
            return;
        }

        const result = await addCashbackTransaction({
            userId: values.userId,
            accountId: values.accountId,
            accountNumber: selectedAccount.accountNumber,
            broker: selectedAccount.broker,
            tradeDetails: values.tradeDetails,
            cashbackAmount: values.cashbackAmount,
        });

        if (result.success) {
            toast({ title: 'Success', description: result.message });
            form.reset({ userId: '', accountId: '', tradeDetails: '', cashbackAmount: 0 });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
        setIsSubmitting(false);
    }

    return (
        <div className="container mx-auto space-y-6">
            <PageHeader title="Manage Cashback" description="Manually add cashback transactions for users." />
            <Card>
                <CardHeader>
                    <CardTitle>Add New Transaction</CardTitle>
                </CardHeader>
                <CardContent>
                    {isDataLoading ? (
                         <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="userId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>User</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Select a user" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {users.map(user => (
                                                    <SelectItem key={user.uid} value={user.uid}>{user.name} ({user.email})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                             <FormField
                                control={form.control}
                                name="accountId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>User's Trading Account</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedUserId}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Select an account" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {filteredAccounts.map(account => (
                                                    <SelectItem key={account.id} value={account.id}>{account.broker} - {account.accountNumber}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="tradeDetails"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Trade Details</FormLabel>
                                        <FormControl><Input placeholder="e.g., 5.0 lots EUR/USD" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="cashbackAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cashback Amount ($)</FormLabel>
                                        <FormControl><Input type="number" placeholder="e.g., 25.50" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Transaction
                            </Button>
                        </form>
                    </Form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
