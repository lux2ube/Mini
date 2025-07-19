
"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Info, Loader2, Copy, Banknote, XCircle, Wallet, Briefcase } from "lucide-react";
import type { Withdrawal, PaymentMethod, TradingAccount } from "@/types";
import { useAuthContext } from "@/hooks/useAuthContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getUserBalance, getPaymentMethods, logUserActivity } from "@/app/admin/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const withdrawalSchema = z.object({
    amount: z.coerce.number().positive({ message: "Amount must be greater than 0." }),
    withdrawalType: z.enum(['payment_method', 'trading_account']),
    paymentMethodId: z.string().optional(),
    tradingAccountId: z.string().optional(),
    details: z.record(z.any()),
}).refine(data => {
    if (data.withdrawalType === 'payment_method') return !!data.paymentMethodId;
    if (data.withdrawalType === 'trading_account') return !!data.tradingAccountId;
    return false;
}, {
    message: "Please select a destination.",
    path: ["paymentMethodId"], // You can choose which field to show the error on
});

type FormValues = z.infer<typeof withdrawalSchema>;

export default function WithdrawPage() {
    const { user } = useAuthContext();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    
    const [availableBalance, setAvailableBalance] = useState(0);
    const [recentWithdrawals, setRecentWithdrawals] = useState<Withdrawal[]>([]);
    const [adminPaymentMethods, setAdminPaymentMethods] = useState<PaymentMethod[]>([]);
    const [userTradingAccounts, setUserTradingAccounts] = useState<TradingAccount[]>([]);
    
    const form = useForm<FormValues>({
        resolver: zodResolver(withdrawalSchema),
        mode: "onSubmit",
        reValidateMode: "onChange",
        defaultValues: {
            amount: 0,
            withdrawalType: 'payment_method',
            details: {},
        }
    });
    
    const cryptoPaymentMethods = useMemo(() => adminPaymentMethods.filter(m => m.type === 'crypto' && m.isEnabled), [adminPaymentMethods]);

    const fetchData = useCallback(async () => {
        if (user) {
            setIsFetching(true);
            try {
                const [balanceData, withdrawalsSnapshot, adminMethodsData, accountsSnapshot] = await Promise.all([
                    getUserBalance(user.uid),
                    getDocs(query(collection(db, "withdrawals"), where("userId", "==", user.uid))),
                    getPaymentMethods(),
                    getDocs(query(collection(db, "tradingAccounts"), where("userId", "==", user.uid), where("status", "==", "Approved"))),
                ]);

                setAvailableBalance(balanceData.availableBalance);
                setAdminPaymentMethods(adminMethodsData);

                const withdrawals: Withdrawal[] = withdrawalsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return { 
                        id: doc.id,
                        ...data,
                        requestedAt: (data.requestedAt as Timestamp).toDate(),
                        completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : undefined,
                    } as Withdrawal;
                });

                 const tradingAccounts = accountsSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as TradingAccount);
                 setUserTradingAccounts(tradingAccounts);
                
                withdrawals.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
                setRecentWithdrawals(withdrawals);

            } catch (error) {
                console.error("Error fetching withdrawal data:", error);
                toast({ variant: 'destructive', title: "Error", description: "Failed to load page data."});
            } finally {
                setIsFetching(false);
            }
        }
    }, [user, toast]);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, fetchData]);

    const withdrawalType = form.watch("withdrawalType");
    const selectedMethodId = form.watch("paymentMethodId");
    const selectedMethod = useMemo(() => adminPaymentMethods.find(m => m.id === selectedMethodId), [adminPaymentMethods, selectedMethodId]);
    
    useEffect(() => {
        form.setValue('details', {});
        form.setValue('paymentMethodId', undefined);
        form.setValue('tradingAccountId', undefined);

        if (withdrawalType === 'payment_method' && selectedMethod) {
            const defaultDetails = selectedMethod.fields.reduce((acc, field) => {
                acc[field.name] = '';
                return acc;
            }, {} as Record<string, string>);
            form.setValue('details', defaultDetails);
        }
        form.trigger();
    }, [withdrawalType, selectedMethod, form]);


    async function onSubmit(values: FormValues) {
        if (!user) return;
        if (values.amount > availableBalance) {
            form.setError("amount", { type: "manual", message: "Withdrawal amount cannot exceed available balance."});
            return;
        }

        let payload: Omit<Withdrawal, 'id' | 'requestedAt'>;
        let finalDetails: Record<string, any> = {};
        let paymentMethodName = '';

        if (values.withdrawalType === 'trading_account') {
            const account = userTradingAccounts.find(a => a.id === values.tradingAccountId);
            if (!account) {
                toast({ variant: 'destructive', title: 'Error', description: 'Selected trading account is invalid.' });
                return;
            }
            paymentMethodName = "Internal Transfer";
            finalDetails = { broker: account.broker, accountNumber: account.accountNumber };
        } else {
             if (!selectedMethod) {
                toast({ variant: 'destructive', title: 'Error', description: 'Selected payment method is invalid.' });
                return;
            }
             paymentMethodName = selectedMethod.name;
             finalDetails = values.details;

            const detailsSchema = z.object(
                selectedMethod.fields.reduce((acc, field) => {
                    let fieldValidation: z.ZodString | z.ZodAny = z.string();
                    if (field.validation.required) {
                        fieldValidation = fieldValidation.min(1, `${field.label} is required.`);
                    }
                    if (field.validation.minLength) {
                        fieldValidation = fieldValidation.min(field.validation.minLength, `${field.label} must be at least ${field.validation.minLength} characters.`);
                    }
                    if (field.validation.regex) {
                        try {
                            const regex = new RegExp(field.validation.regex);
                            fieldValidation = fieldValidation.regex(regex, field.validation.regexErrorMessage || `Invalid ${field.label}`);
                        } catch (e) {
                            console.error("Invalid regex in payment method config:", e);
                        }
                    }
                    acc[field.name] = fieldValidation;
                    return acc;
                }, {} as Record<string, z.ZodString | z.ZodAny>)
            );

            const validationResult = detailsSchema.safeParse(values.details);
            if(!validationResult.success) {
                validationResult.error.errors.forEach(err => {
                    form.setError(`details.${err.path[0]}`, { type: 'manual', message: err.message });
                });
                return;
            }
        }


        setIsLoading(true);
        
        payload = {
            userId: user.uid,
            amount: values.amount,
            status: 'Processing',
            paymentMethod: paymentMethodName,
            withdrawalDetails: finalDetails,
        };

        try {
            await addDoc(collection(db, "withdrawals"), {
                ...payload,
                requestedAt: serverTimestamp(),
            });
            await logUserActivity(user.uid, 'withdrawal_request', { amount: values.amount, method: paymentMethodName });
            toast({ title: 'Success!', description: 'Your withdrawal request has been submitted.' });
            form.reset();
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
    
    return (
        <div className="max-w-[400px] mx-auto w-full px-4 py-4 space-y-4">
            <PageHeader
                title="Withdraw Funds"
                description="Request a withdrawal of your cashback."
            />

            <Card>
                <CardHeader className="p-4">
                    <CardTitle className="text-2xl">${availableBalance.toFixed(2)}</CardTitle>
                    <CardDescription className="text-xs">Available to Withdraw</CardDescription>
                </CardHeader>
            </Card>
            
            <Card>
                <CardHeader className="p-4">
                    <CardTitle className="text-base">New Withdrawal</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="withdrawalType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Withdrawal Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="payment_method">Crypto</SelectItem>
                                                <SelectItem value="trading_account">Trading Account</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {withdrawalType === 'payment_method' && (
                                <FormField
                                    control={form.control}
                                    name="paymentMethodId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Withdrawal Method</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select a method" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {cryptoPaymentMethods.map(method => (
                                                        <SelectItem key={method.id} value={method.id}>
                                                            {method.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            
                            {withdrawalType === 'trading_account' && (
                                 <FormField
                                    control={form.control}
                                    name="tradingAccountId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Trading Account</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select an account" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {userTradingAccounts.map(acc => (
                                                        <SelectItem key={acc.id} value={acc.id}>
                                                            {acc.broker} - {acc.accountNumber}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}


                            {withdrawalType === 'payment_method' && selectedMethod && selectedMethod.fields.map(customField => {
                                 const fieldName = `details.${customField.name}` as const;
                                 return (
                                     <FormField
                                         key={customField.name}
                                         control={form.control}
                                         name={fieldName}
                                         render={({ field }) => (
                                             <FormItem>
                                                 <FormLabel>{customField.label}</FormLabel>
                                                 <FormControl>
                                                    <div className="relative">
                                                        <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <Input 
                                                            type={customField.type} 
                                                            placeholder={customField.placeholder} 
                                                            {...field}
                                                            className="pl-10"
                                                        />
                                                    </div>
                                                 </FormControl>
                                                 <FormMessage />
                                             </FormItem>
                                         )}
                                     />
                                 )
                            })}
                            
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
                            <Button type="submit" disabled={isLoading} className="w-full">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Request
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
            

            <Card>
                <CardHeader className="p-4">
                    <CardTitle className="text-base">Recent Withdrawals</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                   <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-xs">Date</TableHead>
                                <TableHead className="text-xs">Amount</TableHead>
                                <TableHead className="text-xs">Status / TXID</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {recentWithdrawals.length > 0 ? (
                                recentWithdrawals.map((w) => (
                                <TableRow key={w.id}>
                                    <TableCell className="text-muted-foreground text-xs">{format(new Date(w.requestedAt), "PP")}</TableCell>
                                    <TableCell className="font-medium text-xs">${w.amount.toFixed(2)}</TableCell>
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
                                             {w.status === 'Failed' && w.rejectionReason && (
                                                <div className="flex items-start gap-1.5 text-xs text-destructive pt-1">
                                                    <XCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                                    <p>{w.rejectionReason}</p>
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                                ))
                             ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24 text-xs">No withdrawal history.</TableCell>
                                </TableRow>
                             )}
                        </TableBody>
                    </Table>
                    </div>
                </CardContent>
            </Card>

            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle className="text-sm">Important</AlertTitle>
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
