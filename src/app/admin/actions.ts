
'use server';

import { db } from '@/lib/firebase/config';
import { collection, doc, getDocs, updateDoc, addDoc, serverTimestamp, query, where, Timestamp, orderBy, writeBatch, deleteDoc } from 'firebase/firestore';
import type { TradingAccount, UserProfile, Withdrawal, CashbackTransaction, Broker } from '@/types';

// Broker Management
export async function getBrokers(): Promise<Broker[]> {
    const brokersSnapshot = await getDocs(query(collection(db, 'brokers'), orderBy('order')));
    return brokersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Broker));
}

export async function addBroker(data: Omit<Broker, 'id'>) {
    try {
        // Get current max order
        const brokersSnapshot = await getDocs(query(collection(db, 'brokers'), orderBy('order', 'desc'), where('order', '!=', null)));
        const maxOrder = brokersSnapshot.docs.length > 0 ? brokersSnapshot.docs[0].data().order : -1;

        await addDoc(collection(db, 'brokers'), {
            ...data,
            order: maxOrder + 1,
        });
        return { success: true, message: 'Broker added successfully.' };
    } catch (error) {
        console.error("Error adding broker:", error);
        return { success: false, message: 'Failed to add broker.' };
    }
}

export async function updateBroker(brokerId: string, data: Partial<Broker>) {
    try {
        const brokerRef = doc(db, 'brokers', brokerId);
        await updateDoc(brokerRef, data);
        return { success: true, message: 'Broker updated successfully.' };
    } catch (error) {
        console.error("Error updating broker:", error);
        return { success: false, message: 'Failed to update broker.' };
    }
}

export async function deleteBroker(brokerId: string) {
    try {
        await deleteDoc(doc(db, 'brokers', brokerId));
        return { success: true, message: 'Broker deleted successfully.' };
    } catch (error) {
        console.error("Error deleting broker:", error);
        return { success: false, message: 'Failed to delete broker.' };
    }
}

export async function updateBrokerOrder(orderedIds: string[]) {
    try {
        const batch = writeBatch(db);
        orderedIds.forEach((id, index) => {
            const docRef = doc(db, 'brokers', id);
            batch.update(docRef, { order: index });
        });
        await batch.commit();
        return { success: true, message: 'Broker order updated.' };
    } catch (error) {
        console.error("Error updating broker order:", error);
        return { success: false, message: 'Failed to update broker order.' };
    }
}


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
