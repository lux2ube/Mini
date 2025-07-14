
"use client";

import React, { useState, useMemo } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Search, X } from "lucide-react";
import { format } from "date-fns";
import type { CashbackTransaction } from "@/types";
import { useAuthContext } from '@/hooks/useAuthContext';

// Mock data - replace with actual data fetching
const mockTransactions: CashbackTransaction[] = [
    { id: 'TXN001', date: new Date('2024-05-20'), accountNumber: 'ACC12345', broker: 'Exness', merchant: 'EUR/USD Trade', transactionAmount: 15000, cashbackAmount: 1.50 },
    { id: 'TXN002', date: new Date('2024-05-19'), accountNumber: 'ACC67890', broker: 'IC Markets', merchant: 'GBP/JPY Trade', transactionAmount: 22000, cashbackAmount: 2.20 },
    { id: 'TXN003', date: new Date('2024-05-18'), accountNumber: 'ACC12345', broker: 'Exness', merchant: 'XAU/USD Trade', transactionAmount: 8000, cashbackAmount: 0.80 },
    { id: 'TXN004', date: new Date('2024-04-15'), accountNumber: 'ACC55555', broker: 'Pepperstone', merchant: 'Oil Trade', transactionAmount: 30000, cashbackAmount: 3.00 },
    { id: 'TXN005', date: new Date('2024-04-12'), accountNumber: 'ACC67890', broker: 'IC Markets', merchant: 'AUD/CAD Trade', transactionAmount: 12500, cashbackAmount: 1.25 },
];

const mockAccounts = [
    { id: 'ACC12345', label: 'Exness - ACC12345' },
    { id: 'ACC67890', label: 'IC Markets - ACC67890' },
    { id: 'ACC55555', label: 'Pepperstone - ACC55555' },
]

export default function TransactionsPage() {
    const { user } = useAuthContext(); // In a real app, you'd use this to fetch data
    const [transactions, setTransactions] = useState<CashbackTransaction[]>(mockTransactions);
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

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const searchLower = filters.search.toLowerCase();
            const matchesSearch = filters.search === '' ||
                tx.merchant.toLowerCase().includes(searchLower) ||
                tx.accountNumber.toLowerCase().includes(searchLower) ||
                tx.id.toLowerCase().includes(searchLower);
            
            const matchesAccount = filters.account === 'all' || tx.accountNumber === filters.account;

            const matchesDate = (!filters.dateFrom || tx.date >= filters.dateFrom) &&
                              (!filters.dateTo || tx.date <= filters.dateTo);
            
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
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search transactions..."
                                className="pl-8"
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                            />
                        </div>

                        {/* Account Select */}
                        <Select value={filters.account} onValueChange={(value) => handleFilterChange('account', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Accounts" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Accounts</SelectItem>
                                {mockAccounts.map(acc => (
                                     <SelectItem key={acc.id} value={acc.id}>{acc.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Date From */}
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
                        
                        {/* Date To */}
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
                                    {filteredTransactions.length > 0 ? (
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
