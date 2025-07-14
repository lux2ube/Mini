
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/hooks/useAuthContext";
import { DollarSign, Briefcase, Upload, ArrowRight, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function UserDashboardPage() {
  const { user } = useAuthContext();
  const [stats, setStats] = useState({
    totalCashback: 0,
    linkedAccounts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const accountsQuery = query(collection(db, "tradingAccounts"), where("userId", "==", user.uid));
          const accountsSnapshot = await getCountFromServer(accountsQuery);
          
          // Placeholder for real cashback data
          const totalCashback = 0; 

          setStats({
            totalCashback,
            linkedAccounts: accountsSnapshot.data().count,
          });

        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        } finally {
            setIsLoading(false);
        }
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (isLoading) {
    return (
        <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  // Main dashboard layout
  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.displayName || 'User'}!`}
        description="Here’s an overview of your cashback activity."
      />
      
      {/* Summary Area */}
      <div className="mb-6">
        <Card className="shadow-lg bg-primary/5 border-primary/20">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <DollarSign className="w-8 h-8 text-primary" />
                    <div>
                        <CardDescription>Total Cashback Earned</CardDescription>
                        <CardTitle className="text-4xl font-bold text-primary">${stats.totalCashback.toFixed(2)}</CardTitle>
                    </div>
                </div>
            </CardHeader>
             <CardContent>
                <p className="text-xs text-muted-foreground">This is the total cashback earned across all your approved accounts.</p>
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Action Block #1 – Account Linking */}
        <Card className="flex flex-col">
            <CardHeader>
                 <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                        <Briefcase className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle>Trading Accounts</CardTitle>
                        <CardDescription>Link a new trading account to start earning cashback.</CardDescription>
                    </div>
                 </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <div className="p-4 rounded-lg bg-muted flex justify-between items-center">
                    <span className="font-medium">Approved Accounts</span>
                    <span className="text-2xl font-bold text-primary">{stats.linkedAccounts}</span>
                </div>
                 <Button asChild size="sm" variant="outline" className="w-full">
                    <Link href="/dashboard/my-accounts">
                        Manage Accounts <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardContent>
            <CardContent>
                 <Button asChild size="lg" className="w-full">
                    <Link href="/dashboard/brokers">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Add Trading Account
                    </Link>
                </Button>
            </CardContent>
        </Card>

        {/* Action Block #2 – Withdrawals */}
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                        <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle>Withdrawals</CardTitle>
                        <CardDescription>Withdraw your earned cashback to your wallet.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <div className="p-4 rounded-lg bg-muted flex justify-between items-center">
                    <div>
                        <p className="font-medium">Pending Withdrawals</p>
                        {/* Placeholder Value */}
                        <p className="text-sm text-muted-foreground">0</p>
                    </div>
                     <div>
                        <p className="font-medium">Approved</p>
                        {/* Placeholder Value */}
                        <p className="text-sm text-muted-foreground">0</p>
                    </div>
                </div>
                 <Button asChild size="sm" variant="outline" className="w-full">
                    <Link href="/dashboard/withdraw">
                        View Withdrawal History <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardContent>
            <CardContent>
                 <Button asChild size="lg" className="w-full">
                    <Link href="/dashboard/withdraw">
                        Request Withdrawal
                    </Link>
                </Button>
            </CardContent>
        </Card>
      </div>

    </>
  );
}
