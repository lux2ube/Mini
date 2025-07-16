
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/hooks/useAuthContext";
import { DollarSign, Briefcase, PlusCircle, Landmark, ArrowRight, Users, Gift, Copy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, getCountFromServer, Timestamp, doc, getDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import type { CashbackTransaction, Withdrawal, BannerSettings, Order } from "@/types";
import Image from "next/image";
import { getBannerSettings } from "../admin/actions";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";


interface DashboardStats {
    availableBalance: number;
    totalEarned: number;
    linkedAccounts: number;
    pendingWithdrawals: number;
    completedWithdrawals: number;
    totalReferrals: number;
    referralPoints: number;
}

function PromoBanner() {
    const bannerContainerRef = useRef<HTMLDivElement>(null);
    const [settings, setSettings] = useState<BannerSettings | null>(null);

    useEffect(() => {
        getBannerSettings().then(setSettings);
    }, []);
    
    useEffect(() => {
        const container = bannerContainerRef.current;
        if (!container || !settings?.isEnabled || !settings.scriptCode) {
            return;
        }

        container.innerHTML = ''; // Clear previous content
        
        const template = document.createElement('template');
        template.innerHTML = settings.scriptCode.trim();
        
        const scriptNode = template.content.firstChild;

        if (scriptNode instanceof HTMLScriptElement) {
             const script = document.createElement('script');
             script.src = scriptNode.src;
             script.id = scriptNode.id;
             script.async = scriptNode.async;
             
             // Handle any other attributes on the original script
             for(let i = 0; i < scriptNode.attributes.length; i++) {
                 const attr = scriptNode.attributes[i];
                 if(attr.name !== 'src' && attr.name !== 'id' && attr.name !== 'async') {
                    script.setAttribute(attr.name, attr.value);
                 }
             }
             
             container.appendChild(script);
        } else {
             // If it's not a script (e.g. an iframe or div), just append it
             container.appendChild(template.content.cloneNode(true));
        }

    }, [settings]);

    if (!settings?.isEnabled || !settings.scriptCode) {
        return null;
    }

    return <div ref={bannerContainerRef} className="my-4 w-full flex justify-center"></div>;
}


export default function UserDashboardPage() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    availableBalance: 0,
    totalEarned: 0,
    linkedAccounts: 0,
    pendingWithdrawals: 0,
    completedWithdrawals: 0,
    totalReferrals: 0,
    referralPoints: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${user?.profile?.referralCode}` : '';


  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: 'Copied!', description: 'Referral link copied to clipboard.' });
  };

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

          // Fetch orders to factor into balance
            const ordersQuery = query(collection(db, "orders"), where("userId", "==", user.uid));
            const ordersSnapshot = await getDocs(ordersQuery);
            const totalSpentOnOrders = ordersSnapshot.docs
                .filter(doc => doc.data().status !== 'Cancelled')
                .reduce((sum, doc) => sum + doc.data().price, 0);


          const availableBalance = totalEarned - completedWithdrawals - pendingWithdrawals - totalSpentOnOrders;
          
          setStats({
            availableBalance,
            totalEarned,
            linkedAccounts,
            pendingWithdrawals,
            completedWithdrawals,
            totalReferrals: user.profile?.referrals?.length || 0,
            referralPoints: user.profile?.points || 0,
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
        title={`Welcome, ${user?.profile?.name || 'User'}!`}
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
                      <Gift className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                      <CardTitle>Referral Program</CardTitle>
                      <CardDescription>Invite friends and earn rewards.</CardDescription>
                  </div>
               </div>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted text-center">
                    <p className="text-sm font-medium">Invited</p>
                    <p className="text-2xl font-bold text-primary">{stats.totalReferrals}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted text-center">
                    <p className="text-sm font-medium">Points</p>
                    <p className="text-2xl font-bold text-primary">{stats.referralPoints}</p>
                </div>
              </div>
              <div className="relative">
                <Input value={referralLink} readOnly className="pr-10" />
                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4" />
                </Button>
              </div>
               <Button asChild className="w-full">
                  <Link href="/dashboard/referrals">
                      View Details
                      <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
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
