
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/hooks/useAuthContext";
import { DollarSign, Briefcase, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { Loader2 } from "lucide-react";

export default function UserDashboardPage() {
  const { user } = useAuthContext();
  const [stats, setStats] = useState({
    availableBalance: 0,
    totalEarned: 0,
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
          
          const availableBalance = 254.30; 
          const totalEarned = 578.55;

          setStats({
            availableBalance,
            totalEarned,
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
        <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="max-w-[400px] mx-auto w-full px-4 py-4 space-y-4">
      <PageHeader
        title={`Welcome, ${user?.displayName || 'User'}!`}
        description="Your cashback overview."
      />
      
      <Card>
          <CardHeader>
              <CardDescription>Available Balance</CardDescription>
              <CardTitle className="text-4xl font-bold">${stats.availableBalance.toFixed(2)}</CardTitle>
              <p className="text-sm text-muted-foreground">
                  Total earned: ${stats.totalEarned.toFixed(2)}
              </p>
          </CardHeader>
           <CardContent className="flex flex-col space-y-2">
              <Button asChild className="w-full">
                  <Link href="/dashboard/withdraw">Withdraw</Link>
              </Button>
              <Button asChild variant="secondary" className="w-full">
                  <Link href="/dashboard/brokers">Earn Now</Link>
              </Button>
          </CardContent>
      </Card>

      <Card>
          <CardHeader>
               <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                      <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                      <CardTitle>Trading Accounts</CardTitle>
                      <CardDescription>Link accounts to earn.</CardDescription>
                  </div>
               </div>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted flex justify-between items-center">
                  <span className="font-medium">Approved Accounts</span>
                  <span className="text-2xl font-bold text-primary">{stats.linkedAccounts}</span>
              </div>
               <Button asChild className="w-full">
                  <Link href="/dashboard/brokers">
                      <PlusCircle className="mr-2 h-5 w-5" />
                      Add Trading Account
                  </Link>
              </Button>
          </CardContent>
      </Card>

      <Card>
          <CardHeader>
              <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                      <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                      <CardTitle>Withdrawals</CardTitle>
                      <CardDescription>View your history.</CardDescription>
                  </div>
              </div>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted flex flex-col space-y-2">
                  <div>
                      <p className="font-medium">Pending</p>
                      <p className="text-lg font-bold text-muted-foreground">$0.00</p>
                  </div>
                   <div>
                      <p className="font-medium">Completed</p>
                      <p className="text-lg font-bold text-muted-foreground">$0.00</p>
                  </div>
              </div>
              <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/withdraw">View History</Link>
              </Button>
          </CardContent>
      </Card>
    </div>
  );
}

    