
"use client";

import { useEffect, useState } from "react";
import { useParams, notFound, useRouter } from 'next/navigation';
import { useAuthContext } from "@/hooks/useAuthContext";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import type { CashbackTransaction } from "@/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, DollarSign, Calendar, Hash, ReceiptText, StickyNote, Briefcase } from "lucide-react";
import { format } from "date-fns";

function DetailRow({ icon: Icon, label, value, isCurrency = false }: { icon: React.ElementType, label: string, value?: string | number, isCurrency?: boolean }) {
    if (!value) return null;
    const displayValue = isCurrency && typeof value === 'number' ? `$${value.toFixed(2)}` : value;
    return (
        <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-medium">{displayValue}</p>
            </div>
        </div>
    );
}

export default function TransactionDetailPage() {
    const { user } = useAuthContext();
    const params = useParams();
    const router = useRouter();
    const transactionId = params.transactionId as string;
    const [transaction, setTransaction] = useState<CashbackTransaction | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTransaction = async () => {
            if (!user || !transactionId) {
                setIsLoading(false);
                return;
            }

            try {
                const docRef = doc(db, 'cashbackTransactions', transactionId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists() && docSnap.data().userId === user.uid) {
                    const data = docSnap.data();
                    setTransaction({
                        id: docSnap.id,
                        ...data,
                        date: (data.date as any).toDate(),
                    } as CashbackTransaction);
                } else {
                    notFound();
                }
            } catch (error) {
                console.error("Error fetching transaction:", error);
                notFound();
            } finally {
                setIsLoading(false);
            }
        };

        fetchTransaction();
    }, [user, transactionId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[calc(100vh-theme(spacing.14))]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!transaction) {
        return notFound();
    }

    return (
        <div className="max-w-[400px] mx-auto w-full px-4 py-4 space-y-4">
            <Button variant="ghost" onClick={() => router.back()} className="h-auto p-0 text-sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Transactions
            </Button>
            
            <PageHeader title="Transaction Details" />

            <Card>
                <CardHeader className="p-4">
                    <CardTitle className="text-2xl text-primary">${transaction.cashbackAmount.toFixed(2)}</CardTitle>
                    <CardDescription>Cashback Received</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                    <DetailRow icon={Calendar} label="Date" value={format(transaction.date, 'PPP')} />
                    <DetailRow icon={Briefcase} label="Broker" value={transaction.broker} />
                    <DetailRow icon={Hash} label="Account Number" value={transaction.accountNumber} />
                    <DetailRow icon={ReceiptText} label="Trade Details" value={transaction.tradeDetails} />
                    <DetailRow icon={StickyNote} label="Admin Notes" value={transaction.notes} />
                </CardContent>
            </Card>
        </div>
    );
}
