
"use client";

import { useEffect, useState } from "react";
import { useParams, notFound, useRouter } from 'next/navigation';
import { useAuthContext } from "@/hooks/useAuthContext";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import type { Withdrawal } from "@/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Calendar, Hash, ReceiptText, Wallet, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | number }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-medium break-all">{value}</p>
            </div>
        </div>
    );
}

export default function WithdrawalDetailPage() {
    const { user } = useAuthContext();
    const params = useParams();
    const router = useRouter();
    const withdrawalId = params.withdrawalId as string;
    const [withdrawal, setWithdrawal] = useState<Withdrawal | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchWithdrawal = async () => {
            if (!user || !withdrawalId) {
                setIsLoading(false);
                return;
            }

            try {
                const docRef = doc(db, 'withdrawals', withdrawalId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists() && docSnap.data().userId === user.uid) {
                    const data = docSnap.data();
                    setWithdrawal({
                        id: docSnap.id,
                        ...data,
                        requestedAt: (data.requestedAt as any).toDate(),
                        completedAt: data.completedAt ? (data.completedAt as any).toDate() : undefined,
                    } as Withdrawal);
                } else {
                    notFound();
                }
            } catch (error) {
                console.error("Error fetching withdrawal:", error);
                notFound();
            } finally {
                setIsLoading(false);
            }
        };

        fetchWithdrawal();
    }, [user, withdrawalId]);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Completed': return 'default';
            case 'Processing': return 'secondary';
            case 'Failed': return 'destructive';
            default: return 'outline';
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[calc(100vh-theme(spacing.14))]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!withdrawal) {
        return notFound();
    }
    
    // Convert camelCase to Title Case for display
    const formatDetailLabel = (label: string) => {
        const result = label.replace(/([A-Z])/g, " $1");
        return result.charAt(0).toUpperCase() + result.slice(1);
    }

    return (
        <div className="max-w-[400px] mx-auto w-full px-4 py-4 space-y-4">
            <Button variant="ghost" onClick={() => router.back()} className="h-auto p-0 text-sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Withdrawals
            </Button>
            
            <PageHeader title="Withdrawal Details" />

            <Card>
                <CardHeader className="p-4 flex flex-row justify-between items-center">
                    <div>
                        <CardTitle className="text-2xl text-primary">${withdrawal.amount.toFixed(2)}</CardTitle>
                        <CardDescription>Withdrawal Request</CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(withdrawal.status)}>{withdrawal.status}</Badge>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                    <DetailRow icon={Calendar} label="Requested At" value={format(withdrawal.requestedAt, 'PPp')} />
                    {withdrawal.completedAt && <DetailRow icon={Calendar} label="Completed At" value={format(withdrawal.completedAt, 'PPp')} />}
                    <DetailRow icon={Wallet} label="Method" value={withdrawal.paymentMethod} />
                    <div className="space-y-3">
                         {Object.entries(withdrawal.withdrawalDetails).map(([key, value]) => (
                            <DetailRow key={key} icon={Hash} label={formatDetailLabel(key)} value={value} />
                         ))}
                    </div>
                    {withdrawal.txId && <DetailRow icon={ReceiptText} label="Transaction ID" value={withdrawal.txId} />}
                </CardContent>
                {withdrawal.rejectionReason && (
                    <CardFooter className="p-4 pt-0">
                         <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Rejection Reason</AlertTitle>
                            <AlertDescription>{withdrawal.rejectionReason}</AlertDescription>
                        </Alert>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
