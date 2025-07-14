
"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
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
import { Info, Loader2 } from "lucide-react";
import type { Withdrawal } from "@/types";

const formSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be greater than 0." }),
  network: z.enum(["bep20", "trc20"], { required_error: "You must select a network." }),
  address: z.string().min(26, { message: "Wallet address seems too short." }),
});

const recentWithdrawals: Withdrawal[] = [
    { id: "W001", amount: 150.75, status: "Completed", date: new Date(), network: "bep20", address: "0x...aBcD" },
    { id: "W002", amount: 80.00, status: "Processing", date: new Date(), network: "trc20", address: "T...xYz1" },
    { id: "W003", amount: 200.50, status: "Failed", date: new Date(), network: "bep20", address: "0x...eFgH" },
];

export default function WithdrawPage() {
    const [isLoading, setIsLoading] = useState(false);
    const availableBalance = 254.30; // Placeholder balance

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            amount: '' as any,
            network: undefined,
            address: "",
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values);
        setIsLoading(true);
        setTimeout(() => { setIsLoading(false); }, 2000);
    }

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Completed': return 'default';
            case 'Processing': return 'secondary';
            case 'Failed': return 'destructive';
            default: return 'outline';
        }
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
                            <CardDescription>Only USDT withdrawals are supported.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                            <FormField
                                control={form.control}
                                name="network"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>Select Network</FormLabel>
                                        <FormControl>
                                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-2">
                                                <FormItem className="p-4 border rounded-md has-[[data-state=checked]]:border-primary">
                                                    <FormControl><RadioGroupItem value="bep20" id="bep20" className="sr-only"/></FormControl>
                                                    <FormLabel htmlFor="bep20" className="font-normal cursor-pointer w-full">
                                                        <p className="font-medium">BEP20</p>
                                                        <p className="text-xs text-muted-foreground">Binance Smart Chain</p>
                                                    </FormLabel>
                                                </FormItem>
                                                <FormItem className="p-4 border rounded-md has-[[data-state=checked]]:border-primary">
                                                    <FormControl><RadioGroupItem value="trc20" id="trc20" className="sr-only"/></FormControl>
                                                    <FormLabel htmlFor="trc20" className="font-normal cursor-pointer w-full">
                                                        <p className="font-medium">TRC20</p>
                                                        <p className="text-xs text-muted-foreground">TRON Network</p>
                                                    </FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>USDT Wallet Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter your wallet address" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                    <Button type="submit" disabled={isLoading} className="w-full">
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
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentWithdrawals.map((w) => (
                            <TableRow key={w.id}>
                                <TableCell className="font-medium">${w.amount.toFixed(2)}</TableCell>
                                <TableCell><Badge variant={getStatusVariant(w.status)}>{w.status}</Badge></TableCell>
                                <TableCell className="text-right">{w.date.toLocaleDateString()}</TableCell>
                            </TableRow>
                            ))}
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

    