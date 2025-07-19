
"use client";

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, XCircle, UserCheck, Edit, DollarSign } from 'lucide-react';
import { addCashbackTransaction } from '../actions';
import type { TradingAccount } from '@/types';
import { useAdminData } from '@/hooks/useAdminData';

const formSchema = z.object({
  tradeDetails: z.string().min(3, { message: "Please enter trade details." }),
  cashbackAmount: z.coerce.number().positive({ message: "Amount must be positive." }),
});

type EnrichedAccount = TradingAccount & { userName: string; userEmail: string };

export default function ManageCashbackPage() {
    const { users, accounts, isLoading: isDataLoading } = useAdminData();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAccount, setSelectedAccount] = useState<EnrichedAccount | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            tradeDetails: '',
            cashbackAmount: 0,
        }
    });

    const enrichedAccounts = useMemo(() => {
        if (isDataLoading) return [];
        return accounts
            .filter(acc => acc.status === 'Approved')
            .map(acc => {
                const user = users.find(u => u.uid === acc.userId);
                return {
                    ...acc,
                    userName: user?.name || 'Unknown User',
                    userEmail: user?.email || 'No email',
                };
            });
    }, [accounts, users, isDataLoading]);

    const searchResults = useMemo(() => {
        if (!searchQuery) return [];
        const lowerCaseQuery = searchQuery.toLowerCase();
        return enrichedAccounts.filter(acc => 
            acc.userName.toLowerCase().includes(lowerCaseQuery) ||
            acc.userEmail.toLowerCase().includes(lowerCaseQuery) ||
            acc.accountNumber.toLowerCase().includes(lowerCaseQuery)
        );
    }, [searchQuery, enrichedAccounts]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!selectedAccount) {
            toast({ variant: 'destructive', title: 'Error', description: 'No account selected.' });
            return;
        }
        setIsSubmitting(true);
        
        const result = await addCashbackTransaction({
            userId: selectedAccount.userId,
            accountId: selectedAccount.id,
            accountNumber: selectedAccount.accountNumber,
            broker: selectedAccount.broker,
            tradeDetails: values.tradeDetails,
            cashbackAmount: values.cashbackAmount,
        });

        if (result.success) {
            toast({ title: 'Success', description: result.message });
            form.reset();
            setSelectedAccount(null);
            setSearchQuery('');
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
        setIsSubmitting(false);
    }
    
    const handleSelectAccount = (account: EnrichedAccount) => {
        setSelectedAccount(account);
        setSearchQuery('');
    }

    const clearSelection = () => {
        setSelectedAccount(null);
        form.reset();
    }

    return (
        <div className="container mx-auto space-y-6">
            <PageHeader title="Manage Cashback" description="Manually add cashback transactions for users." />
            
            <Card>
                <CardHeader>
                    <CardTitle>1. Find Trading Account</CardTitle>
                    <CardDescription>Search by user name, email, or account number.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isDataLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : selectedAccount ? (
                        <div className="p-4 border rounded-md bg-muted/50 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="font-semibold">{selectedAccount.userName} ({selectedAccount.userEmail})</p>
                                <p className="text-sm text-muted-foreground">{selectedAccount.broker} - {selectedAccount.accountNumber}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={clearSelection}>
                                <XCircle className="h-5 w-5" />
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input 
                                    placeholder="Search..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            {searchQuery && (
                                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md">
                                    {searchResults.length > 0 ? searchResults.map(acc => (
                                        <button 
                                            key={acc.id} 
                                            className="w-full text-left p-3 hover:bg-muted"
                                            onClick={() => handleSelectAccount(acc)}
                                        >
                                            <p className="font-medium">{acc.userName} ({acc.accountNumber})</p>
                                            <p className="text-sm text-muted-foreground">{acc.userEmail}</p>
                                        </button>
                                    )) : (
                                        <p className="p-4 text-center text-sm text-muted-foreground">No matching accounts found.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className={!selectedAccount ? 'opacity-50 pointer-events-none' : ''}>
                <CardHeader>
                    <CardTitle>2. Add Transaction Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                             <FormField
                                control={form.control}
                                name="tradeDetails"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Trade Details</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Edit className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="e.g., 5.0 lots EUR/USD" {...field} className="pl-10" />
                                            </div>
                                        </FormControl>
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
                                        <FormControl>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input type="number" placeholder="e.g., 25.50" {...field} className="pl-10" />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <Button type="submit" disabled={isSubmitting || !selectedAccount}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Transaction
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
