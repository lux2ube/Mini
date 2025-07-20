
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuthContext } from "@/hooks/useAuthContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Briefcase, CheckCircle, Clock, XCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import type { TradingAccount, CashbackTransaction } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function AccountCard({ account, totalEarned }: { account: TradingAccount, totalEarned: number }) {
    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Approved': return 'default';
            case 'Pending': return 'secondary';
            case 'Rejected': return 'destructive';
            default: return 'outline';
        }
    };
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Approved': return <CheckCircle className="h-4 w-4" />;
            case 'Pending': return <Clock className="h-4 w-4" />;
            case 'Rejected': return <XCircle className="h-4 w-4" />;
            default: return <Briefcase className="h-4 w-4" />;
        }
    };
    
    return (
        <Link href={`/dashboard/my-accounts/${account.id}`} className="block">
            <Card className="hover:bg-muted/50 transition-colors">
                 <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                        <Briefcase className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-grow space-y-1">
                        <p className="font-semibold">{account.broker}</p>
                        <p className="text-sm text-muted-foreground">{account.accountNumber}</p>
                        {account.status === 'Approved' && (
                            <p className="text-xs text-primary font-medium pt-1">Total Earned: ${totalEarned.toFixed(2)}</p>
                        )}
                        {account.status === 'Rejected' && account.rejectionReason && (
                            <p className="text-xs text-destructive flex items-center gap-1.5 pt-1">
                                <XCircle className="h-3 w-3"/>{account.rejectionReason}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <Badge variant={getStatusVariant(account.status)} className="gap-1.5 h-6">
                            {getStatusIcon(account.status)}
                            {account.status}
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

export default function MyAccountsPage() {
    const { user } = useAuthContext();
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

                const transactionsQuery = query(collection(db, "cashbackTransactions"), where("userId", "==", user.uid));
                const transactionsSnapshot = await getDocs(transactionsQuery);
                const userTransactions = transactionsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return { id: doc.id, ...data, date: (data.date as Timestamp).toDate() } as CashbackTransaction
                });
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

    const transactionsByAccountId = useMemo(() => {
        return transactions.reduce((acc, tx) => {
            if (!acc[tx.accountId]) {
                acc[tx.accountId] = 0;
            }
            acc[tx.accountId] += tx.cashbackAmount;
            return acc;
        }, {} as Record<string, number>);
    }, [transactions]);
    
    const accountLists = useMemo(() => ({
        all: accounts,
        approved: accounts.filter(a => a.status === 'Approved'),
        pending: accounts.filter(a => a.status === 'Pending'),
        rejected: accounts.filter(a => a.status === 'Rejected'),
    }), [accounts]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh_-_theme(spacing.12))]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const renderAccountList = (accountList: TradingAccount[]) => {
        if (accountList.length === 0) {
            return (
                <div className="text-center py-10 border rounded-lg bg-muted/30">
                    <p className="text-muted-foreground text-sm">No accounts found in this category.</p>
                </div>
            );
        }
        return (
            <div className="space-y-3">
                {accountList.map(account => (
                    <AccountCard 
                        key={account.id} 
                        account={account} 
                        totalEarned={transactionsByAccountId[account.id] || 0}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="container mx-auto px-4 py-4 max-w-2xl space-y-6">
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
            
             {accounts.length === 0 ? (
                 <div className="text-center py-20 border rounded-lg bg-muted/30">
                    <p className="text-muted-foreground">You haven't linked any accounts yet.</p>
                    <Button asChild size="sm" className="mt-4">
                        <Link href="/dashboard/brokers">Link Your First Account</Link>
                    </Button>
                </div>
             ) : (
                 <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="approved">Approved</TabsTrigger>
                        <TabsTrigger value="pending">
                            Pending 
                            {accountLists.pending.length > 0 && <Badge className="ml-2 bg-amber-500">{accountLists.pending.length}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="rejected">
                            Rejected
                            {accountLists.rejected.length > 0 && <Badge variant="destructive" className="ml-2">{accountLists.rejected.length}</Badge>}
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="all" className="mt-4">
                        {renderAccountList(accountLists.all)}
                    </TabsContent>
                    <TabsContent value="approved" className="mt-4">
                        {renderAccountList(accountLists.approved)}
                    </TabsContent>
                    <TabsContent value="pending" className="mt-4">
                        {renderAccountList(accountLists.pending)}
                    </TabsContent>
                    <TabsContent value="rejected" className="mt-4">
                        {renderAccountList(accountLists.rejected)}
                    </TabsContent>
                </Tabs>
             )}
        </div>
    );
}
