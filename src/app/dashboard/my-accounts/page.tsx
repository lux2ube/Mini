

"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { AccountCard } from "@/components/user/AccountCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuthContext } from "@/hooks/useAuthContext";
import type { TradingAccount } from "@/types";
import { PlusCircle, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

export default function MyAccountsPage() {
  const { user } = useAuthContext();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAccounts = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const tradingAccountsCollectionRef = collection(db, "tradingAccounts");
          const q = query(
            tradingAccountsCollectionRef,
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
          );
          const querySnapshot = await getDocs(q);
          const userAccounts: TradingAccount[] = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as TradingAccount));
          setAccounts(userAccounts);
        } catch (error) {
          console.error("Error fetching trading accounts:", error);
          // Optionally show a toast to the user
        } finally {
          setIsLoading(false);
        }
      } else {
        setAccounts([]); // Clear accounts if no user
        setIsLoading(false);
      }
    };

    if(user) {
        fetchAccounts();
    }
  }, [user]);

  return (
    <>
      <PageHeader
        title="My Trading Accounts"
        description="View and manage your linked forex trading accounts."
        actions={
          <Link href="/dashboard/my-accounts/add">
            <Button size="sm" className="text-xs sm:text-sm">
              <PlusCircle className="mr-1 sm:mr-2 h-4 w-4" />
              Add New Account
            </Button>
          </Link>
        }
      />
      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {!isLoading && accounts.length === 0 && (
        <div className="text-center py-10">
          <p className="text-lg text-muted-foreground mb-4">You have not added any trading accounts yet.</p>
          <Link href="/dashboard/my-accounts/add">
            <Button size="lg">Link Your First Account</Button>
          </Link>
        </div>
      )}
      {!isLoading && accounts.length > 0 && (
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}
    </>
  );
}
