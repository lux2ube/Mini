
'use server';

import { db } from '@/lib/firebase/config';
import { collection, doc, getDocs, updateDoc, addDoc, serverTimestamp, query, where, Timestamp, orderBy, writeBatch, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import type { TradingAccount, UserProfile, Withdrawal, CashbackTransaction, Broker, BannerSettings } from '@/types';

// Generic function to create a notification
async function createNotification(userId: string, message: string, type: 'account' | 'cashback' | 'withdrawal' | 'general', link?: string) {
    try {
        await addDoc(collection(db, 'notifications'), {
            userId,
            message,
            type,
            link,
            isRead: false,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error(`Failed to create notification for user ${userId}:`, error);
    }
}


// Banner Management
export async function getBannerSettings(): Promise<BannerSettings> {
    const docRef = doc(db, 'settings', 'banner');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as BannerSettings;
    }
    // Return default settings if not found
    return { scriptCode: '', isEnabled: false };
}

export async function updateBannerSettings(settings: BannerSettings) {
    try {
        const docRef = doc(db, 'settings', 'banner');
        await setDoc(docRef, settings, { merge: true });
        return { success: true, message: 'Banner settings updated successfully.' };
    } catch (error) {
        console.error("Error updating banner settings:", error);
        return { success: false, message: 'Failed to update banner settings.' };
    }
}


// Broker Management
export async function getBrokers(): Promise<Broker[]> {
    const brokersSnapshot = await getDocs(query(collection(db, 'brokers'), orderBy('order')));
    return brokersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Broker));
}

export async function addBroker(data: Omit<Broker, 'id' | 'order'>) {
    try {
        // Get current max order
        const brokersSnapshot = await getDocs(query(collection(db, 'brokers'), orderBy('order', 'desc')));
        const maxOrder = brokersSnapshot.docs.length > 0 && brokersSnapshot.docs[0].data().order != null ? brokersSnapshot.docs[0].data().order : -1;

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

export async function updateBroker(brokerId: string, data: Partial<Omit<Broker, 'id'>>) {
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
    const accountSnap = await getDoc(accountRef);
    if (!accountSnap.exists()) throw new Error("Account not found");
    const accountData = accountSnap.data() as TradingAccount;

    await updateDoc(accountRef, { status });

    const message = `Your trading account ${accountData.accountNumber} has been ${status.toLowerCase()}.`;
    await createNotification(accountData.userId, message, 'account', '/dashboard/my-accounts');

    return { success: true, message: `Account status updated to ${status}.` };
  } catch (error) {
    console.error("Error updating account status:", error);
    return { success: false, message: 'Failed to update account status.' };
  }
}

// User Management
export async function getUsers(): Promise<UserProfile[]> {
  const usersSnapshot = await getDocs(collection(db, 'users'));
  return usersSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
        uid: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    } as UserProfile;
  });
}

// Cashback Management
export async function addCashbackTransaction(data: Omit<CashbackTransaction, 'id' | 'date'>) {
    try {
        await addDoc(collection(db, 'cashbackTransactions'), {
            ...data,
            date: serverTimestamp(),
        });

        const message = `You received $${data.cashbackAmount.toFixed(2)} cashback for account ${data.accountNumber}.`;
        await createNotification(data.userId, message, 'cashback', '/dashboard/transactions');

        return { success: true, message: 'Cashback transaction added successfully.' };
    } catch (error) {
        console.error("Error adding cashback transaction:", error);
        return { success: false, message: 'Failed to add cashback transaction.' };
    }
}


// Withdrawal Management
export async function getWithdrawals(): Promise<Withdrawal[]> {
    const withdrawalsSnapshot = await getDocs(query(collection(db, 'withdrawals'), orderBy('requestedAt', 'desc')));
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
    return withdrawals;
}

export async function approveWithdrawal(withdrawalId: string, txId: string) {
    try {
        const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
        const withdrawalSnap = await getDoc(withdrawalRef);
        if (!withdrawalSnap.exists()) throw new Error("Withdrawal not found");
        const withdrawalData = withdrawalSnap.data() as Withdrawal;

        await updateDoc(withdrawalRef, {
            status: 'Completed',
            completedAt: serverTimestamp(),
            txId: txId,
        });

        const message = `Your withdrawal of $${withdrawalData.amount.toFixed(2)} has been completed.`;
        await createNotification(withdrawalData.userId, message, 'withdrawal', '/dashboard/withdraw');

        return { success: true, message: 'Withdrawal approved successfully with TXID.' };
    } catch (error) {
        console.error("Error approving withdrawal:", error);
        return { success: false, message: 'Failed to approve withdrawal.' };
    }
}

export async function rejectWithdrawal(withdrawalId: string) {
     try {
        const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
        const withdrawalSnap = await getDoc(withdrawalRef);
        if (!withdrawalSnap.exists()) throw new Error("Withdrawal not found");
        const withdrawalData = withdrawalSnap.data() as Withdrawal;

        await updateDoc(withdrawalRef, { status: 'Failed' });

        const message = `Your withdrawal of $${withdrawalData.amount.toFixed(2)} has failed. Please contact support.`;
        await createNotification(withdrawalData.userId, message, 'withdrawal', '/dashboard/withdraw');

        return { success: true, message: `Withdrawal status updated to Failed.` };
    } catch (error) {
        console.error("Error rejecting withdrawal:", error);
        return { success: false, message: 'Failed to reject withdrawal.' };
    }
}

// Notification Actions
export async function getNotificationsForUser(userId: string): Promise<Notification[]> {
    const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: (data.createdAt as Timestamp).toDate(),
        } as Notification;
    });
}

export async function markNotificationsAsRead(notificationIds: string[]) {
    const batch = writeBatch(db);
    notificationIds.forEach(id => {
        const docRef = doc(db, 'notifications', id);
        batch.update(docRef, { isRead: true });
    });
    await batch.commit();
}
