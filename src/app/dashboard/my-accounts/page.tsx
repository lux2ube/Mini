
"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { AccountCard } from "@/components/user/AccountCard";
import type { TradingAccount } from "@/types";
import { useAuthContext } from "@/hooks/useAuthContext";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { Loader2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function MyAccountsPage() {
  const { user } = useAuthContext();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAccounts = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        const q = query(collection(db, "tradingAccounts"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const fetchedAccounts = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: (data.createdAt as Timestamp).toDate(),
          } as TradingAccount;
        });

        // Sort accounts by creation date, most recent first
        fetchedAccounts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setAccounts(fetchedAccounts);
      } catch (error) {
        console.error("Error fetching trading accounts: ", error);
        // Optionally, show a toast message to the user
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
        fetchAccounts();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-[400px] mx-auto w-full px-4 py-4 space-y-4">
      <PageHeader
        title="My Trading Accounts"
        description="Your linked forex trading accounts."
      />

      <Button asChild className="w-full" size="sm">
        <Link href="/dashboard/brokers">
            <PlusCircle className="mr-2 h-4 w-4" />
            Link New Account
        </Link>
      </Button>

      {accounts.length > 0 ? (
        <div className="space-y-2">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      ) : (
        <Card>
            <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">You have no linked accounts yet.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
