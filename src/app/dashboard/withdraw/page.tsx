

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
import { Info, Loader2, Copy, Banknote } from "lucide-react";
import type { Withdrawal, PaymentMethod } from "@/types";
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
    paymentMethodId: z.string().min(1, "Please select a payment method."),
    details: z.record(z.any()), // Will be validated dynamically
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
    
    const form = useForm<FormValues>({
        resolver: zodResolver(withdrawalSchema),
        defaultValues: {
            amount: 0,
            paymentMethodId: '',
            details: {},
        }
    });

    const fetchData = async () => {
        if (user) {
            setIsFetching(true);
            try {
                const [balanceData, withdrawalsSnapshot, adminMethodsData] = await Promise.all([
                    getUserBalance(user.uid),
                    getDocs(query(collection(db, "withdrawals"), where("userId", "==", user.uid))),
                    getPaymentMethods(),
                ]);

                setAvailableBalance(balanceData.availableBalance);
                setAdminPaymentMethods(adminMethodsData.filter(m => m.isEnabled));

                const withdrawals: Withdrawal[] = withdrawalsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return { 
                        id: doc.id,
                        ...data,
                        requestedAt: (data.requestedAt as Timestamp).toDate(),
                        completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : undefined,
                    } as Withdrawal;
                });
                
                withdrawals.sort((a, b) => b.requestedAt.getTime() - a.createdAt.getTime());
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

    const selectedMethodId = form.watch("paymentMethodId");
    const selectedMethod = useMemo(() => adminPaymentMethods.find(m => m.id === selectedMethodId), [adminPaymentMethods, selectedMethodId]);
    
    // Dynamically update validation schema when selected method changes
    useEffect(() => {
        if (selectedMethod) {
            const newSchema = withdrawalSchema.extend({
                details: z.object(
                    selectedMethod.fields.reduce((acc, field) => {
                        let fieldValidation: z.ZodType<any> = z.string();
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
                    }, {} as Record<string, z.ZodType<any>>)
                ),
            });
            form.trigger('details'); // Re-validate details
        }
    }, [selectedMethod, form]);


    async function onSubmit(values: FormValues) {
        if (!user || !selectedMethod) return;
        if (values.amount > availableBalance) {
            form.setError("amount", { type: "manual", message: "Withdrawal amount cannot exceed available balance."});
            return;
        }

        setIsLoading(true);
        
        let payload: Omit<Withdrawal, 'id' | 'requestedAt'> = {
            userId: user.uid,
            amount: values.amount,
            status: 'Processing',
            paymentMethod: selectedMethod.name,
            withdrawalDetails: values.details,
        };

        try {
            await addDoc(collection(db, "withdrawals"), {
                ...payload,
                requestedAt: serverTimestamp(),
            });
            await logUserActivity(user.uid, 'withdrawal_request', { amount: values.amount, method: selectedMethod.name });
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
                                name="paymentMethodId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Withdrawal Method</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select a method" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {adminPaymentMethods.map(method => (
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

                            {selectedMethod && selectedMethod.fields.map(customField => {
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
                                                    <Input 
                                                        type={customField.type} 
                                                        placeholder={customField.placeholder} 
                                                        {...field}
                                                    />
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
                            <Button type="submit" disabled={isLoading || !selectedMethodId} className="w-full">
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
