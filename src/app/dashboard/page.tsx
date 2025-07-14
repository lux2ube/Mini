"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/hooks/useAuthContext";
import { DollarSign, ListChecks, Briefcase, ArrowRight, Loader2, History, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getCountFromServer, getDocs } from "firebase/firestore";

export default function UserDashboardPage() {
  const { user } = useAuthContext();
  const [stats, setStats] = useState({
    totalCashback: 0,
    linkedAccounts: 0,
    pendingOrders: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const accountsQuery = query(collection(db, "tradingAccounts"), where("userId", "==", user.uid));
          const accountsSnapshot = await getCountFromServer(accountsQuery);
          const linkedAccounts = accountsSnapshot.data().count;

          // Placeholder for fetching orders and cashback
          const totalCashback = 0; // Replace with actual query
          const pendingOrders = 0; // Replace with actual query

          setStats({
            totalCashback,
            linkedAccounts,
            pendingOrders,
          });

        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        } finally {
            setIsLoading(false);
        }
      }
    };

    fetchDashboardData();
  }, [user]);

  if (isLoading) {
    return (
        <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.displayName || 'User'}`}
        description="Here is a summary of your trading cashback activity."
      />
      
      {stats.linkedAccounts === 0 ? (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>You haven't linked any trading accounts yet. Explore our partner brokers to begin.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/brokers">
              <Button>
                Explore Brokers <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cashback Earned</CardTitle>
                <DollarSign className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-primary">${stats.totalCashback.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">From all approved orders</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Linked Accounts</CardTitle>
                <Briefcase className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-primary">{stats.linkedAccounts}</div>
                <Link href="/my-accounts" className="text-xs text-muted-foreground hover:text-primary mt-1 flex items-center">
                  Manage Accounts <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                <ListChecks className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-primary">{stats.pendingOrders}</div>
                <Link href="/orders" className="text-xs text-muted-foreground hover:text-primary mt-1 flex items-center">
                  View Orders <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 md:mt-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Submit a New Order</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Submit a new trading order to earn cashback.
                </p>
                <Link href="/submit-order">
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Submit Order
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
