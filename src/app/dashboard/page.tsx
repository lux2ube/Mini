
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/hooks/useAuthContext";
import { DollarSign, Briefcase, PlusCircle, Landmark, ArrowRight, Users, Gift, Copy, Wallet, MessageCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getCountFromServer, getDocs, Timestamp } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import type { BannerSettings, TradingAccount } from "@/types";
import { getBannerSettings, getUserBalance } from "../admin/actions";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"


interface DashboardStats {
    availableBalance: number;
    totalEarned: number;
    linkedAccounts: TradingAccount[];
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
             if (scriptNode.src) {
                script.src = scriptNode.src;
             }
             if (scriptNode.id) {
                script.id = scriptNode.id;
             }
             script.async = scriptNode.async;
             script.innerHTML = scriptNode.innerHTML;
             
             // Handle any other attributes on the original script
             for(let i = 0; i < scriptNode.attributes.length; i++) {
                 const attr = scriptNode.attributes[i];
                 if(attr.name !== 'src' && attr.name !== 'id' && attr.name !== 'async') {
                    script.setAttribute(attr.name, attr.value);
                 }
             }
             
             container.appendChild(script);
        } else {
             // If it's not a script (e.g., an iframe or div), just append it
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
    linkedAccounts: [],
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
          const balanceData = await getUserBalance(user.uid);
          
          const accountsQuery = query(collection(db, "tradingAccounts"), where("userId", "==", user.uid));
          const accountsSnapshot = await getDocs(accountsQuery);
          const linkedAccounts = accountsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: (data.createdAt as Timestamp).toDate(),
            } as TradingAccount;
          });
          
          setStats({
            ...balanceData,
            linkedAccounts,
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
    <div className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-4 space-y-4 max-w-2xl">
            
            <PromoBanner />

            <Tabs defaultValue="wallet" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="wallet">UTSPAY WALLET</TabsTrigger>
                    <TabsTrigger value="rebate">AUTO REBATE</TabsTrigger>
                </TabsList>
                <TabsContent value="wallet" className="space-y-4">
                    <h2 className="text-xl font-semibold mt-4">Account Rebates</h2>
                    <Card className="bg-slate-800 text-white shadow-lg overflow-hidden">
                        <CardContent className="p-4 relative">
                            <div className="absolute top-0 left-0 w-full h-full bg-slate-900/20" style={{ backgroundImage: `radial-gradient(circle at top right, rgba(16, 185, 129, 0.15), transparent 50%)`}}></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-semibold text-gray-300">COIN CASH</h3>
                                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-6 h-6 text-primary-foreground"><path fill="currentColor" d="M213.38 181.38a8 8 0 0 1-10.76 1.35A103.92 103.92 0 0 0 128 160a103.92 103.92 0 0 0-74.62 22.73a8 8 0 1 1-9.41-12.7A119.92 119.92 0 0 1 128 144a119.92 119.92 0 0 1 83.94 25.32a8 8 0 0 1 1.44 12.06M240 128a112 112 0 1 1-112-112a112 112 0 0 1 112 112m-24 0a88 88 0 1 0-88 88a88.1 88.1 0 0 0 88-88"/></svg>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <p className="text-sm text-gray-400">Total Cashback</p>
                                    <p className="text-4xl font-bold">${stats.availableBalance.toFixed(2)}</p>
                                </div>
                                <div className="mt-6 grid grid-cols-3 divide-x divide-slate-700">
                                    <div className="px-2">
                                        <p className="text-xs text-gray-400">Incoming</p>
                                        <p className="font-semibold">${stats.totalEarned.toFixed(2)}</p>
                                    </div>
                                     <div className="px-2 text-center">
                                        <p className="text-xs text-gray-400">Outgoing</p>
                                        <p className="font-semibold">${stats.completedWithdrawals.toFixed(2)}</p>
                                    </div>
                                     <div className="px-2 text-right">
                                        <p className="text-xs text-gray-400">PENDING</p>
                                        <p className="font-semibold">${stats.pendingWithdrawals.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-4">
                        <Button asChild>
                            <Link href="/dashboard/brokers">Get Cashback</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/dashboard/withdraw">Withdraw</Link>
                        </Button>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold mt-4">List Brokers</h2>
                        <Card className="mt-2">
                          <CardContent className="p-0">
                            <Table>
                               <TableHeader>
                                  <TableRow>
                                    <TableHead>Account</TableHead>
                                    <TableHead>Broker</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {stats.linkedAccounts.length > 0 ? (
                                    stats.linkedAccounts.map(account => (
                                      <TableRow key={account.id}>
                                        <TableCell className="font-medium">{account.accountNumber}</TableCell>
                                        <TableCell>{account.broker}</TableCell>
                                        <TableCell className="text-right">{account.status}</TableCell>
                                      </TableRow>
                                    ))
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                                        No linked accounts.
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                            </Table>
                          </CardContent>
                          <CardHeader className="p-2 border-t">
                             <Button asChild variant="ghost" size="sm" className="w-full justify-center">
                                <Link href="/dashboard/my-accounts">View All Accounts <ChevronRight className="ml-2 h-4 w-4" /></Link>
                              </Button>
                          </CardHeader>
                        </Card>
                    </div>

                </TabsContent>
                <TabsContent value="rebate">
                    <Card className="mt-4">
                        <CardContent className="p-6">
                            <p className="text-center text-muted-foreground">Auto Rebate feature is coming soon.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
        <div className="fixed bottom-6 right-6">
            <Button size="icon" className="rounded-full h-14 w-14 shadow-lg">
                <MessageCircle className="h-7 w-7" />
            </Button>
        </div>
    </div>
  );
}
