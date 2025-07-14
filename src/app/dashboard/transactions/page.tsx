
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Search, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import type { CashbackTransaction, TradingAccount } from "@/types";
import { useAuthContext } from '@/hooks/useAuthContext';
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";

export default function TransactionsPage() {
    const { user } = useAuthContext();
    const [transactions, setTransactions] = useState<CashbackTransaction[]>([]);
    const [accounts, setAccounts] = useState<TradingAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState<{
        search: string;
        account: string;
        dateFrom: Date | undefined;
        dateTo: Date | undefined;
    }>({
        search: '',
        account: 'all',
        dateFrom: undefined,
        dateTo: undefined,
    });

    useEffect(() => {
      const fetchData = async () => {
        if (user) {
          setIsLoading(true);
          try {
            // Fetch trading accounts for the filter dropdown
            const accountsQuery = query(collection(db, "tradingAccounts"), where("userId", "==", user.uid));
            const accountsSnapshot = await getDocs(accountsQuery);
            const userAccounts = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TradingAccount));
            setAccounts(userAccounts);

            // Fetch cashback transactions
            const transactionsQuery = query(collection(db, "cashbackTransactions"), where("userId", "==", user.uid));
            const transactionsSnapshot = await getDocs(transactionsQuery);
            const userTransactions = transactionsSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    date: (data.date as Timestamp).toDate(),
                } as CashbackTransaction
            });
            
            // Sort by most recent
            userTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
            
            setTransactions(userTransactions);

          } catch (error) {
            console.error("Error fetching transaction data:", error);
          } finally {
            setIsLoading(false);
          }
        }
      };

      if(user) {
          fetchData();
      }
    }, [user]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const searchLower = filters.search.toLowerCase();
            const matchesSearch = filters.search === '' ||
                tx.merchant.toLowerCase().includes(searchLower) ||
                tx.accountNumber.toLowerCase().includes(searchLower) ||
                tx.id.toLowerCase().includes(searchLower);
            
            const matchesAccount = filters.account === 'all' || tx.accountNumber === filters.account;

            const txDate = tx.date;
            const fromDate = filters.dateFrom;
            const toDate = filters.dateTo;
            
            if (fromDate) fromDate.setHours(0, 0, 0, 0);
            if (toDate) toDate.setHours(23, 59, 59, 999);

            const matchesDate = (!fromDate || txDate >= fromDate) && (!toDate || txDate <= toDate);
            
            return matchesSearch && matchesAccount && matchesDate;
        });
    }, [transactions, filters]);

    const handleFilterChange = (key: keyof typeof filters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            account: 'all',
            dateFrom: undefined,
            dateTo: undefined,
        });
    };

    return (
        <>
            <PageHeader
                title="Transaction History"
                description="View your cashback earnings from all linked accounts."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search transactions..."
                                className="pl-8"
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                            />
                        </div>

                        <Select value={filters.account} onValueChange={(value) => handleFilterChange('account', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Accounts" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Accounts</SelectItem>
                                {accounts.map(acc => (
                                     <SelectItem key={acc.id} value={acc.accountNumber}>{acc.broker} - {acc.accountNumber}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                         <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className="w-full justify-start text-left font-normal"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {filters.dateFrom ? format(filters.dateFrom, "PPP") : <span>Date from</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={filters.dateFrom}
                                    onSelect={(date) => handleFilterChange('dateFrom', date)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className="w-full justify-start text-left font-normal"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {filters.dateTo ? format(filters.dateTo, "PPP") : <span>Date to</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={filters.dateTo}
                                    onSelect={(date) => handleFilterChange('dateTo', date)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                    </div>
                    <Button variant="ghost" onClick={clearFilters} size="sm">
                        <X className="mr-2 h-4 w-4"/>
                        Clear Filters
                    </Button>
                </CardContent>
            </Card>

            <div className="mt-6">
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Account</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Transaction</TableHead>
                                        <TableHead className="text-right">Cashback</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24">
                                                <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredTransactions.length > 0 ? (
                                        filteredTransactions.map(tx => (
                                            <TableRow key={tx.id}>
                                                <TableCell className="font-medium whitespace-nowrap">{format(tx.date, "PP")}</TableCell>
                                                <TableCell>{tx.broker} - {tx.accountNumber}</TableCell>
                                                <TableCell>{tx.merchant}</TableCell>
                                                <TableCell className="text-right">${tx.transactionAmount.toLocaleString()}</TableCell>
                                                <TableCell className="text-right font-semibold text-primary">${tx.cashbackAmount.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24">
                                                No transactions found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
