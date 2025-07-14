
"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { BrokerCard } from "@/components/user/BrokerCard";
import { brokers } from "@/lib/data";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BrokersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");

  const filteredAndSortedBrokers = useMemo(() => {
    const filtered = brokers.filter((broker) =>
      broker.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "min-deposit-asc":
          const depositA = parseFloat(a.details.minDeposit.replace(/[^0-9.-]+/g, ""));
          const depositB = parseFloat(b.details.minDeposit.replace(/[^0-9.-]+/g, ""));
          return depositA - depositB;
        case "name-asc":
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return sorted;
  }, [searchQuery, sortBy]);

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
        <CardContent className="space-y-4">
          <Input
            placeholder="Search by broker name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="min-deposit-asc">Min. Deposit (Low-High)</SelectItem>
            </SelectContent>
          </Select>
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
