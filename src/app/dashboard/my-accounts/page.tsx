
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
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";

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

      setIsLoading(true);
      try {
        const q = query(collection(db, "tradingAccounts"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const userAccounts = querySnapshot.docs.map(doc => {
            const data = doc.data();
            // Ensure createdAt is a valid Timestamp, defaulting to now if missing
            const createdAt = data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now();
            return {
                id: doc.id,
                userId: data.userId,
                broker: data.broker,
                accountNumber: data.accountNumber,
                status: data.status,
                createdAt: createdAt,
            } as TradingAccount;
        });

        // Sort accounts by creation date, most recent first
        userAccounts.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

        setAccounts(userAccounts);
      } catch (error) {
        console.error("Error fetching trading accounts:", error);
        // Optionally, set an error state to show a message to the user
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccounts();
  }, [user]);

  return (
    <div className="max-w-[400px] mx-auto w-full px-4 py-4 space-y-4">
      <PageHeader
        title="My Trading Accounts"
        description="Your linked forex trading accounts."
      />
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-10 space-y-4">
          <p className="text-lg text-muted-foreground">No accounts added yet.</p>
          <Button asChild className="w-full">
            <Link href="/dashboard/brokers">Link Your First Account</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col space-y-4">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
           <Button asChild className="w-full">
            <Link href="/dashboard/brokers">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Account
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
