
'use server';

import { db } from '@/lib/firebase/config';
import { collection, doc, getDocs, updateDoc, addDoc, serverTimestamp, query, where, Timestamp } from 'firebase/firestore';
import type { TradingAccount, UserProfile, Withdrawal, CashbackTransaction } from '@/types';

// Trading Account Management
export async function getTradingAccounts(): Promise<TradingAccount[]> {
  const accountsSnapshot = await getDocs(collection(db, 'tradingAccounts'));
  return accountsSnapshot.docs.map(doc => {
    const data = doc.data();
    return { 
      id: doc.id, 
      ...data,
      // Safely convert timestamp to Date
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    } as TradingAccount
  });
}

export async function updateTradingAccountStatus(accountId: string, status: 'Approved' | 'Rejected') {
  try {
    const accountRef = doc(db, 'tradingAccounts', accountId);
    await updateDoc(accountRef, { status });
    return { success: true, message: `Account status updated to ${status}.` };
  } catch (error) {
    console.error("Error updating account status:", error);
    return { success: false, message: 'Failed to update account status.' };
  }
}

// User Management
export async function getUsers(): Promise<UserProfile[]> {
  const usersSnapshot = await getDocs(collection(db, 'users'));
  return usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
}

// Cashback Management
export async function addCashbackTransaction(data: Omit<CashbackTransaction, 'id' | 'date'>) {
    try {
        await addDoc(collection(db, 'cashbackTransactions'), {
            ...data,
            date: serverTimestamp(),
        });
        return { success: true, message: 'Cashback transaction added successfully.' };
    } catch (error) {
        console.error("Error adding cashback transaction:", error);
        return { success: false, message: 'Failed to add cashback transaction.' };
    }
}


// Withdrawal Management
export async function getWithdrawals(): Promise<Withdrawal[]> {
    const withdrawalsSnapshot = await getDocs(collection(db, 'withdrawals'));
    const withdrawals = withdrawalsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            // Convert Timestamp to a serializable Date object
            requestedAt: data.requestedAt instanceof Timestamp ? data.requestedAt.toDate() : new Date(),
            completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : undefined,
        } as Withdrawal
    });
    return withdrawals.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
}

export async function updateWithdrawalStatus(withdrawalId: string, status: 'Completed' | 'Failed') {
     try {
        const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
        const updateData: { status: 'Completed' | 'Failed', completedAt?: any } = { status };
        if (status === 'Completed') {
            updateData.completedAt = serverTimestamp();
        }
        await updateDoc(withdrawalRef, updateData);
        return { success: true, message: `Withdrawal status updated to ${status}.` };
    } catch (error) {
        console.error("Error updating withdrawal status:", error);
        return { success: false, message: 'Failed to update withdrawal status.' };
    }
}
