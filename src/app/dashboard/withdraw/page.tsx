
"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge"
import { Info, Loader2, Copy, Wallet, Repeat, Briefcase, Banknote, PlusCircle } from "lucide-react";
import type { Withdrawal, UserPaymentMethod, TradingAccount } from "@/types";
import { useAuthContext } from "@/hooks/useAuthContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, addDoc, serverTimestamp, Timestamp, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getUserBalance } from "@/app/admin/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const withdrawalSchema = z.object({
    amount: z.coerce.number().positive({ message: "Amount must be greater than 0." }),
    userPaymentMethodId: z.string().min(1, "Please select a payment method."),
    tradingAccountId: z.string().optional(), // Keep for trading account transfers
});

type FormValues = z.infer<typeof withdrawalSchema>;
type Category = 'crypto' | 'internal_transfer' | 'trading_account';

export default function WithdrawPage() {
    const { user, refetchUserData } = useAuthContext();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    
    const [availableBalance, setAvailableBalance] = useState(0);
    const [recentWithdrawals, setRecentWithdrawals] = useState<Withdrawal[]>([]);
    const [userAccounts, setUserAccounts] = useState<TradingAccount[]>([]);
    
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(withdrawalSchema),
        defaultValues: {
            amount: 0,
            userPaymentMethodId: '',
            tradingAccountId: '',
        }
    });

    const resetFormState = () => {
        form.reset({
            amount: 0,
            userPaymentMethodId: '',
            tradingAccountId: '',
        });
    };

    const handleCategoryChange = (category: Category | null) => {
        setSelectedCategory(category);
        resetFormState();
    }

    const fetchData = async () => {
        if (user) {
            setIsFetching(true);
            try {
                const [balanceData, withdrawalsSnapshot, accountsSnapshot] = await Promise.all([
                    getUserBalance(user.uid),
                    getDocs(query(collection(db, "withdrawals"), where("userId", "==", user.uid))),
                    getDocs(query(collection(db, "tradingAccounts"), where("userId", "==", user.uid), where("status", "==", "Approved")))
                ]);

                setAvailableBalance(balanceData.availableBalance);
                setUserAccounts(accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TradingAccount)));

                const withdrawals: Withdrawal[] = withdrawalsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return { 
                        id: doc.id,
                        ...data,
                        requestedAt: (data.requestedAt as Timestamp).toDate(),
                        completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : undefined,
                    } as Withdrawal;
                });
                
                withdrawals.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
                setRecentWithdrawals(withdrawals);

            } catch (error) {
                console.error("Error fetching withdrawal data:", error);
                toast({ variant: 'destructive', title: "Error", description: "Failed to load page data."});
            } finally {
                setIsFetching(false);
            }
        }
    };

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);
    
    const userPaymentMethods = useMemo(() => user?.paymentMethods || [], [user]);

    const availableMethodsForCategory = useMemo(() => {
        if (!selectedCategory) return [];
        return userPaymentMethods.filter(pm => pm.methodType === selectedCategory);
    }, [selectedCategory, userPaymentMethods]);


    async function onSubmit(values: FormValues) {
        if (!user || !selectedCategory) return;
        if (values.amount > availableBalance) {
            form.setError("amount", { type: "manual", message: "Withdrawal amount cannot exceed available balance."});
            return;
        }

        setIsLoading(true);

        let payload: Omit<Withdrawal, 'id' | 'requestedAt'> = {
            userId: user.uid,
            amount: values.amount,
            status: 'Processing',
            paymentMethod: '',
            withdrawalDetails: {},
        };
        
        let selectedSavedMethod: UserPaymentMethod | undefined;

        if (selectedCategory === 'trading_account') {
            const account = userAccounts.find(a => a.id === values.tradingAccountId);
            if (!account) {
                 toast({ variant: 'destructive', title: 'Error', description: 'Invalid trading account selected.' });
                 setIsLoading(false);
                 return;
            }
            payload.paymentMethod = `Trading Account Transfer`;
            payload.withdrawalDetails = {
                Broker: account.broker,
                "Account Number": account.accountNumber,
            };
        } else {
             selectedSavedMethod = userPaymentMethods.find(pm => pm.id === values.userPaymentMethodId);
             if (!selectedSavedMethod) {
                toast({ variant: 'destructive', title: 'Error', description: 'Invalid payment method selected.' });
                setIsLoading(false);
                return;
             }
             payload.paymentMethod = selectedSavedMethod.methodName;
             payload.withdrawalDetails = selectedSavedMethod.details;
        }

        try {
            await addDoc(collection(db, "withdrawals"), {
                ...payload,
                requestedAt: serverTimestamp(),
            });
            toast({ title: 'Success!', description: 'Your withdrawal request has been submitted.' });
            handleCategoryChange(null);
            fetchData();
        } catch (error) {
            console.error('Error submitting withdrawal: ', error);
            toast({ variant: 'destructive', title: 'Error', description: 'There was a problem submitting your request.' });
        } finally {
            setIsLoading(false);
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied!', description: 'TXID copied to clipboard.' });
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Completed': return 'default';
            case 'Processing': return 'secondary';
            case 'Failed': return 'destructive';
            default: return 'outline';
        }
    }

    if (isFetching) {
        return (
            <div className="flex justify-center items-center h-full min-h-[calc(100vh-theme(spacing.14))]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const renderCategorySelector = () => (
        <Select onValueChange={(value: Category) => handleCategoryChange(value)}>
            <SelectTrigger>
                <SelectValue placeholder="Select a withdrawal category" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="crypto">
                    <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" /> Withdraw using Crypto
                    </div>
                </SelectItem>
                 <SelectItem value="internal_transfer">
                    <div className="flex items-center gap-2">
                        <Repeat className="h-4 w-4" /> Internal Transfer
                    </div>
                </SelectItem>
                 <SelectItem value="trading_account">
                    <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" /> Transfer to Trading Account
                    </div>
                </SelectItem>
            </SelectContent>
        </Select>
    );
    
    const renderSavedMethodSelector = () => (
        <FormField
            control={form.control}
            name="userPaymentMethodId"
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-base font-semibold">2. Select Saved Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a saved payment method" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {availableMethodsForCategory.map(method => (
                                <SelectItem key={method.id} value={method.id}>
                                    <div className="flex flex-col">
                                        <span>{method.methodName}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {Object.entries(method.details)
                                                .map(([key, value]) => `${value}`)
                                                .join(', ')}
                                        </span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
    
    const renderTradingAccountSelector = () => (
         <FormField
            control={form.control}
            name="tradingAccountId"
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-base font-semibold">2. Select Account</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a trading account" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                             {userAccounts.map(account => (
                                <SelectItem key={account.id} value={account.id}>
                                    {account.broker} - {account.accountNumber}
                                </SelectItem>
                             ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
        />
    );

    const renderDetailsForm = () => (
        <div className="space-y-4">
             <h3 className="text-base font-semibold pt-4 border-t">3. Enter Amount</h3>
             <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Amount (USD)</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                <Input type="number" placeholder="0.00" {...field} className="pl-10" />
                                <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-auto py-0.5 px-2" onClick={() => form.setValue('amount', availableBalance)}>Max</Button>
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
    
    const renderNoMethodsMessage = () => (
        <div className="text-center p-4 border rounded-md bg-muted/50 space-y-3">
            <p className="text-sm text-muted-foreground">
                You have no saved payment methods for this category.
            </p>
            <Button asChild size="sm">
                <Link href="/dashboard/settings">
                    <PlusCircle className="mr-2 h-4 w-4" /> Go to Settings to Add One
                </Link>
            </Button>
        </div>
    );

    return (
        <div className="max-w-[400px] mx-auto w-full px-4 py-4 space-y-4">
            <PageHeader
                title="Withdraw Funds"
                description="Request a withdrawal of your cashback."
            />

            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl">${availableBalance.toFixed(2)}</CardTitle>
                    <CardDescription>Available to Withdraw</CardDescription>
                </CardHeader>
            </Card>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Select Category</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {renderCategorySelector()}
                        </CardContent>
                    </Card>

                    {selectedCategory && (
                         <Card>
                            <CardContent className="pt-6 space-y-4">
                                {selectedCategory === 'trading_account' ? (
                                     userAccounts.length > 0 ? renderTradingAccountSelector() : <p className="text-sm text-muted-foreground text-center">You have no approved trading accounts to transfer to.</p>
                                ) : (
                                    availableMethodsForCategory.length > 0 ? renderSavedMethodSelector() : renderNoMethodsMessage()
                                )}

                                {((selectedCategory === 'trading_account' && form.watch('tradingAccountId')) || (selectedCategory !== 'trading_account' && form.watch('userPaymentMethodId'))) && (
                                    renderDetailsForm()
                                )}
                            </CardContent>
                        </Card>
                    )}
                    
                    <Button type="submit" disabled={isLoading || !selectedCategory} className="w-full">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Request
                    </Button>
                     {selectedCategory && (
                        <Button type="button" variant="ghost" onClick={() => handleCategoryChange(null)} className="w-full">
                            Back to Categories
                        </Button>
                    )}
                </form>
            </Form>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Withdrawals</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                   <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status / TXID</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {recentWithdrawals.length > 0 ? (
                                recentWithdrawals.map((w) => (
                                <TableRow key={w.id}>
                                    <TableCell className="text-muted-foreground">{format(new Date(w.requestedAt), "PP")}</TableCell>
                                    <TableCell className="font-medium">${w.amount.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col items-start gap-1">
                                            <Badge variant={getStatusVariant(w.status)}>{w.status}</Badge>
                                            {w.txId && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button 
                                                                onClick={() => copyToClipboard(w.txId!)}
                                                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                                            >
                                                                <span className="truncate max-w-[100px]">{w.txId}</span>
                                                                <Copy className="h-3 w-3" />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Copy TXID</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                                ))
                             ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24">No withdrawal history.</TableCell>
                                </TableRow>
                             )}
                        </TableBody>
                    </Table>
                    </div>
                </CardContent>
            </Card>

            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Withdrawals are processed within 24 hours.</li>
                        <li>Ensure the information provided is correct.</li>
                        <li>Funds sent to a wrong destination cannot be recovered.</li>
                    </ul>
                </AlertDescription>
            </Alert>
        </div>
    );
}
