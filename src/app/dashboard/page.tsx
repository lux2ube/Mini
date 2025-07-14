
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/hooks/useAuthContext";
import { DollarSign, Briefcase, ArrowRight, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { Loader2 } from "lucide-react";

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
          
          const totalCashback = 254.30; 

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
      
      {/* Balance Card */}
      <div className="mb-6">
        <Card className="shadow-lg bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
            <CardHeader>
                <CardDescription className="text-foreground">Available Balance</CardDescription>
                <CardTitle className="text-4xl font-bold text-primary">${stats.totalCashback.toFixed(2)}</CardTitle>
            </CardHeader>
             <CardContent className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="w-full bg-gradient-to-r from-primary to-green-400 text-primary-foreground hover:shadow-lg transition-shadow">
                    <Link href="/dashboard/withdraw">
                        Withdraw
                    </Link>
                </Button>
                <Button asChild size="lg" variant="secondary" className="w-full">
                    <Link href="/dashboard/brokers">
                        Earn Now
                    </Link>
                </Button>
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
                        <DollarSign className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle>Withdrawal History</CardTitle>
                        <CardDescription>View your past and pending withdrawals.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <div className="p-4 rounded-lg bg-muted grid grid-cols-2 gap-4">
                    <div>
                        <p className="font-medium">Pending</p>
                        {/* Placeholder Value */}
                        <p className="text-lg font-bold text-muted-foreground">$0.00</p>
                    </div>
                     <div>
                        <p className="font-medium">Completed</p>
                        {/* Placeholder Value */}
                        <p className="text-lg font-bold text-muted-foreground">$0.00</p>
                    </div>
                </div>
            </CardContent>
            <CardContent>
                 <Button asChild size="lg" variant="outline" className="w-full">
                    <Link href="/dashboard/withdraw">
                        View History <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
      </div>

    </>
  );
}
