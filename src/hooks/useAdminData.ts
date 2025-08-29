
"use client";

import { useState, useEffect, useCallback } from 'react';
import { getTradingAccounts } from '@/app/admin/actions';
import { getUsers } from '@/app/admin/users/actions';
import type { TradingAccount, UserProfile } from '@/types';
import { useToast } from './use-toast';

export function useAdminData() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [accounts, setAccounts] = useState<TradingAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [fetchedUsers, fetchedAccounts] = await Promise.all([
                getUsers(),
                getTradingAccounts()
            ]);
            setUsers(fetchedUsers);
            setAccounts(fetchedAccounts);
        } catch (error) {
            console.error("Failed to fetch admin data:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load necessary admin data.' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { users, accounts, isLoading, refetch: fetchData };
}
