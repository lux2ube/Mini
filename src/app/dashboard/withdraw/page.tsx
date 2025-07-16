
"use client";

import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
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
import { Info, Loader2, Copy } from "lucide-react";
import type { Withdrawal, PaymentMethod } from "@/types";
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


export default function WithdrawPage() {
    const { user } = useAuthContext();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    
    const [availableBalance, setAvailableBalance] = useState(0);
    const [recentWithdrawals, setRecentWithdrawals] = useState<Withdrawal[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

    // Dynamic schema based on selected payment method
    const [formSchema, setFormSchema] = useState(z.object({
        amount: z.coerce.number().positive({ message: "Amount must be greater than 0." }),
        paymentMethodId: z.string({ required_error: "You must select a payment method." }),
        details: z.object({}).passthrough(),
    }));

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });

    // Update schema when a method is selected
    useEffect(() => {
        if (selectedMethod) {
            const detailsSchema = selectedMethod.fields.reduce((schema, field) => {
                let validator: z.ZodTypeAny = z.string();

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
                        console.error("Invalid regex in payment method config:", field.validation.regex);
                    }
                }
                
                return schema.extend({ [field.name]: validator });
            }, z.object({}));

            setFormSchema(z.object({
                amount: z.coerce.number().positive({ message: "Amount must be greater than 0." }),
                paymentMethodId: z.string(),
                details: detailsSchema,
            }));
        }
    }, [selectedMethod]);
    
    useEffect(() => {
        form.reset();
    }, [formSchema, form]);


    const fetchData = async () => {
        if (user) {
            setIsFetching(true);
            try {
                const [balanceData, methodsData, withdrawalsSnapshot] = await Promise.all([
                    getUserBalance(user.uid),
                    getPaymentMethods(),
                    getDocs(query(collection(db, "withdrawals"), where("userId", "==", user.uid)))
                ]);

                setAvailableBalance(balanceData.availableBalance);
                
                // Filter for enabled methods
                const enabledMethods = methodsData.filter(method => method.isEnabled);
                setPaymentMethods(enabledMethods);

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

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!user || !selectedMethod) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in and select a method.' });
            return;
        }
        if (values.amount > availableBalance) {
            form.setError("amount", { type: "manual", message: "Withdrawal amount cannot exceed available balance."});
            return;
        }

        setIsLoading(true);
        try {
            await addDoc(collection(db, "withdrawals"), {
                userId: user.uid,
                amount: values.amount,
                status: 'Processing',
                requestedAt: serverTimestamp(),
                paymentMethod: selectedMethod.name,
                withdrawalDetails: values.details,
            });
            toast({ title: 'Success!', description: 'Your withdrawal request has been submitted.' });
            form.reset();
            setSelectedMethod(null);
            fetchData(); // Refetch data
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
                                    <FormItem className="space-y-3">
                                        <FormLabel>Select Payment Method</FormLabel>
                                        <FormControl>
                                            <RadioGroup 
                                                onValueChange={(value) => {
                                                    field.onChange(value);
                                                    setSelectedMethod(paymentMethods.find(p => p.id === value) || null);
                                                }} 
                                                value={field.value} 
                                                className="flex flex-col space-y-2"
                                            >
                                                {paymentMethods.map(method => (
                                                    <FormItem key={method.id} className="p-4 border rounded-md has-[[data-state=checked]]:border-primary">
                                                        <FormControl><RadioGroupItem value={method.id} id={method.id} className="sr-only"/></FormControl>
                                                        <FormLabel htmlFor={method.id} className="font-normal cursor-pointer w-full">
                                                            <p className="font-medium">{method.name}</p>
                                                            <p className="text-xs text-muted-foreground">{method.description}</p>
                                                        </FormLabel>
                                                    </FormItem>
                                                ))}
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {selectedMethod && (
                                <div className="space-y-4 pt-4 border-t">
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
