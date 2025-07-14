"use client";

import { UserLayout } from "@/components/shared/UserLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/hooks/useAuthContext";
import { DollarSign, ListChecks, BarChart3, ArrowLeft, Loader2, History } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Transaction } from "@/types";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, getCountFromServer } from "firebase/firestore";

export default function UserDashboardPage() {
  const { user, isLoading: authLoading } = useAuthContext();
  const [totalApproved, setTotalApproved] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [totalCashback, setTotalCashback] = useState(0);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (user) {
        setIsStatsLoading(true);
        try {
          // Fetch total approved transactions
          const approvedQuery = query(collection(db, "transactions"), where("userId", "==", user.uid), where("status", "==", "Approved"));
          const approvedSnapshot = await getCountFromServer(approvedQuery);
          setTotalApproved(approvedSnapshot.data().count);
          
          // Fetch pending cashback requests
          const pendingQuery = query(collection(db, "transactions"), where("userId", "==", user.uid), where("status", "==", "Pending"));
          const pendingSnapshot = await getCountFromServer(pendingQuery);
          setPendingRequests(pendingSnapshot.data().count);

          // Calculate total cashback from approved transactions
          const approvedDocsSnapshot = await getDocs(approvedQuery);
          let currentTotalCashback = 0;
          approvedDocsSnapshot.forEach(doc => {
            currentTotalCashback += doc.data().cashbackAmount || 0;
          });
          setTotalCashback(currentTotalCashback);

        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        } finally {
            setIsStatsLoading(false);
        }
      } else {
        setIsStatsLoading(false);
      }
    };

    if (!authLoading) {
        fetchDashboardData();
    }
  }, [user, authLoading]);

  if (authLoading || !user) {
    return (
        <UserLayout>
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        </UserLayout>
    );
  }

  return (
    <UserLayout>
      <PageHeader
        title={`Welcome, ${user.displayName || 'User'}`}
        description="Here is a summary of your cashback activity."
      />
      {isStatsLoading ? (
         <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
             <Card className="shadow-lg"><CardContent className="p-6"><div className="h-20 animate-pulse rounded-md bg-muted"></div></CardContent></Card>
             <Card className="shadow-lg"><CardContent className="p-6"><div className="h-20 animate-pulse rounded-md bg-muted"></div></CardContent></Card>
             <Card className="shadow-lg"><CardContent className="p-6"><div className="h-20 animate-pulse rounded-md bg-muted"></div></CardContent></Card>
         </div>
      ) : (
      <>
      <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cashback Earned</CardTitle>
            <DollarSign className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-primary">${totalCashback.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">From all approved requests</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Transactions</CardTitle>
            <ListChecks className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-primary">{totalApproved}</div>
             <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-primary mt-1 flex items-center">
              View History <ArrowLeft className="ml-1 h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <BarChart3 className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-primary">{pendingRequests}</div>
             <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-primary mt-1 flex items-center">
              View History <ArrowLeft className="ml-1 h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 md:mt-8 grid gap-4 md:gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Submit New Request</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Submit a new transaction to earn cashback.
            </p>
            <Link href="/request-cashback">
              <Button>
                <ListChecks className="mr-2 h-4 w-4" /> Request Cashback
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">View History</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              See all of your past cashback requests.
            </p>
            <Link href="/dashboard">
              <Button variant="outline">
                 <History className="mr-2 h-4 w-4" /> View Transactions
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      </>
      )}
    </UserLayout>
  );
}
