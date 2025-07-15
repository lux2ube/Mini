
"use client";

import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { BrokerCard } from "@/components/user/BrokerCard";
import type { Broker } from "@/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { getBrokers } from "@/app/admin/actions"; // We can reuse the admin action

export default function BrokersPage() {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("order");

  useEffect(() => {
    const fetchBrokers = async () => {
      setIsLoading(true);
      try {
        const data = await getBrokers();
        setBrokers(data);
      } catch (error) {
        console.error("Failed to fetch brokers", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBrokers();
  }, []);

  const filteredAndSortedBrokers = useMemo(() => {
    const filtered = brokers.filter((broker) =>
      broker.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "min-deposit-asc":
          const depositA = parseFloat(a.details.minDeposit.replace(/[^0-9.-]+/g, ""));
          const depositB = parseFloat(b.details.minDeposit.replace(/[^0-9.-]+/g, ""));
          return depositA - depositB;
        case "order":
        default:
          return (a.order ?? 999) - (b.order ?? 999);
      }
    });

    return sorted;
  }, [brokers, searchQuery, sortBy]);

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
        title="Our Partner Brokers"
        description="Choose a broker to link your account."
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter & Sort</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="flex-grow">
               <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-1/2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order">Featured</SelectItem>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="min-deposit-asc">Min. Deposit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col space-y-4">
        {filteredAndSortedBrokers.length > 0 ? (
          filteredAndSortedBrokers.map((broker) => (
            <BrokerCard key={broker.id} broker={broker} />
          ))
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No brokers found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
