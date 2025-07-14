
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { Loader2, PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { AccountCard } from "@/components/user/AccountCard";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/hooks/useAuthContext";
import { db } from "@/lib/firebase/config";
import type { TradingAccount } from "@/types";

export default function MyAccountsPage() {
  const { user } = useAuthContext();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Define the async function to fetch data
    const fetchAccounts = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const q = query(
          collection(db, "tradingAccounts"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const userAccounts = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          // Safely handle Firestore Timestamp conversion
          const createdAtDate = (data.createdAt && typeof data.createdAt.toDate === 'function')
            ? data.createdAt.toDate()
            : new Date();

          return {
            id: doc.id,
            userId: data.userId,
            broker: data.broker,
            accountNumber: data.accountNumber,
            status: data.status,
            createdAt: createdAtDate,
          } as TradingAccount;
        });

        // Sort accounts by creation date, most recent first
        userAccounts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAccounts(userAccounts);

      } catch (error) {
        console.error("Error fetching trading accounts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Call the async function
    fetchAccounts();
  }, [user]); // Dependency array ensures this runs when user object changes

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[calc(100vh-theme(spacing.14))]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Main component render
  return (
    <div className="max-w-[400px] mx-auto w-full px-4 py-4 space-y-4">
      <PageHeader
        title="My Trading Accounts"
        description="Your linked forex trading accounts."
      />

      {accounts.length === 0 ? (
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
           <Button asChild className="w-full mt-4">
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
