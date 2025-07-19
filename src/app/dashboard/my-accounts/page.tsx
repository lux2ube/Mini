
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthContext } from "@/hooks/useAuthContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Briefcase, CheckCircle, Clock, XCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import type { TradingAccount, CashbackTransaction } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


function AccountStatusCard({ account }: { account: TradingAccount }) {
    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Pending': return 'secondary';
            case 'Rejected': return 'destructive';
            default: return 'outline';
        }
    }
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Pending': return <Clock className="h-4 w-4" />;
            case 'Rejected': return <XCircle className="h-4 w-4" />;
            default: return <CheckCircle className="h-4 w-4" />;
        }
    }
    
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
                       {account.status === 'Rejected' && account.rejectionReason && (
                         <p className="text-xs text-destructive flex items-center gap-1.5 pt-1">
                            <XCircle className="h-3 w-3"/>{account.rejectionReason}
                         </p>
                      )}
                    </div>
                    <Badge variant={getStatusVariant(account.status)} className="gap-1.5 h-6">
                        {getStatusIcon(account.status)}
                        {account.status}
                    </Badge>
                </CardContent>
            </Card>
        </Link>
    )
}


function ApprovedAccountCard({ account, totalEarned }: { account: TradingAccount, totalEarned: number }) {
    return (
        <CarouselItem className="md:basis-1/2 lg:basis-1/3">
            <Link href={`/dashboard/my-accounts/${account.id}`} className="block h-full">
                <div className="p-1 h-full">
                    <Card className="bg-slate-800 text-white shadow-lg overflow-hidden h-full flex flex-col justify-between hover:border-primary transition-colors">
                        <CardContent className="p-4 relative">
                            <div className="absolute top-0 left-0 w-full h-full bg-slate-900/20" style={{ backgroundImage: `radial-gradient(circle at top right, hsl(var(--primary) / 0.2), transparent 60%)`}}></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-base font-semibold text-gray-300">{account.broker}</h3>
                                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                      <svg className="w-5 h-5 text-primary-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"></path><path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <p className="text-xs text-gray-400 font-mono tracking-widest">{account.accountNumber}</p>
                                </div>
                                <div className="mt-4">
                                    <p className="text-xs text-gray-400">Total Cashback</p>
                                    <p className="text-xl font-bold">${totalEarned.toFixed(2)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </Link>
        </CarouselItem>
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

    const { approvedAccounts, otherAccounts } = useMemo(() => {
        const approved = accounts.filter(acc => acc.status === 'Approved');
        const others = accounts.filter(acc => acc.status !== 'Approved');
        return { approvedAccounts: approved, otherAccounts: others };
    }, [accounts]);
    
    const transactionsByAccountId = useMemo(() => {
        return transactions.reduce((acc, tx) => {
            if (!acc[tx.accountId]) {
                acc[tx.accountId] = 0;
            }
            acc[tx.accountId] += tx.cashbackAmount;
            return acc;
        }, {} as Record<string, number>);
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
                <div className="space-y-6">
                    {approvedAccounts.length > 0 && (
                        <div>
                             <h2 className="text-lg font-semibold mb-2">Approved Accounts</h2>
                             <Carousel opts={{ align: "start", loop: false }} className="w-full">
                                <CarouselContent className="-ml-1">
                                    {approvedAccounts.map(account => (
                                         <ApprovedAccountCard 
                                            key={account.id} 
                                            account={account} 
                                            totalEarned={transactionsByAccountId[account.id] || 0}
                                        />
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious className="hidden md:flex" />
                                <CarouselNext className="hidden md:flex" />
                            </Carousel>
                        </div>
                    )}
                    
                    {otherAccounts.length > 0 && (
                         <div>
                             <h2 className="text-lg font-semibold mb-2">Pending & Rejected Accounts</h2>
                             <div className="space-y-3">
                                {otherAccounts.map(account => (
                                    <AccountStatusCard key={account.id} account={account} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
             )}
        </div>
    );
}
