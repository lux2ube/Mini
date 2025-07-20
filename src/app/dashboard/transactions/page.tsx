
"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuthContext } from "@/hooks/useAuthContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import type { CashbackTransaction } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

export default function TransactionsPage() {
    const { user } = useAuthContext();
    const [transactions, setTransactions] = useState<CashbackTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }
            
            setIsLoading(true);
            try {
                const transactionsQuery = query(collection(db, "cashbackTransactions"), where("userId", "==", user.uid));
                const transactionsSnapshot = await getDocs(transactionsQuery);
                const userTransactions = transactionsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return { id: doc.id, ...data, date: (data.date as Timestamp).toDate() } as CashbackTransaction;
                });
                userTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
                setTransactions(userTransactions);
                
            } catch (error) {
                console.error("Error fetching transactions: ", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchTransactions();
        }
    }, [user]);

    const filteredTransactions = useMemo(() => {
        if (!filter) return transactions;
        const lowerCaseFilter = filter.toLowerCase();
        return transactions.filter(tx => 
            tx.broker.toLowerCase().includes(lowerCaseFilter) ||
            tx.accountNumber.toLowerCase().includes(lowerCaseFilter) ||
            tx.tradeDetails.toLowerCase().includes(lowerCaseFilter)
        );
    }, [transactions, filter]);

    const totalEarned = useMemo(() => {
        return transactions.reduce((sum, tx) => sum + tx.cashbackAmount, 0);
    }, [transactions]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh_-_theme(spacing.12))]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-4 max-w-4xl space-y-6">
            <PageHeader
                title="Transactions"
                description="A complete history of all cashback you've earned."
            />
            
            <Card>
                <CardHeader>
                    <CardTitle>Total Earned</CardTitle>
                    <CardDescription className="text-3xl font-bold text-primary">${totalEarned.toFixed(2)}</CardDescription>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <CardTitle>Transaction History</CardTitle>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Filter by broker, account, details..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="w-full sm:w-auto pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Account</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map(tx => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="text-muted-foreground text-xs md:text-sm">
                                          {format(tx.date, "PP")}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{tx.broker}</div>
                                            <div className="text-xs text-muted-foreground">{tx.accountNumber}</div>
                                        </TableCell>
                                        <TableCell>
                                            <p className="max-w-[250px] truncate md:max-w-none md:whitespace-normal">
                                                {tx.tradeDetails}
                                            </p>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-primary">${tx.cashbackAmount.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        No transactions found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
