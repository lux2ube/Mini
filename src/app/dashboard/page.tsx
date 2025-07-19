
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/hooks/useAuthContext";
import { DollarSign, Briefcase, PlusCircle, Landmark, ArrowRight, Users, Gift, Copy, Wallet, MessageCircle, ChevronRight, KeyRound, ReceiptText, Settings, Store } from "lucide-react";
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

const quickAccessLinks = [
    { href: "/dashboard/my-accounts", icon: Users, label: "Accounts" },
    { href: "/dashboard/transactions", icon: ReceiptText, label: "History" },
    { href: "/dashboard/referrals", icon: Gift, label: "Referrals" },
    { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

function QuickAccessGrid() {
    return (
        <div className="grid grid-cols-4 gap-2 text-center">
            {quickAccessLinks.map(link => (
                 <Link href={link.href} key={link.href}>
                    <div className="flex flex-col items-center justify-center p-2 space-y-1 rounded-lg hover:bg-muted transition-colors">
                       <div className="p-2 bg-primary/10 rounded-full">
                         <link.icon className="h-5 w-5 text-primary" />
                       </div>
                       <p className="text-xs text-muted-foreground">{link.label}</p>
                    </div>
                </Link>
            ))}
        </div>
    )
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


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Referral link or code copied to clipboard.' });
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
                    <h2 className="text-lg font-semibold mt-4">Account Rebates</h2>
                    <Card className="bg-slate-800 text-white shadow-lg overflow-hidden">
                        <CardContent className="p-4 relative">
                            <div className="absolute top-0 left-0 w-full h-full bg-slate-900/20" style={{ backgroundImage: `radial-gradient(circle at top right, hsl(var(--primary) / 0.15), transparent 50%)`}}></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-base font-semibold text-gray-300">COIN CASH</h3>
                                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                                      <svg className="w-6 h-6 text-primary-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"></path><path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <p className="text-xs text-gray-400">Total Cashback</p>
                                    <p className="text-3xl font-bold">${stats.availableBalance.toFixed(2)}</p>
                                </div>
                                <div className="mt-4 grid grid-cols-3 divide-x divide-slate-700">
                                    <div className="px-2">
                                        <p className="text-xs text-gray-400">Incoming</p>
                                        <p className="font-semibold text-sm">${stats.totalEarned.toFixed(2)}</p>
                                    </div>
                                     <div className="px-2 text-center">
                                        <p className="text-xs text-gray-400">Outgoing</p>
                                        <p className="font-semibold text-sm">${stats.completedWithdrawals.toFixed(2)}</p>
                                    </div>
                                     <div className="px-2 text-right">
                                        <p className="text-xs text-gray-400">PENDING</p>
                                        <p className="font-semibold text-sm">${stats.pendingWithdrawals.toFixed(2)}</p>
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

                    <QuickAccessGrid />

                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold mt-4">List Brokers</h2>
                        <Card>
                          <CardContent className="p-0">
                            <Table>
                               <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-xs">Account</TableHead>
                                    <TableHead className="text-xs">Broker</TableHead>
                                    <TableHead className="text-right text-xs">Status</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {stats.linkedAccounts.length > 0 ? (
                                    stats.linkedAccounts.map(account => (
                                      <TableRow key={account.id}>
                                        <TableCell className="font-medium text-xs">{account.accountNumber}</TableCell>
                                        <TableCell className="text-xs">{account.broker}</TableCell>
                                        <TableCell className="text-right text-xs">{account.status}</TableCell>
                                      </TableRow>
                                    ))
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={3} className="text-center text-muted-foreground py-4 text-xs">
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

                    <div className="space-y-4">
                         <h2 className="text-lg font-semibold mt-4">Referrals</h2>
                         <Card>
                            <CardContent className="p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div>
                                        <p className="text-xl font-bold">{stats.totalReferrals}</p>
                                        <p className="text-xs text-muted-foreground">Total Referrals</p>
                                    </div>
                                     <div>
                                        <p className="text-xl font-bold">{stats.referralPoints}</p>
                                        <p className="text-xs text-muted-foreground">Referral Points</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                     <p className="text-xs font-medium">Your Invite Code</p>
                                     <div className="flex items-center gap-2">
                                        <div className="relative flex-grow">
                                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input readOnly value={user?.profile?.referralCode || 'N/A'} className="font-mono text-sm pl-10" />
                                        </div>
                                        <Button size="icon" variant="outline" onClick={() => copyToClipboard(user?.profile?.referralCode || '')}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                 <div className="space-y-2">
                                     <p className="text-xs font-medium">Your Invite Link</p>
                                     <div className="flex items-center gap-2">
                                        <Input readOnly value={referralLink} className="text-xs" />
                                        <Button size="icon" variant="outline" onClick={() => copyToClipboard(referralLink)}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                             <CardHeader className="p-2 border-t">
                                <Button asChild variant="ghost" size="sm" className="w-full justify-center">
                                    <Link href="/dashboard/referrals">View Referrals Details <ChevronRight className="ml-2 h-4 w-4" /></Link>
                                </Button>
                             </CardHeader>
                         </Card>
                    </div>


                </TabsContent>
                <TabsContent value="rebate">
                    <Card className="mt-4">
                        <CardContent className="p-6">
                            <p className="text-center text-muted-foreground text-sm">Auto Rebate feature is coming soon.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
        <div className="fixed bottom-4 right-4">
            <Button size="icon" className="rounded-full h-12 w-12 shadow-lg">
                <MessageCircle className="h-6 w-6" />
            </Button>
        </div>
    </div>
  );
}
