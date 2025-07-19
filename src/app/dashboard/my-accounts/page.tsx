
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { AccountCard } from "@/components/user/AccountCard";
import type { TradingAccount, CashbackTransaction } from "@/types";
import { useAuthContext } from "@/hooks/useAuthContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { Loader2, PlusCircle, CalendarIcon, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function MyAccountsPage() {
    const { user } = useAuthContext();
    const router = useRouter();
    const [accounts, setAccounts] = useState<TradingAccount[]>([]);
    const [transactions, setTransactions] = useState<CashbackTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAccountId, setSelectedAccountId] = useState<string | 'all'>('all');

    useEffect(() => {
        const fetchData = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }
            
            try {
                const accountsQuery = query(collection(db, "tradingAccounts"), where("userId", "==", user.uid));
                const accountsSnapshot = await getDocs(accountsQuery);
                const fetchedAccounts = accountsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return { id: doc.id, ...data, createdAt: (data.createdAt as Timestamp).toDate() } as TradingAccount;
                });
                fetchedAccounts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                setAccounts(fetchedAccounts);

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

    const filteredTransactions = useMemo(() => {
        if (selectedAccountId === 'all') {
            return transactions;
        }
        return transactions.filter(tx => tx.accountId === selectedAccountId);
    }, [transactions, selectedAccountId]);

    const selectedAccount = useMemo(() => {
        if (selectedAccountId === 'all') return null;
        return accounts.find(acc => acc.id === selectedAccountId);
    }, [accounts, selectedAccountId]);
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh_-_theme(spacing.12))]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-[400px] mx-auto w-full px-4 py-4 space-y-4">
            <div className="flex justify-between items-center">
                <PageHeader
                    title="My Accounts"
                    description="Your linked forex trading accounts."
                />
                <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/brokers">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Link New
                    </Link>
                </Button>
            </div>
            
            <Carousel opts={{ align: "start", slidesToScroll: "auto" }} className="w-full">
                <CarouselContent className="-ml-2">
                    <CarouselItem className="pl-2 basis-auto">
                        <div onClick={() => setSelectedAccountId('all')} className="cursor-pointer">
                            <Card className={cn("w-40 h-28 flex flex-col justify-center items-center text-center", selectedAccountId === 'all' && "border-primary ring-2 ring-primary")}>
                                <CardHeader className="p-2">
                                    <CardTitle className="text-base">All Accounts</CardTitle>
                                </CardHeader>
                                <CardContent className="p-2">
                                     <p className="text-xs text-muted-foreground">{accounts.length} linked</p>
                                </CardContent>
                            </Card>
                        </div>
                    </CarouselItem>
                    {accounts.map((account) => (
                        <CarouselItem key={account.id} className="pl-2 basis-auto">
                             <div onClick={() => setSelectedAccountId(account.id)} className="cursor-pointer">
                                <AccountCard 
                                    account={account} 
                                    isSelected={selectedAccountId === account.id}
                                />
                             </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
            
            <Card>
                <CardHeader className="p-4">
                    <CardTitle className="text-base">Cashback History</CardTitle>
                    <CardDescription className="text-xs">
                        {selectedAccount ? `Showing transactions for ${selectedAccount.accountNumber}` : 'Showing transactions for all accounts'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs">Date</TableHead>
                                    <TableHead className="text-xs">Account</TableHead>
                                    <TableHead className="text-right text-xs">Cashback</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredTransactions.length > 0 ? (
                                    filteredTransactions.map(tx => (
                                        <TableRow key={tx.id}>
                                            <TableCell className="font-medium whitespace-nowrap text-xs">{format(tx.date, "PP")}</TableCell>
                                            <TableCell className="whitespace-nowrap text-xs">{tx.accountNumber}</TableCell>
                                            <TableCell className="text-right font-semibold text-primary whitespace-nowrap text-xs">${tx.cashbackAmount.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24 text-xs">
                                            No transactions found for this selection.
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
