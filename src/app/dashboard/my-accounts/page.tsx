
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { AccountCard } from "@/components/user/AccountCard";
import type { TradingAccount, CashbackTransaction } from "@/types";
import { useAuthContext } from "@/hooks/useAuthContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { Loader2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
} from "@/components/ui/table";
import { format } from "date-fns";

export default function MyAccountsPage() {
    const { user } = useAuthContext();
    const router = useRouter();
    const [accounts, setAccounts] = useState<TradingAccount[]>([]);
    const [transactions, setTransactions] = useState<CashbackTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }
            
            setIsLoading(true);
            try {
                const accountsQuery = query(collection(db, "tradingAccounts"), where("userId", "==", user.uid));
                const accountsSnapshot = await getDocs(accountsQuery);
                const fetchedAccounts = accountsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return { id: doc.id, ...data, createdAt: (data.createdAt as Timestamp).toDate() } as TradingAccount;
                });
                fetchedAccounts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                setAccounts(fetchedAccounts);

                // Fetch all transactions for the user to pass to detail pages if needed,
                // or to show a summary here.
                const transactionsQuery = query(collection(db, "cashbackTransactions"), where("userId", "==", user.uid));
                const transactionsSnapshot = await getDocs(transactionsQuery);
                const userTransactions = transactionsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return { id: doc.id, ...data, date: (data.date as Timestamp).toDate() } as CashbackTransaction
                });
                userTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
                setTransactions(userTransactions);
                
            } catch (error) {
                console.error("Error fetching data: ", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user]);
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh_-_theme(spacing.12))]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const totalEarned = transactions.reduce((sum, tx) => sum + tx.cashbackAmount, 0);

    return (
        <div className="container mx-auto px-4 py-4 max-w-2xl space-y-4">
            <div className="flex justify-between items-center">
                <PageHeader
                    title="My Accounts"
                    description="Your linked forex trading accounts."
                />
                <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/brokers">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Link New Account
                    </Link>
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Accounts Overview</CardTitle>
                    <CardDescription>
                       You have {accounts.length} linked accounts. Total cashback earned: ${totalEarned.toFixed(2)}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {accounts.length > 0 ? (
                        accounts.map(account => (
                            <Link key={account.id} href={`/dashboard/my-accounts/${account.id}`} className="block">
                                <AccountCard account={account} />
                            </Link>
                        ))
                    ) : (
                         <div className="text-center py-10 border rounded-lg">
                            <p className="text-muted-foreground">You haven&apos;t linked any accounts yet.</p>
                            <Button asChild size="sm" className="mt-4">
                                <Link href="/dashboard/brokers">Link Your First Account</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Cashback History</CardTitle>
                    <CardDescription>
                        Showing the last 5 transactions from all accounts.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Account</TableHead>
                                    <TableHead className="text-right">Cashback</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.length > 0 ? (
                                    transactions.slice(0, 5).map(tx => (
                                        <TableRow key={tx.id}>
                                            <TableCell className="font-medium whitespace-nowrap">{format(tx.date, "PP")}</TableCell>
                                            <TableCell>{tx.accountNumber}</TableCell>
                                            <TableCell className="text-right font-semibold text-primary">${tx.cashbackAmount.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24">
                                            No transactions found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
