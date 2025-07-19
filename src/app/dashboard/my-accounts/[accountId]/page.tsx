
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import type { TradingAccount, CashbackTransaction } from "@/types";
import { useAuthContext } from "@/hooks/useAuthContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from "firebase/firestore";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { XCircle } from "lucide-react";

export default function AccountDetailPage() {
    const { user } = useAuthContext();
    const router = useRouter();
    const params = useParams();
    const accountId = params.accountId as string;

    const [account, setAccount] = useState<TradingAccount | null>(null);
    const [transactions, setTransactions] = useState<CashbackTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user || !accountId) {
                setIsLoading(false);
                return;
            }
            
            try {
                // Fetch the specific account
                const accountRef = doc(db, 'tradingAccounts', accountId);
                const accountSnap = await getDoc(accountRef);

                if (!accountSnap.exists() || accountSnap.data().userId !== user.uid) {
                    setIsLoading(false);
                    return notFound();
                }
                const accountData = accountSnap.data();
                setAccount({ id: accountSnap.id, ...accountData, createdAt: (accountData.createdAt as Timestamp).toDate() } as TradingAccount);

                // Fetch transactions for this specific account
                const transactionsQuery = query(
                    collection(db, "cashbackTransactions"), 
                    where("userId", "==", user.uid),
                    where("accountId", "==", accountId)
                );
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
    }, [user, accountId]);
    
    const totalEarned = useMemo(() => {
        return transactions.reduce((sum, tx) => sum + tx.cashbackAmount, 0);
    }, [transactions]);
    
    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Approved': return 'default';
            case 'Pending': return 'secondary';
            case 'Rejected': return 'destructive';
            default: return 'outline';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh_-_theme(spacing.12))]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!account) {
        return notFound();
    }

    return (
        <div className="container mx-auto px-4 py-4 max-w-2xl space-y-4">
             <Button variant="ghost" onClick={() => router.back()} className="h-auto p-0 text-sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to My Accounts
            </Button>
            
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>{account.broker}</CardTitle>
                            <CardDescription>Account: {account.accountNumber}</CardDescription>
                        </div>
                         <Badge variant={getStatusVariant(account.status)}>{account.status}</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {account.status === 'Rejected' && account.rejectionReason && (
                        <Alert variant="destructive" className="mb-4">
                            <XCircle className="h-4 w-4" />
                            <AlertTitle>Rejection Reason</AlertTitle>
                            <AlertDescription>{account.rejectionReason}</AlertDescription>
                        </Alert>
                    )}
                    {account.status === 'Approved' && (
                        <p className="text-lg">
                            Total Cashback Earned: <span className="font-bold text-primary">${totalEarned.toFixed(2)}</span>
                        </p>
                    )}
                     {account.status === 'Pending' && (
                        <p className="text-sm text-muted-foreground">
                            This account is currently pending approval. You will be notified once it has been reviewed.
                        </p>
                    )}
                </CardContent>
            </Card>

            {account.status === 'Approved' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Cashback History</CardTitle>
                        <CardDescription>
                            All transactions for this account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Details</TableHead>
                                        <TableHead className="text-right">Cashback</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.length > 0 ? (
                                        transactions.map(tx => (
                                            <TableRow key={tx.id}>
                                                <TableCell className="font-medium whitespace-nowrap">{format(tx.date, "PP")}</TableCell>
                                                <TableCell>{tx.tradeDetails}</TableCell>
                                                <TableCell className="text-right font-semibold text-primary">${tx.cashbackAmount.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center h-24">
                                                No transactions found for this account yet.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
