
"use client";

import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect, useMemo } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge"
import { Info, Loader2, Copy, Wallet, Repeat, Briefcase } from "lucide-react";
import type { Withdrawal, PaymentMethod, TradingAccount } from "@/types";
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
import { getUserBalance, getPaymentMethods } from "@/app/admin/actions";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
    amount: z.coerce.number().positive({ message: "Amount must be greater than 0." }),
    paymentMethodId: z.string({ required_error: "You must select a payment method." }),
    details: z.object({}).passthrough(),
});

type FormValues = z.infer<typeof formSchema>;

export default function WithdrawPage() {
    const { user } = useAuthContext();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    
    const [availableBalance, setAvailableBalance] = useState(0);
    const [recentWithdrawals, setRecentWithdrawals] = useState<Withdrawal[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [userAccounts, setUserAccounts] = useState<TradingAccount[]>([]);
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            amount: 0,
            paymentMethodId: '',
            details: {},
        }
    });

    useEffect(() => {
        if (selectedMethod) {
            let newSchema = z.object({
                amount: z.coerce.number().positive({ message: "Amount must be greater than 0." }),
                paymentMethodId: z.string(),
            });

            const detailsFields: Record<string, z.ZodTypeAny> = {};
            selectedMethod.fields.forEach(field => {
                let validator: z.ZodString | z.ZodTypeAny = z.string();
                if (field.validation.required) {
                    validator = validator.min(1, `${field.label} is required.`);
                }
                if (field.validation.minLength) {
                    validator = validator.min(field.validation.minLength, `${field.label} must be at least ${field.validation.minLength} characters.`);
                }
                if (field.validation.maxLength) {
                    validator = validator.max(field.validation.maxLength, `${field.label} must be at most ${field.validation.maxLength} characters.`);
                }
                if (field.validation.regex) {
                    try {
                        const regex = new RegExp(field.validation.regex);
                        validator = validator.regex(regex, field.validation.regexErrorMessage || `Invalid ${field.label} format.`);
                    } catch (e) {
                        console.error("Invalid regex:", e);
                    }
                }
                detailsFields[field.name] = validator;
            });
            
            if (selectedMethod.type === 'trading_account' && userAccounts.length > 0) {
                 detailsFields['tradingAccountId'] = z.string().min(1, 'Please select a trading account.');
            }

            const detailsSchema = z.object(detailsFields);
            const finalSchema = newSchema.extend({ details: detailsSchema });
            
            // @ts-ignore - a bit of a hack to update the schema dynamically
            form.resolver = zodResolver(finalSchema);
        }
    }, [selectedMethod, form.reset, userAccounts]);

    useEffect(() => {
        form.reset({
            amount: 0,
            paymentMethodId: selectedMethod?.id || '',
            details: {},
        });
        if (selectedMethod) {
            selectedMethod.fields.forEach(field => {
                form.setValue(`details.${field.name}`, '');
            });
            if (selectedMethod.type === 'trading_account') {
                form.setValue('details.tradingAccountId', '');
            }
        }
    }, [selectedMethod, form]);


    const fetchData = async () => {
        if (user) {
            setIsFetching(true);
            try {
                const [balanceData, methodsData, withdrawalsSnapshot, accountsSnapshot] = await Promise.all([
                    getUserBalance(user.uid),
                    getPaymentMethods(),
                    getDocs(query(collection(db, "withdrawals"), where("userId", "==", user.uid))),
                    getDocs(query(collection(db, "tradingAccounts"), where("userId", "==", user.uid), where("status", "==", "Approved")))
                ]);

                setAvailableBalance(balanceData.availableBalance);
                
                const enabledMethods = methodsData.filter(method => method.isEnabled);
                setPaymentMethods(enabledMethods);

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
    
    const categorizedMethods = useMemo(() => {
        return {
            crypto: paymentMethods.filter(p => p.type === 'crypto'),
            internal_transfer: paymentMethods.filter(p => p.type === 'internal_transfer'),
            trading_account: paymentMethods.filter(p => p.type === 'trading_account'),
        }
    }, [paymentMethods]);

    async function onSubmit(values: FormValues) {
        if (!user || !selectedMethod) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in and select a method.' });
            return;
        }
        if (values.amount > availableBalance) {
            form.setError("amount", { type: "manual", message: "Withdrawal amount cannot exceed available balance."});
            return;
        }

        setIsLoading(true);

        const submissionDetails = { ...values.details };
        if (selectedMethod.type === 'trading_account' && submissionDetails.tradingAccountId) {
            const account = userAccounts.find(a => a.id === submissionDetails.tradingAccountId);
            if (account) {
                 submissionDetails.accountNumber = account.accountNumber;
                 submissionDetails.broker = account.broker;
            }
        }

        try {
            await addDoc(collection(db, "withdrawals"), {
                userId: user.uid,
                amount: values.amount,
                status: 'Processing',
                requestedAt: serverTimestamp(),
                paymentMethod: selectedMethod.name,
                withdrawalDetails: submissionDetails,
            });
            toast({ title: 'Success!', description: 'Your withdrawal request has been submitted.' });
            form.reset();
            setSelectedMethod(null);
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
    
    const renderMethodGroup = (title: string, icon: React.ReactNode, methods: PaymentMethod[]) => {
        if (methods.length === 0) return null;
        return (
             <div className="space-y-3">
                <div className="flex items-center gap-2">
                    {icon}
                    <h3 className="font-semibold">{title}</h3>
                </div>
                <RadioGroup 
                    onValueChange={(value) => {
                        form.setValue('paymentMethodId', value);
                        setSelectedMethod(paymentMethods.find(p => p.id === value) || null);
                    }} 
                    value={form.watch('paymentMethodId')} 
                    className="flex flex-col space-y-2"
                >
                    {methods.map(method => (
                        <FormItem key={method.id} className="p-4 border rounded-md has-[[data-state=checked]]:border-primary">
                            <FormControl><RadioGroupItem value={method.id} id={method.id} className="sr-only"/></FormControl>
                            <FormLabel htmlFor={method.id} className="font-normal cursor-pointer w-full">
                                <p className="font-medium">{method.name}</p>
                                <p className="text-xs text-muted-foreground">{method.description}</p>
                            </FormLabel>
                        </FormItem>
                    ))}
                </RadioGroup>
            </div>
        )
    }

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
                            <CardTitle>Request Withdrawal</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="paymentMethodId"
                                render={({ field }) => (
                                    <FormItem className="space-y-6">
                                        <FormLabel className="text-base font-semibold">1. Select Payment Method</FormLabel>
                                         <FormControl>
                                            <div className="space-y-6">
                                                {renderMethodGroup("Crypto", <Wallet className="h-5 w-5 text-muted-foreground" />, categorizedMethods.crypto)}
                                                {renderMethodGroup("Internal Transfer", <Repeat className="h-5 w-5 text-muted-foreground" />, categorizedMethods.internal_transfer)}
                                                {renderMethodGroup("To Approved Trading Account", <Briefcase className="h-5 w-5 text-muted-foreground" />, categorizedMethods.trading_account)}
                                            </div>
                                         </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {selectedMethod && (
                                <div className="space-y-4 pt-4 border-t">
                                     <h3 className="text-base font-semibold">2. Enter Details</h3>
                                     <FormField
                                        control={form.control}
                                        name="amount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Amount (USD)</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input type="number" placeholder="0.00" {...field} />
                                                        <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-auto py-0.5 px-2" onClick={() => form.setValue('amount', availableBalance)}>Max</Button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {selectedMethod.type === 'trading_account' && (
                                         <FormField
                                            control={form.control}
                                            name="details.tradingAccountId"
                                            render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Select Account</FormLabel>
                                                <FormControl>
                                                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-2">
                                                        {userAccounts.map(acc => (
                                                            <FormItem key={acc.id} className="p-4 border rounded-md has-[[data-state=checked]]:border-primary">
                                                                <FormControl><RadioGroupItem value={acc.id} id={acc.id} className="sr-only"/></FormControl>
                                                                <FormLabel htmlFor={acc.id} className="font-normal cursor-pointer w-full">
                                                                    <p className="font-medium">{acc.broker}</p>
                                                                    <p className="text-xs text-muted-foreground">{acc.accountNumber}</p>
                                                                </FormLabel>
                                                            </FormItem>
                                                        ))}
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                            )}
                                        />
                                    )}

                                    {selectedMethod.fields.map((customField) => (
                                        <FormField
                                            key={customField.name}
                                            control={form.control}
                                            name={`details.${customField.name}`}
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
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Button type="submit" disabled={isLoading || !selectedMethod} className="w-full">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Request
                    </Button>
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
                        <li>Ensure the wallet address is correct.</li>
                        <li>Funds sent to a wrong address cannot be recovered.</li>
                    </ul>
                </AlertDescription>
            </Alert>
        </div>
    );
}
