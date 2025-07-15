
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/hooks/useAuthContext";
import { DollarSign, Briefcase, PlusCircle, Landmark, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, getCountFromServer, Timestamp } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import type { CashbackTransaction, Withdrawal } from "@/types";
import Image from "next/image";

interface DashboardStats {
    availableBalance: number;
    totalEarned: number;
    linkedAccounts: number;
    pendingWithdrawals: number;
    completedWithdrawals: number;
}

function PromoBanner() {
    const bannerRef = useRef<HTMLDivElement>(null);
    const scriptId = "81c6356dad968be966c5c92eb10b5602c7df53bf7781e3817f3b82397349502d";

    useEffect(() => {
        const container = bannerRef.current;
        if (!container || document.getElementById(scriptId)) {
            return;
        }

        const script = document.createElement('script');
        script.src = `https://fbs.partners/banner/${scriptId}/4564/script.js?ibp=32646625`;
        script.id = scriptId;
        script.async = true;

        container.appendChild(script);

        return () => {
            // Cleanup the script when the component unmounts
            const existingScript = document.getElementById(scriptId);
            if (existingScript) {
                existingScript.remove();
            }
        };
    }, []);

    return <div ref={bannerRef} className="my-4 w-full flex justify-center"></div>;
}


export default function UserDashboardPage() {
  const { user } = useAuthContext();
  const [stats, setStats] = useState<DashboardStats>({
    availableBalance: 0,
    totalEarned: 0,
    linkedAccounts: 0,
    pendingWithdrawals: 0,
    completedWithdrawals: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (user) {
        setIsLoading(true);
        try {
          // Fetch approved accounts count
          const accountsQuery = query(
            collection(db, "tradingAccounts"), 
            where("userId", "==", user.uid),
            where("status", "==", "Approved")
          );
          const accountsSnapshot = await getCountFromServer(accountsQuery);
          const linkedAccounts = accountsSnapshot.data().count;

          // Fetch transactions to calculate earnings
          const transactionsQuery = query(collection(db, "cashbackTransactions"), where("userId", "==", user.uid));
          const transactionsSnapshot = await getDocs(transactionsQuery);
          const totalEarned = transactionsSnapshot.docs.reduce((acc, doc) => acc + doc.data().cashbackAmount, 0);

          // Fetch withdrawals to calculate balance and withdrawal stats
          const withdrawalsQuery = query(collection(db, "withdrawals"), where("userId", "==", user.uid));
          const withdrawalsSnapshot = await getDocs(withdrawalsQuery);
          
          let pendingWithdrawals = 0;
          let completedWithdrawals = 0;
          withdrawalsSnapshot.docs.forEach(doc => {
              const withdrawal = doc.data() as Withdrawal;
              if(withdrawal.status === 'Processing') {
                  pendingWithdrawals += withdrawal.amount;
              } else if (withdrawal.status === 'Completed') {
                  completedWithdrawals += withdrawal.amount;
              }
          });

          const availableBalance = totalEarned - completedWithdrawals - pendingWithdrawals;
          
          setStats({
            availableBalance,
            totalEarned,
            linkedAccounts,
            pendingWithdrawals,
            completedWithdrawals,
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
        <div className="flex justify-center items-center h-full min-h-[calc(100vh-theme(spacing.14))]">
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
      
      <PromoBanner />

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
                  <Link href="/dashboard/my-accounts">
                      <PlusCircle className="mr-2 h-5 w-5" />
                      Manage Accounts
                  </Link>
              </Button>
          </CardContent>
      </Card>

      <Card>
          <CardHeader>
              <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                      <Landmark className="h-6 w-6 text-primary" />
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
                      <p className="text-lg font-bold text-muted-foreground">${stats.pendingWithdrawals.toFixed(2)}</p>
                  </div>
                   <div>
                      <p className="font-medium">Completed</p>
                      <p className="text-lg font-bold text-muted-foreground">${stats.completedWithdrawals.toFixed(2)}</p>
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
