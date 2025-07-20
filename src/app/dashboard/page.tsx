
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/hooks/useAuthContext";
import { DollarSign, Briefcase, PlusCircle, Landmark, ArrowRight, Users, Gift, Copy, Wallet, MessageCircle, ChevronLeft, KeyRound, History, Settings, Store, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getCountFromServer, getDocs, Timestamp, orderBy, limit } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import type { BannerSettings, TradingAccount, CashbackTransaction } from "@/types";
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
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";


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
  const [transactions, setTransactions] = useState<CashbackTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const [balanceData, accountsSnapshot, transactionsSnapshot] = await Promise.all([
            getUserBalance(user.uid),
            getDocs(query(collection(db, "tradingAccounts"), where("userId", "==", user.uid))),
            getDocs(query(collection(db, "cashbackTransactions"), where("userId", "==", user.uid)))
          ]);
          
          const linkedAccounts = accountsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: (data.createdAt as Timestamp).toDate(),
            } as TradingAccount;
          });

          const allTransactions = transactionsSnapshot.docs.map(doc => {
              const data = doc.data();
              return { id: doc.id, ...data, date: (data.date as Timestamp).toDate() } as CashbackTransaction;
          });
          
          allTransactions.sort((a,b) => b.date.getTime() - a.date.getTime());
          
          setStats({
            ...balanceData,
            linkedAccounts,
            totalReferrals: user.profile?.referrals?.length || 0,
            referralPoints: user.profile?.points || 0,
          });
          setTransactions(allTransactions);

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

  const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Approved': return 'default';
        case 'Pending': return 'secondary';
        case 'Rejected': return 'destructive';
        default: return 'outline';
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
        case 'Approved': return 'مقبول';
        case 'Pending': return 'معلق';
        case 'Rejected': return 'مرفوض';
        default: return status;
    }
  };

  return (
    <div className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-4 space-y-4 max-w-2xl">
            
            <PromoBanner />

            <Tabs defaultValue="wallet" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="wallet">محفظة UTSPAY</TabsTrigger>
                    <TabsTrigger value="rebate">خصم تلقائي</TabsTrigger>
                </TabsList>
                <TabsContent value="wallet" className="space-y-4">
                    <h2 className="text-lg font-semibold mt-4">خصومات الحساب</h2>
                    <Card className="bg-slate-800 text-white shadow-lg overflow-hidden">
                        <CardContent className="p-4 relative">
                            <div className="absolute top-0 right-0 w-full h-full bg-slate-900/20" style={{ backgroundImage: `radial-gradient(circle at top left, hsl(var(--primary) / 0.15), transparent 50%)`}}></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-base font-semibold text-gray-300">COIN CASH</h3>
                                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                                      <svg className="w-6 h-6 text-primary-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"></path><path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <p className="text-xs text-gray-400">إجمالي الكاش باك</p>
                                    <p className="text-3xl font-bold">${stats.availableBalance.toFixed(2)}</p>
                                </div>
                                <div className="mt-4 grid grid-cols-3 divide-x divide-slate-700">
                                    <div className="pr-2">
                                        <p className="text-xs text-gray-400">الوارد</p>
                                        <p className="font-semibold text-sm">${stats.totalEarned.toFixed(2)}</p>
                                    </div>
                                     <div className="px-2 text-center">
                                        <p className="text-xs text-gray-400">الصادر</p>
                                        <p className="font-semibold text-sm">${stats.completedWithdrawals.toFixed(2)}</p>
                                    </div>
                                     <div className="pl-2 text-left">
                                        <p className="text-xs text-gray-400">قيد الانتظار</p>
                                        <p className="font-semibold text-sm">${stats.pendingWithdrawals.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="p-2 border-t border-slate-700 bg-slate-800/50 grid grid-cols-2 gap-2">
                           <Button asChild variant="secondary" size="sm">
                               <Link href="/dashboard/withdraw"><Wallet className="ml-2 h-4 w-4" /> سحب</Link>
                           </Button>
                           <Button asChild size="sm">
                               <Link href="/dashboard/brokers"><PlusCircle className="ml-2 h-4 w-4" /> الحصول على كاش باك</Link>
                           </Button>
                        </CardFooter>
                    </Card>

                    <div className="space-y-4">
                         <h2 className="text-lg font-semibold mt-4">حساباتي التجارية</h2>
                          <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-xs">الحساب</TableHead>
                                            <TableHead className="text-left text-xs">الحالة</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stats.linkedAccounts.length > 0 ? (
                                            stats.linkedAccounts.slice(0, 3).map(acc => (
                                                <TableRow key={acc.id}>
                                                    <TableCell>
                                                        <div className="font-medium text-xs">{acc.broker}</div>
                                                        <div className="text-xs text-muted-foreground">{acc.accountNumber}</div>
                                                    </TableCell>
                                                    <TableCell className="text-left">
                                                        <Badge variant={getStatusVariant(acc.status)}>{getStatusText(acc.status)}</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={2} className="h-24 text-center text-xs text-muted-foreground">
                                                    لم يتم ربط أي حسابات بعد.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                             <CardFooter className="p-2 border-t">
                                <Button asChild variant="ghost" size="sm" className="w-full justify-center">
                                    <Link href="/dashboard/my-accounts">عرض كل الحسابات <ChevronLeft className="mr-2 h-4 w-4" /></Link>
                                </Button>
                             </CardFooter>
                         </Card>

                         <h2 className="text-lg font-semibold mt-4">المعاملات الأخيرة</h2>
                         <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-xs">التاريخ</TableHead>
                                            <TableHead className="text-xs">الوسيط/الحساب</TableHead>
                                            <TableHead className="text-left text-xs">المبلغ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.length > 0 ? (
                                            transactions.slice(0, 5).map(tx => (
                                                <TableRow key={tx.id}>
                                                    <TableCell className="text-muted-foreground text-xs">{format(tx.date, "PP")}</TableCell>
                                                    <TableCell>
                                                        <div className="font-medium text-xs">{tx.broker}</div>
                                                        <div className="text-xs text-muted-foreground">{tx.accountNumber}</div>
                                                    </TableCell>
                                                    <TableCell className="text-left font-semibold text-primary text-xs">${tx.cashbackAmount.toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="h-24 text-center text-xs text-muted-foreground">
                                                    لا توجد معاملات بعد.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                             <CardFooter className="p-2 border-t">
                                <Button asChild variant="ghost" size="sm" className="w-full justify-center">
                                    <Link href="/dashboard/transactions">عرض كل المعاملات <ChevronLeft className="mr-2 h-4 w-4" /></Link>
                                </Button>
                             </CardFooter>
                         </Card>
                    </div>


                </TabsContent>
                <TabsContent value="rebate">
                    <Card className="mt-4">
                        <CardContent className="p-6">
                            <p className="text-center text-muted-foreground text-sm">ميزة الخصم التلقائي ستتوفر قريباً.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
        <div className="fixed bottom-4 left-4">
            <Button size="icon" className="rounded-full h-12 w-12 shadow-lg">
                <MessageCircle className="h-6 w-6" />
            </Button>
        </div>
    </div>
  );
}
