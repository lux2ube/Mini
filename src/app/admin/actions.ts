

'use server';

import { db } from '@/lib/firebase/config';
import { adminDb, verifyAdmin } from '@/lib/firebase/admin-config';
import * as admin from 'firebase-admin';
import { collection as clientCollection, doc as clientDoc, updateDoc as clientUpdateDoc } from 'firebase/firestore';
import { collection, doc, getDocs, updateDoc, addDoc, serverTimestamp, query, where, Timestamp, orderBy, writeBatch, deleteDoc, getDoc, setDoc, runTransaction, increment, Transaction, limit } from 'firebase/firestore';
import { startOfMonth } from 'date-fns';
import type { ActivityLog, BannerSettings, BlogPost, Broker, CashbackTransaction, DeviceInfo, Notification, Order, PaymentMethod, ProductCategory, Product, TradingAccount, UserProfile, Withdrawal, GeoInfo, ClientLevel, AdminNotification, FeedbackForm, FeedbackResponse, EnrichedFeedbackResponse, UserStatus, KycData, AddressData, PendingVerification, ContactSettings } from '@/types';
import { headers } from 'next/headers';
import { parsePhoneNumber } from "libphonenumber-js";


const safeToDate = (timestamp: any): Date | undefined => {
    if (timestamp instanceof admin.firestore.Timestamp) {
        return timestamp.toDate();
    }
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
    }
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
    }
    return undefined;
};


// Activity Logging
export async function logUserActivity(
    userId: string, 
    event: ActivityLog['event'], 
    clientInfo: { deviceInfo: DeviceInfo, geoInfo: GeoInfo },
    details?: Record<string, any>,
) {
    try {
        const logEntry: Omit<ActivityLog, 'id'> = {
            userId,
            event,
            timestamp: new Date(),
            ipAddress: clientInfo.geoInfo.ip || 'unknown',
            userAgent: clientInfo.deviceInfo.browser,
            device: clientInfo.deviceInfo,
            geo: {
                country: clientInfo.geoInfo.country,
                city: clientInfo.geoInfo.city,
            },
            details,
        };
        await addDoc(collection(db, 'activityLogs'), logEntry);
    } catch (error) {
        console.error(`Failed to log activity for event ${event}:`, error);
        // We don't want to block the user's action if logging fails
    }
}

export async function adminLogUserActivity(
    userId: string, 
    event: ActivityLog['event'], 
    clientInfo: { deviceInfo: DeviceInfo, geoInfo: GeoInfo },
    details?: Record<string, any>,
) {
    await verifyAdmin();
    try {
        const logEntry: Omit<ActivityLog, 'id'> = {
            userId,
            event,
            timestamp: new Date(),
            ipAddress: clientInfo.geoInfo.ip || 'unknown',
            userAgent: clientInfo.deviceInfo.browser,
            device: clientInfo.deviceInfo,
            geo: {
                country: clientInfo.geoInfo.country,
                city: clientInfo.geoInfo.city,
            },
            details,
        };
        await addDoc(collection(adminDb, 'activityLogs'), logEntry);
    } catch (error) {
        console.error(`Failed to log activity for event ${event}:`, error);
    }
}

export async function getActivityLogs(): Promise<ActivityLog[]> {
    await verifyAdmin();
    const logsSnapshot = await getDocs(query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc')));
    return logsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            timestamp: safeToDate(data.timestamp) || new Date(),
        } as ActivityLog
    });
}

// Generic function to create a notification
async function createNotification(
    transaction: Transaction,
    userId: string, 
    message: string, 
    type: Notification['type'], 
    link?: string
) {
    const notificationsCollection = clientCollection(db, 'notifications');
    const newNotifRef = clientDoc(notificationsCollection);
    transaction.set(newNotifRef, {
        userId,
        message,
        type,
        link,
        isRead: false,
        createdAt: serverTimestamp(),
    });
}


// Banner Management
export async function updateBannerSettings(settings: BannerSettings) {
    await verifyAdmin();
    try {
        const docRef = clientDoc(db, 'settings', 'banner');
        await setDoc(docRef, settings, { merge: true });
        return { success: true, message: 'تم تحديث إعدادات البانر بنجاح.' };
    } catch (error) {
        console.error("Error updating banner settings:", error);
        return { success: false, message: 'فشل تحديث إعدادات البانر.' };
    }
}


// Broker Management
export async function getBrokers(): Promise<Broker[]> {
    const brokersSnapshot = await getDocs(query(collection(db, 'brokers'), orderBy('order')));
    return brokersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Broker));
}

export async function addBroker(data: Omit<Broker, 'id' | 'order'>) {
    await verifyAdmin();
    try {
        // Get current max order
        const brokersSnapshot = await getDocs(query(collection(db, 'brokers'), orderBy('order', 'desc')));
        const maxOrder = brokersSnapshot.docs.length > 0 && brokersSnapshot.docs[0].data().order != null ? brokersSnapshot.docs[0].data().order : -1;

        await addDoc(collection(db, 'brokers'), {
            ...data,
            order: maxOrder + 1,
        });
        return { success: true, message: 'تمت إضافة الوسيط بنجاح.' };
    } catch (error) {
        console.error("Error adding broker:", error);
        return { success: false, message: 'فشل إضافة الوسيط.' };
    }
}

export async function addBrokersBatch(brokers: Omit<Broker, 'id' | 'order'>[]) {
    await verifyAdmin();
    try {
        const batch = writeBatch(db);
        const brokersCollection = collection(db, 'brokers');
        
        // Get current max order
        const brokersSnapshot = await getDocs(query(brokersCollection, orderBy('order', 'desc')));
        let maxOrder = brokersSnapshot.docs.length > 0 && brokersSnapshot.docs[0].data().order != null ? brokersSnapshot.docs[0].data().order : -1;

        brokers.forEach(brokerData => {
            const newBrokerRef = doc(brokersCollection);
            maxOrder++;
            batch.set(newBrokerRef, { ...brokerData, order: maxOrder });
        });

        await batch.commit();
        return { success: true, message: `تمت إضافة ${brokers.length} وسطاء بنجاح.` };
    } catch (error) {
        console.error("Error adding brokers batch:", error);
        return { success: false, message: 'فشل إضافة الوسطاء.' };
    }
}


export async function updateBroker(brokerId: string, data: Partial<Omit<Broker, 'id'>>) {
    await verifyAdmin();
    try {
        const brokerRef = clientDoc(db, 'brokers', brokerId);
        await clientUpdateDoc(brokerRef, data);
        return { success: true, message: 'تم تحديث الوسيط بنجاح.' };
    } catch (error) {
        console.error("Error updating broker:", error);
        return { success: false, message: 'فشل تحديث الوسيط.' };
    }
}

export async function deleteBroker(brokerId: string) {
    await verifyAdmin();
    try {
        await deleteDoc(doc(db, 'brokers', brokerId));
        return { success: true, message: 'تم حذف الوسيط بنجاح.' };
    } catch (error) {
        console.error("Error deleting broker:", error);
        return { success: false, message: 'فشل حذف الوسيط.' };
    }
}

export async function updateBrokerOrder(orderedIds: string[]) {
    await verifyAdmin();
    try {
        const batch = writeBatch(db);
        orderedIds.forEach((id, index) => {
            const docRef = doc(db, 'brokers', id);
            batch.update(docRef, { order: index });
        });
        await batch.commit();
        return { success: true, message: 'تم تحديث ترتيب الوسطاء.' };
    } catch (error) {
        console.error("Error updating broker order:", error);
        return { success: false, message: 'فشل تحديث ترتيب الوسطاء.' };
    }
}

// Point Awarding Engine
export async function awardReferralCommission(
    userId: string,
    sourceType: 'cashback' | 'store_purchase',
    amountValue: number
) {
    await verifyAdmin();
    try {
        await runTransaction(db, async (transaction) => {
            // 1. Get the user document to find their referrer
            const userRef = doc(db, 'users', userId);
            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists() || !userSnap.data().referredBy) {
                console.log(`User ${userId} has no referrer. Skipping commission.`);
                return; // No referrer, nothing to do
            }
            if (amountValue <= 0) {
                console.log(`Commission source amount is zero or negative for user ${userId}. Skipping.`);
                return; // No commission for zero-value transactions
            }

            const referrerId = userSnap.data().referredBy;

            // 2. Get the referrer's document to find their level
            const referrerRef = doc(db, 'users', referrerId);
            const referrerSnap = await transaction.get(referrerRef);
            if (!referrerSnap.exists()) {
                console.log(`Referrer ${referrerId} does not exist. Skipping commission.`);
                return; // Referrer doesn't exist
            }
            const referrerLevel = referrerSnap.data().level || 1;

            // 3. Get the level configuration (outside transaction for read-only data)
            const levels = await getClientLevels(); // Assuming this reads from Firestore but it's okay for a small config collection.
            const currentLevelConfig = levels.find(l => l.id === referrerLevel);
            if (!currentLevelConfig) {
                console.log(`Level config not found for level ${referrerLevel}. Skipping commission.`);
                return; // Level config not found
            }

            // 4. Calculate commission
            const commissionPercent = sourceType === 'cashback'
                ? currentLevelConfig.advantage_referral_cashback
                : currentLevelConfig.advantage_referral_store;
            
            if (commissionPercent <= 0) {
                console.log(`No commission for level ${referrerLevel} and source ${sourceType}. Skipping.`);
                return; // No commission for this action at this level
            }
            
            const commissionAmount = (amountValue * commissionPercent) / 100;

            // 5. Create a new cashback transaction for the referrer
            const newTransactionRef = doc(collection(db, 'cashbackTransactions'));
            transaction.set(newTransactionRef, {
                userId: referrerId,
                accountId: 'REFERRAL_COMMISSION',
                accountNumber: 'Referral',
                broker: `Commission from ${userSnap.data().name}`,
                date: serverTimestamp(),
                tradeDetails: `Referral commission from ${sourceType}`,
                cashbackAmount: commissionAmount,
                sourceUserId: userId,
                sourceType: sourceType,
            });
            
            // 6. Update referrer's monthly earnings
            transaction.update(referrerRef, {
                monthlyEarnings: increment(commissionAmount)
            });

            // 7. Create notification for the referrer
            const message = `لقد ربحت ${commissionAmount.toFixed(2)}$ عمولة إحالة من ${userSnap.data().name}.`;
            await createNotification(transaction, referrerId, message, 'general', '/dashboard/referrals');
        });
    } catch (error) {
        console.error(`Failed to award referral commission to user ${userId}'s referrer:`, error);
        // We don't re-throw the error, so it doesn't block the main flow.
        // This could be logged to a separate error monitoring service.
    }
}

export async function clawbackReferralCommission(
    transaction: Transaction,
    originalUserId: string,
    sourceType: 'cashback' | 'store_purchase',
    originalAmount: number
) {
    await verifyAdmin();
    const userRef = doc(db, 'users', originalUserId);
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists() || !userSnap.data().referredBy) {
        return; // No referrer, nothing to claw back
    }
    const referrerId = userSnap.data().referredBy;
    const referrerRef = doc(db, 'users', referrerId);
    const referrerSnap = await transaction.get(referrerRef);
    if (!referrerSnap.exists()) return; // Referrer doesn't exist

    const referrerLevel = referrerSnap.data().level || 1;
    const levels = await getClientLevels();
    const currentLevelConfig = levels.find(l => l.id === referrerLevel);
    if (!currentLevelConfig) return;

    const commissionPercent = sourceType === 'cashback' ? currentLevelConfig.advantage_referral_cashback : currentLevelConfig.advantage_referral_store;
    if (commissionPercent <= 0) return;

    const commissionAmountToClawback = (originalAmount * commissionPercent) / 100;
    
    // Create a negative cashback transaction for the referrer
    const newTransactionRef = doc(collection(db, 'cashbackTransactions'));
    transaction.set(newTransactionRef, {
        userId: referrerId,
        accountId: 'CLAWBACK',
        accountNumber: 'Clawback',
        broker: `Reversed Commission from ${userSnap.data().name}`,
        date: serverTimestamp(),
        tradeDetails: `Commission reversed due to cancelled order/transaction from original user.`,
        cashbackAmount: -commissionAmountToClawback, // Negative amount
        sourceUserId: originalUserId,
        sourceType: sourceType,
    });

    // Deduct from referrer's monthly earnings
    transaction.update(referrerRef, {
        monthlyEarnings: increment(-commissionAmountToClawback)
    });

    // Create notification for the referrer
    const message = `تم خصم ${commissionAmountToClawback.toFixed(2)}$ من رصيدك بسبب إلغاء معاملة من قبل ${userSnap.data().name}.`;
    await createNotification(transaction, referrerId, message, 'general', '/dashboard/referrals');
}


// Trading Account Management
export async function getTradingAccounts(): Promise<TradingAccount[]> {
  await verifyAdmin();
  const accountsSnapshot = await getDocs(collection(db, 'tradingAccounts'));
  const accounts: TradingAccount[] = [];
  accountsSnapshot.docs.forEach(doc => {
      try {
          const data = doc.data();
          accounts.push({
            id: doc.id,
            ...data,
            createdAt: safeToDate(data.createdAt) || new Date(),
          } as TradingAccount);
      } catch (error) {
          console.error(`Error processing trading account ${doc.id}:`, error);
      }
  });
  return accounts;
}

export async function updateTradingAccountStatus(accountId: string, status: 'Approved' | 'Rejected', reason?: string) {
    await verifyAdmin();
    return runTransaction(db, async (transaction) => {
        const accountRef = doc(db, 'tradingAccounts', accountId);
        const accountSnap = await transaction.get(accountRef);
        if (!accountSnap.exists()) throw new Error("لم يتم العثور على الحساب");

        const currentData = accountSnap.data() as TradingAccount;
        if (currentData.status !== 'Pending') {
            throw new Error(`لا يمكن تحديث الحساب. الحالة الحالية هي ${currentData.status}.`);
        }

        const updateData: { status: 'Approved' | 'Rejected', rejectionReason?: string } = { status };
        let message = `تم ${status === 'Approved' ? 'الموافقة على' : 'رفض'} حساب التداول الخاص بك ${currentData.accountNumber}.`;

        if (status === 'Rejected') {
            if (!reason) throw new Error("سبب الرفض مطلوب.");
            updateData.rejectionReason = reason;
            message += ` السبب: ${reason}`;
        } else {
            // Update user status to 'Active' if they were 'NEW'
            const userRef = doc(db, 'users', currentData.userId);
            const userSnap = await transaction.get(userRef);
            if (userSnap.exists() && userSnap.data().status === 'NEW') {
                transaction.update(userRef, { status: 'Active' });
            }
            updateData.rejectionReason = "";
        }

        transaction.update(accountRef, updateData);
        await createNotification(transaction, currentData.userId, message, 'account', '/dashboard/my-accounts');
        
        return { success: true, message: `تم تحديث حالة الحساب إلى ${status}.` };
    }).catch(error => {
        console.error("Error updating account status:", error);
        const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير معروف";
        return { success: false, message: `فشل تحديث حالة الحساب: ${errorMessage}` };
    });
}


export async function adminAddTradingAccount(userId: string, brokerName: string, accountNumber: string) {
    await verifyAdmin();
    return runTransaction(db, async (transaction) => {
        const q = query(
            collection(db, 'tradingAccounts'),
            where('broker', '==', brokerName),
            where('accountNumber', '==', accountNumber)
        );
        const querySnapshot = await getDocs(q); // This is outside a transaction in the calling function, but should be fine here.

        if (!querySnapshot.empty) {
            throw new Error('رقم حساب التداول هذا مرتبط بالفعل لهذا الوسيط.');
        }

        const newAccountRef = doc(collection(db, 'tradingAccounts'));
        transaction.set(newAccountRef, {
            userId: userId,
            broker: brokerName,
            accountNumber: accountNumber,
            status: 'Approved',
            createdAt: serverTimestamp(),
        });
        await createNotification(transaction, userId, `تمت إضافة حسابك ${accountNumber} والموافقة عليه من قبل المسؤول.`, 'account', '/dashboard/my-accounts');
        
        // Also set user status to Active if NEW
        const userRef = doc(db, 'users', userId);
        const userSnap = await transaction.get(userRef);
        if (userSnap.exists() && userSnap.data().status === 'NEW') {
            transaction.update(userRef, { status: 'Active' });
        }
        
        return { success: true, message: 'تمت إضافة الحساب والموافقة عليه بنجاح.' };
    }).catch(error => {
        console.error('Error adding trading account: ', error);
        const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير معروف";
        return { success: false, message: `فشل إضافة الحساب: ${errorMessage}` };
    });
}

export async function getUsers(): Promise<UserProfile[]> {
    await verifyAdmin();
    try {
        const usersSnapshot = await adminDb.collection('users').get();
        if (usersSnapshot.empty) {
            return [];
        }
        
        const users: UserProfile[] = [];
        usersSnapshot.forEach(doc => {
            const data = doc.data();
            
            // Convert any Timestamps to serializable Dates
            const kycData = data.kycData ? { ...data.kycData, submittedAt: safeToDate(data.kycData.submittedAt) } : undefined;
            const addressData = data.addressData ? { ...data.addressData, submittedAt: safeToDate(data.addressData.submittedAt) } : undefined;
            
            users.push({
                uid: doc.id,
                ...data,
                createdAt: safeToDate(data.createdAt),
                kycData,
                addressData,
            } as UserProfile);
        });

        return users;

    } catch (error) {
        console.error("Error fetching users with Admin SDK:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch users: ${error.message}`);
        }
        throw new Error("An unknown error occurred while fetching users.");
    }
}


export async function updateUser(userId: string, data: Partial<Pick<UserProfile, 'name' | 'country'>>) {
    await verifyAdmin();
    try {
        const userRef = adminDb.doc(`users/${userId}`);
        await userRef.update(data);
        return { success: true, message: 'تم تحديث الملف الشخصي بنجاح.' };
    } catch (error) {
        console.error("Error updating user profile:", error);
        const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير معروف.';
        return { success: false, message: `فشل تحديث الملف الشخصي: ${errorMessage}` };
    }
}

// Cashback Management
export async function addCashbackTransaction(data: Omit<CashbackTransaction, 'id' | 'date'>) {
    await verifyAdmin();
    try {
        // Step 1: Run the primary transaction for the user receiving cashback.
        await runTransaction(db, async (transaction) => {
            const newTransactionRef = doc(collection(db, 'cashbackTransactions'));
            transaction.set(newTransactionRef, {
                ...data,
                date: serverTimestamp(),
            });

            const userRef = doc(db, 'users', data.userId);
            transaction.update(userRef, { 
                status: 'Trader', 
                monthlyEarnings: increment(data.cashbackAmount) 
            });

            const message = `لقد تلقيت ${data.cashbackAmount.toFixed(2)}$ كاش باك للحساب ${data.accountNumber}.`;
            await createNotification(transaction, data.userId, message, 'cashback', '/dashboard/transactions');
        });

        // Step 2: After the primary transaction succeeds, award commission in a separate, non-blocking operation.
        await awardReferralCommission(data.userId, 'cashback', data.cashbackAmount);

        return { success: true, message: 'تمت إضافة معاملة الكاش باك بنجاح.' };

    } catch (error) {
        console.error("Error adding cashback transaction:", error);
        return { success: false, message: 'فشل إضافة معاملة الكاش باك.' };
    }
}


// Withdrawal Management
export async function getWithdrawals(): Promise<Withdrawal[]> {
    await verifyAdmin();
    const withdrawalsSnapshot = await getDocs(query(collection(db, 'withdrawals'), orderBy('requestedAt', 'desc')));
    const withdrawals: Withdrawal[] = [];

    withdrawalsSnapshot.docs.forEach(doc => {
        try {
            const data = doc.data();
            withdrawals.push({
                id: doc.id,
                ...data,
                requestedAt: safeToDate(data.requestedAt) || new Date(),
                completedAt: safeToDate(data.completedAt),
                previousWithdrawalDetails: data.previousWithdrawalDetails || null,
            } as Withdrawal);
        } catch (error) {
            console.error(`Error processing withdrawal ${doc.id}:`, error);
        }
    });

    return withdrawals;
}

export async function requestWithdrawal(payload: Omit<Withdrawal, 'id' | 'requestedAt'>) {
    return runTransaction(db, async (transaction) => {
        const { getUserBalance } = await import('@/app/actions'); // Dynamically import to avoid circular dependency
        const balanceData = await getUserBalance(payload.userId);
        
        if (payload.amount > balanceData.availableBalance) {
            throw new Error("Insufficient available balance for this withdrawal.");
        }
        
        const newWithdrawalRef = doc(collection(db, "withdrawals"));
        transaction.set(newWithdrawalRef, {
            ...payload,
            requestedAt: serverTimestamp()
        });

        // Use the admin logger for this server-side action
        await adminLogUserActivity(payload.userId, 'withdrawal_request', { 
            deviceInfo: { device: 'Unknown', os: 'Unknown', browser: 'Unknown' },
            geoInfo: { ip: 'Not Collected' }
        }, {
            amount: payload.amount,
            method: payload.paymentMethod
        });
        
        return { success: true, message: 'Withdrawal request submitted successfully.' };
    }).catch(error => {
        console.error('Error requesting withdrawal:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        return { success: false, message: errorMessage };
    });
}

export async function approveWithdrawal(withdrawalId: string, txId: string) {
    await verifyAdmin();
    try {
        await runTransaction(db, async (transaction) => {
            const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
            const withdrawalSnap = await transaction.get(withdrawalRef);
            if (!withdrawalSnap.exists()) throw new Error("لم يتم العثور على طلب السحب");
            const withdrawalData = withdrawalSnap.data() as Withdrawal;

            transaction.update(withdrawalRef, {
                status: 'Completed',
                completedAt: serverTimestamp(),
                txId: txId,
                rejectionReason: "",
            });

            const message = `تم إكمال طلب السحب الخاص بك بمبلغ ${withdrawalData.amount.toFixed(2)}$.`;
            await createNotification(transaction, withdrawalData.userId, message, 'withdrawal', '/dashboard/withdraw');
        });

        return { success: true, message: 'تمت الموافقة على السحب بنجاح مع TXID.' };
    } catch (error) {
        console.error("Error approving withdrawal:", error);
        return { success: false, message: 'فشل الموافقة على السحب.' };
    }
}

export async function rejectWithdrawal(withdrawalId: string, reason: string) {
    await verifyAdmin();
     try {
        await runTransaction(db, async (transaction) => {
            const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
            const withdrawalSnap = await transaction.get(withdrawalRef);
            if (!withdrawalSnap.exists()) throw new Error("لم يتم العثور على طلب السحب");
            const withdrawalData = withdrawalSnap.data() as Withdrawal;

            if (!reason) throw new Error("سبب الرفض مطلوب.");

            transaction.update(withdrawalRef, { status: 'Failed', rejectionReason: reason });

            const message = `فشل طلب السحب الخاص بك بمبلغ ${withdrawalData.amount.toFixed(2)}$. السبب: ${reason}`;
            await createNotification(transaction, withdrawalData.userId, message, 'withdrawal', '/dashboard/withdraw');
        });

        return { success: true, message: `تم تحديث حالة السحب إلى "فشل".` };
    } catch (error) {
        console.error("Error rejecting withdrawal:", error);
        const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير معروف";
        return { success: false, message: `فشل رفض السحب: ${errorMessage}` };
    }
}

// Notification Actions
export async function getNotificationsForUser(userId: string): Promise<Notification[]> {
    const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);

    const notifications = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: safeToDate(data.createdAt) || new Date(),
        } as Notification;
    });

    // Perform sorting in-memory to avoid composite index
    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return notifications;
}

export async function markNotificationsAsRead(notificationIds: string[]) {
    const batch = writeBatch(db);
    notificationIds.forEach(id => {
        const docRef = doc(db, 'notifications', id);
        batch.update(docRef, { isRead: true });
    });
    await batch.commit();
}

export async function getAdminNotifications(): Promise<AdminNotification[]> {
    await verifyAdmin();
    const snapshot = await getDocs(query(collection(db, 'adminNotifications'), orderBy('createdAt', 'desc')));
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: safeToDate(data.createdAt) || new Date(),
        } as AdminNotification;
    });
}

export async function sendAdminNotification(
    message: string,
    target: 'all' | 'specific',
    userIds: string[]
): Promise<{ success: boolean; message: string }> {
    await verifyAdmin();
    try {
        // Log the admin notification itself
        const adminNotifRef = doc(collection(adminDb, 'adminNotifications'));
        await setDoc(adminNotifRef, {
            message,
            target,
            userIds,
            createdAt: serverTimestamp(),
        });

        // Create notifications for the targeted users
        let targetUsers: { id: string }[] = [];

        if (target === 'all') {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            targetUsers = usersSnapshot.docs.map(doc => ({ id: doc.id }));
        } else {
            targetUsers = userIds.map(id => ({ id }));
        }

        if (targetUsers.length === 0) {
            return { success: false, message: 'لم يتم تحديد مستخدمين مستهدفين.' };
        }

        await runTransaction(db, async (transaction) => {
            targetUsers.forEach(user => {
                const userNotifRef = doc(collection(db, 'notifications'));
                transaction.set(userNotifRef, {
                    userId: user.id,
                    message,
                    type: 'announcement',
                    isRead: false,
                    createdAt: serverTimestamp(),
                });
            });
        });


        return { success: true, message: `تم إرسال الإشعار إلى ${targetUsers.length} مستخدم.` };

    } catch (error) {
        console.error("Error sending admin notification:", error);
        return { success: false, message: 'فشل إرسال الإشعار.' };
    }
}


// Store Management - Categories
export async function getCategories(): Promise<ProductCategory[]> {
    const snapshot = await getDocs(query(collection(db, 'productCategories'), orderBy('name')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductCategory));
}

export async function addCategory(data: Omit<ProductCategory, 'id'>) {
    await verifyAdmin();
    try {
        await addDoc(collection(db, 'productCategories'), data);
        return { success: true, message: 'تمت إضافة الفئة بنجاح.' };
    } catch (error) {
        console.error("Error adding category:", error);
        return { success: false, message: 'فشل إضافة الفئة.' };
    }
}

export async function updateCategory(id: string, data: Partial<ProductCategory>) {
    await verifyAdmin();
    try {
        await updateDoc(doc(db, 'productCategories', id), data);
        return { success: true, message: 'تم تحديث الفئة بنجاح.' };
    } catch (error) {
        console.error("Error updating category:", error);
        return { success: false, message: 'فشل تحديث الفئة.' };
    }
}

export async function deleteCategory(id: string) {
    await verifyAdmin();
    try {
        // TODO: Check if any products use this category before deleting.
        await deleteDoc(doc(db, 'productCategories', id));
        return { success: true, message: 'تم حذف الفئة بنجاح.' };
    } catch (error) {
        console.error("Error deleting category:", error);
        return { success: false, message: 'فشل حذف الفئة.' };
    }
}

// Store Management - Products
export async function getProducts(): Promise<Product[]> {
    const snapshot = await getDocs(query(collection(db, 'products'), orderBy('name')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
}

export async function addProduct(data: Omit<Product, 'id'>) {
    await verifyAdmin();
    try {
        await addDoc(collection(db, 'products'), data);
        return { success: true, message: 'تمت إضافة المنتج بنجاح.' };
    } catch (error) {
        console.error("Error adding product:", error);
        return { success: false, message: 'فشل إضافة المنتج.' };
    }
}

export async function updateProduct(id: string, data: Partial<Product>) {
    await verifyAdmin();
    try {
        await updateDoc(doc(db, 'products', id), data);
        return { success: true, message: 'تم تحديث المنتج بنجاح.' };
    } catch (error) {
        console.error("Error updating product:", error);
        return { success: false, message: 'فشل تحديث المنتج.' };
    }
}

export async function deleteProduct(id: string) {
    await verifyAdmin();
    try {
        await deleteDoc(doc(db, 'products', id));
        return { success: true, message: 'تم حذف المنتج بنجاح.' };
    } catch (error) {
        console.error("Error deleting product:", error);
        return { success: false, message: 'فشل حذف المنتج.' };
    }
}


// Store Management - Orders
export async function getOrders(): Promise<Order[]> {
    await verifyAdmin();
    // This query is on the entire collection, so sorting is fine.
    const snapshot = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
    const orders: Order[] = [];
    snapshot.docs.forEach(doc => {
        try {
            const data = doc.data();
            orders.push({
                id: doc.id,
                ...data,
                createdAt: safeToDate(data.createdAt) || new Date(),
            } as Order);
        } catch(error) {
            console.error(`Error processing order ${doc.id}:`, error);
        }
    });
    return orders;
}

export async function updateOrderStatus(orderId: string, status: Order['status']) {
    await verifyAdmin();
    try {
        await runTransaction(db, async (transaction) => {
            const orderRef = doc(db, 'orders', orderId);
            const orderSnap = await transaction.get(orderRef);
            if (!orderSnap.exists()) {
                throw new Error("لم يتم العثور على الطلب.");
            }
            const orderData = orderSnap.data() as Order;

            // Prevent awarding commission multiple times
            if (status === 'Delivered' && !orderData.referralCommissionAwarded) {
                await awardReferralCommission(orderData.userId, 'store_purchase', orderData.price);
                transaction.update(orderRef, { status, referralCommissionAwarded: true });
            } else if (status === 'Cancelled' && orderData.referralCommissionAwarded) {
                // Clawback commission if order is cancelled after delivery
                await clawbackReferralCommission(transaction, orderData.userId, 'store_purchase', orderData.price);
                transaction.update(orderRef, { status, referralCommissionAwarded: false });
            } else {
                 transaction.update(orderRef, { status });
            }

            const message = `تم تحديث حالة طلبك لـ "${orderData.productName}" إلى ${status}.`;
            await createNotification(transaction, orderData.userId, message, 'store', '/dashboard/store/orders');
        });

        return { success: true, message: 'تم تحديث حالة الطلب.' };
    } catch (error) {
        console.error("Error updating order status:", error);
        const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير معروف";
        return { success: false, message: `فشل تحديث حالة الطلب: ${errorMessage}` };
    }
}

export async function placeOrder(
    userId: string,
    productId: string,
    formData: { userName: string; userEmail: string; deliveryPhoneNumber: string },
    clientInfo: { deviceInfo: DeviceInfo, geoInfo: GeoInfo }
) {
    let product: Product | null = null;
    const { getUserBalance } = await import('@/app/actions');

    return runTransaction(db, async (transaction) => {
        const productRef = doc(db, 'products', productId);
        const productSnap = await transaction.get(productRef);

        if (!productSnap.exists()) throw new Error("Product not found.");
        product = productSnap.data() as Product;

        const balanceData = await getUserBalance(userId);

        if (product.stock <= 0) throw new Error("This product is currently out of stock.");
        if (balanceData.availableBalance < product.price) throw new Error("You do not have enough available balance to purchase this item.");

        transaction.update(productRef, { stock: increment(-1) });

        const orderRef = doc(collection(db, 'orders'));
        transaction.set(orderRef, {
            userId,
            productId,
            productName: product.name,
            productImage: product.imageUrl,
            price: product.price,
            status: 'Pending',
            createdAt: serverTimestamp(),
            userName: formData.userName,
            userEmail: formData.userEmail,
            deliveryPhoneNumber: formData.deliveryPhoneNumber,
            referralCommissionAwarded: false,
        });

        await createNotification(transaction, userId, `تم تقديم طلبك لـ ${product.name}.`, 'store', '/dashboard/store/orders');
        
        await adminLogUserActivity(userId, 'store_purchase', clientInfo, { productId, price: product.price });
        
        return { success: true, message: 'تم تقديم الطلب بنجاح!' };
    }).catch(error => {
        console.error('Error placing order:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while placing your order.';
        return { success: false, message: errorMessage };
    });
}


// Admin: Payment Method Management
export async function getPaymentMethods(): Promise<PaymentMethod[]> {
    const snapshot = await getDocs(query(collection(db, 'paymentMethods'), orderBy('name')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentMethod));
}

export async function addPaymentMethod(data: Omit<PaymentMethod, 'id'>) {
    await verifyAdmin();
    try {
        await addDoc(collection(db, 'paymentMethods'), data);
        return { success: true, message: 'تمت إضافة طريقة الدفع بنجاح.' };
    } catch (error) {
        console.error("Error adding payment method:", error);
        return { success: false, message: 'فشل إضافة طريقة الدفع.' };
    }
}

export async function updatePaymentMethod(id: string, data: Partial<PaymentMethod>) {
    await verifyAdmin();
    try {
        await updateDoc(doc(db, 'paymentMethods', id), data);
        return { success: true, message: 'تم تحديث طريقة الدفع بنجاح.' };
    } catch (error) {
        console.error("Error updating payment method:", error);
        return { success: false, message: 'فشل تحديث طريقة الدفع.' };
    }
}

export async function deletePaymentMethod(id: string) {
    await verifyAdmin();
    try {
        await deleteDoc(doc(db, 'paymentMethods', id));
        return { success: true, message: 'تم حذف طريقة الدفع بنجاح.' };
    } catch (error) {
        console.error("Error deleting payment method:", error);
        return { success: false, message: 'فشل حذف طريقة الدفع.' };
    }
}

// Blog Post Management
function convertTimestamps(docData: admin.firestore.QueryDocumentSnapshot): BlogPost {
    const data = docData.data();
    return {
        id: docData.id,
        ...data,
        createdAt: safeToDate(data.createdAt) || new Date(),
        updatedAt: safeToDate(data.updatedAt) || new Date(),
    } as BlogPost;
}


// Get all posts (for admin view)
export async function getAllBlogPosts(): Promise<BlogPost[]> {
    await verifyAdmin();
    const snapshot = await adminDb.collection('blogPosts').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(convertTimestamps);
}

// Get all published posts (for public view)
export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
    const q = adminDb.collection('blogPosts').where('status', '==', 'published');
    const snapshot = await q.get();
    const posts = snapshot.docs.map(convertTimestamps);

    // Sort in-memory to avoid composite index
    posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return posts;
}

// Get a single post by its slug (for public view)
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    const q = adminDb.collection('blogPosts').where('slug', '==', slug).where('status', '==', 'published');
    const snapshot = await q.get();
    if (snapshot.empty) {
        return null;
    }
    return convertTimestamps(snapshot.docs[0]);
}

// Add a new blog post
export async function addBlogPost(data: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>) {
    await verifyAdmin();
    try {
        await addDoc(collection(db, 'blogPosts'), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return { success: true, message: 'تم إنشاء المقال بنجاح.' };
    } catch (error) {
        console.error("Error adding blog post:", error);
        return { success: false, message: 'فشل إنشاء المقال.' };
    }
}

// Update a blog post
export async function updateBlogPost(id: string, data: Partial<Omit<BlogPost, 'id' | 'createdAt'>>) {
    await verifyAdmin();
    try {
        const postRef = doc(db, 'blogPosts', id);
        await updateDoc(postRef, {
            ...data,
            updatedAt: serverTimestamp(),
        });
        return { success: true, message: 'تم تحديث المقال بنجاح.' };
    } catch (error) {
        console.error("Error updating blog post:", error);
        return { success: false, message: 'فشل تحديث المقال.' };
    }
}

// Delete a blog post
export async function deleteBlogPost(id: string) {
    await verifyAdmin();
    try {
        await deleteDoc(doc(db, 'blogPosts', id));
        return { success: true, message: 'تم حذف المقال بنجاح.' };
    } catch (error) {
        console.error("Error deleting blog post:", error);
        return { success: false, message: 'فشل حذف المقال.' };
    }
}

// CRM User Detail Fetcher
export async function getUserDetails(userId: string) {
    await verifyAdmin();
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            throw new Error("لم يتم العثور على المستخدم");
        }
        
        const userProfileData = userSnap.data();
        const userProfile: UserProfile = {
            uid: userSnap.id,
            ...userProfileData,
            createdAt: safeToDate(userProfileData.createdAt),
            kycData: userProfileData.kycData ? { ...userProfileData.kycData, submittedAt: safeToDate(userProfileData.kycData.submittedAt) } : undefined,
            addressData: userProfileData.addressData ? { ...userProfileData.addressData, submittedAt: safeToDate(userProfileData.addressData.submittedAt) } : undefined,
        } as UserProfile;


        const accountsQuery = query(collection(db, "tradingAccounts"), where("userId", "==", userId));
        const transactionsQuery = query(collection(db, "cashbackTransactions"), where("userId", "==", userId));
        const withdrawalsQuery = query(collection(db, "withdrawals"), where("userId", "==", userId));
        const ordersQuery = query(collection(db, "orders"), where("userId", "==", userId));
        
        const { getUserBalance } = await import('@/app/actions');

        const [
            balanceData,
            accountsSnapshot,
            transactionsSnapshot,
            withdrawalsSnapshot,
            ordersSnapshot
        ] = await Promise.all([
            getUserBalance(userId),
            getDocs(accountsQuery),
            getDocs(transactionsQuery),
            getDocs(withdrawalsQuery),
            getDocs(ordersQuery),
        ]);

        const tradingAccounts = accountsSnapshot.docs.map(doc => {
            const data = doc.data();
            return { id: doc.id, ...data, createdAt: safeToDate(data.createdAt) || new Date() } as TradingAccount;
        });

        const cashbackTransactions = transactionsSnapshot.docs.map(doc => {
            const data = doc.data();
            return { id: doc.id, ...data, date: safeToDate(data.date) || new Date() } as CashbackTransaction;
        }).sort((a, b) => b.date.getTime() - a.date.getTime());

        const withdrawals = withdrawalsSnapshot.docs.map(doc => {
            const data = doc.data();
            return { id: doc.id, ...data, requestedAt: safeToDate(data.requestedAt) || new Date(), completedAt: safeToDate(data.completedAt) } as Withdrawal;
        }).sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());

        const orders = ordersSnapshot.docs.map(doc => {
            const data = doc.data();
            return { id: doc.id, ...data, createdAt: safeToDate(data.createdAt) || new Date() } as Order;
        }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        // Fetch referrer name
        let referredByName = null;
        if (userProfile.referredBy) {
            const referrerSnap = await getDoc(doc(db, 'users', userProfile.referredBy));
            if (referrerSnap.exists()) {
                referredByName = referrerSnap.data().name;
            }
        }

        // Fetch names of referred users
        let referralsWithNames = [];
        if (userProfile.referrals && userProfile.referrals.length > 0) {
            const referralPromises = userProfile.referrals.map(uid => getDoc(doc(db, 'users', uid)));
            const referralSnaps = await Promise.all(referralPromises);
            referralsWithNames = referralSnaps
                .filter(snap => snap.exists())
                .map(snap => ({ uid: snap.id, name: snap.data()?.name || 'مستخدم غير معروف' }));
        }
        
        return {
            userProfile,
            balance: balanceData,
            tradingAccounts,
            cashbackTransactions,
            withdrawals,
            orders,
            referredByName,
            referralsWithNames,
        };
    } catch (error) {
        console.error("Error fetching user details:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { error: errorMessage };
    }
}

// Level System Management

export async function getClientLevels(): Promise<ClientLevel[]> {
    const levelsCollection = collection(db, 'clientLevels');
    const snapshot = await getDocs(levelsCollection);
    if (snapshot.empty) {
        return []; // Return empty array if no levels are seeded
    }
    const levelsArray = snapshot.docs.map(doc => ({
        id: parseInt(doc.id, 10),
        ...doc.data()
    } as ClientLevel));
    levelsArray.sort((a, b) => a.id - b.id);
    return levelsArray;
}

export async function updateClientLevels(levels: ClientLevel[]) {
    await verifyAdmin();
    try {
        const batch = writeBatch(db);
        levels.forEach(level => {
            const levelRef = doc(db, 'clientLevels', String(level.id));
            // The 'id' is the document ID, so we don't need to save it inside the document.
            const { id, ...levelData } = level;
            batch.set(levelRef, levelData);
        });
        await batch.commit();
        return { success: true, message: 'تم تحديث مستويات العملاء بنجاح.' };
    } catch (error) {
        console.error("Error updating client levels:", error);
        return { success: false, message: 'فشل تحديث مستويات العملاء.' };
    }
}

export async function seedClientLevels(): Promise<{ success: boolean; message: string; }> {
    await verifyAdmin();
    const levelsCollection = collection(db, 'clientLevels');
    const snapshot = await getDocs(levelsCollection);
    if (!snapshot.empty) {
        return { success: false, message: 'مستويات العملاء موجودة بالفعل.' };
    }

    const defaultLevels: Omit<ClientLevel, 'id'>[] = [
        { name: 'Bronze', required_total: 0, advantage_referral_cashback: 5, advantage_referral_store: 2, advantage_product_discount: 0 },
        { name: 'Silver', required_total: 100, advantage_referral_cashback: 7, advantage_referral_store: 4, advantage_product_discount: 2 },
        { name: 'Gold', required_total: 500, advantage_referral_cashback: 10, advantage_referral_store: 6, advantage_product_discount: 4 },
        { name: 'Platinum', required_total: 2000, advantage_referral_cashback: 15, advantage_referral_store: 8, advantage_product_discount: 6 },
        { name: 'Diamond', required_total: 10000, advantage_referral_cashback: 20, advantage_referral_store: 10, advantage_product_discount: 8 },
        { name: 'Ambassador', required_total: 50000, advantage_referral_cashback: 25, advantage_referral_store: 15, advantage_product_discount: 10 },
    ];

    try {
        const batch = writeBatch(db);
        defaultLevels.forEach((level, index) => {
            const levelId = String(index + 1);
            const docRef = doc(db, 'clientLevels', levelId);
            batch.set(docRef, level);
        });
        await batch.commit();
        return { success: true, message: 'تمت إضافة مستويات العملاء الافتراضية بنجاح.' };
    } catch (error) {
        console.error("Error seeding client levels:", error);
        return { success: false, message: 'فشل إضافة مستويات العملاء الافتراضية.' };
    }
}


// Feedback System
export async function getFeedbackForms(): Promise<FeedbackForm[]> {
    await verifyAdmin();
    const snapshot = await getDocs(query(collection(db, 'feedbackForms'), orderBy('createdAt', 'desc')));
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: safeToDate(data.createdAt) || new Date(),
        } as FeedbackForm;
    });
}

export async function addFeedbackForm(data: Omit<FeedbackForm, 'id' | 'createdAt' | 'responseCount'>) {
    await verifyAdmin();
    try {
        await addDoc(collection(db, 'feedbackForms'), {
            ...data,
            createdAt: serverTimestamp(),
            responseCount: 0,
        });
        return { success: true, message: 'تم إنشاء نموذج الملاحظات بنجاح.' };
    } catch (error) {
        console.error("Error adding feedback form:", error);
        return { success: false, message: 'فشل إنشاء النموذج.' };
    }
}

export async function updateFeedbackForm(id: string, data: Partial<Omit<FeedbackForm, 'id' | 'createdAt'>>) {
    await verifyAdmin();
    try {
        await updateDoc(doc(db, 'feedbackForms', id), data);
        return { success: true, message: 'تم تحديث النموذج بنجاح.' };
    } catch (error) {
        console.error("Error updating feedback form:", error);
        return { success: false, message: 'فشل تحديث النموذج.' };
    }
}

export async function deleteFeedbackForm(id: string) {
    await verifyAdmin();
    try {
        await deleteDoc(doc(db, 'feedbackForms', id));
        return { success: true, message: 'تم حذف النموذج بنجاح.' };
    } catch (error) {
        console.error("Error deleting feedback form:", error);
        return { success: false, message: 'فشل حذف النموذج.' };
    }
}

export async function getFeedbackFormById(formId: string): Promise<FeedbackForm | null> {
    await verifyAdmin();
    const docRef = doc(db, 'feedbackForms', formId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        return null;
    }
    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        createdAt: safeToDate(data.createdAt) || new Date(),
    } as FeedbackForm;
}

export async function getFeedbackResponses(formId: string): Promise<EnrichedFeedbackResponse[]> {
    await verifyAdmin();
    const responsesQuery = query(collection(db, 'feedbackResponses'), where('formId', '==', formId));
    const responsesSnap = await getDocs(responsesQuery);

    const responses = responsesSnap.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            submittedAt: safeToDate(data.submittedAt) || new Date(),
        } as FeedbackResponse;
    });

    const userIds = [...new Set(responses.map(r => r.userId))];
    if (userIds.length === 0) return [];

    const usersQuery = query(collection(db, 'users'), where(admin.firestore.FieldPath.documentId(), 'in', userIds));
    const usersSnap = await getDocs(usersQuery);
    const usersMap = new Map(usersSnap.docs.map(d => [d.id, d.data() as UserProfile]));

    return responses.map(response => ({
        ...response,
        userName: usersMap.get(response.userId)?.name || 'مستخدم غير معروف'
    }));
}


export async function submitFeedbackResponse(
    userId: string,
    formId: string,
    answers: Record<string, any>
): Promise<{ success: boolean, message: string }> {
    try {
        await runTransaction(db, async (transaction) => {
            const formRef = doc(db, 'feedbackForms', formId);
            const responseRef = doc(collection(db, 'feedbackResponses'));

            const responsePayload: Omit<FeedbackResponse, 'id'> = {
                formId,
                userId,
                submittedAt: new Date(),
                answers,
            };

            transaction.set(responseRef, { ...responsePayload, submittedAt: serverTimestamp()});
            transaction.update(formRef, { responseCount: increment(1) });
        });

        return { success: true, message: "شكرا لملاحظاتك!" };
    } catch (error) {
        console.error("Error submitting feedback:", error);
        return { success: false, message: "فشل إرسال الملاحظات." };
    }
}

export async function getUserActivityLogs(userId: string): Promise<ActivityLog[]> {
    await verifyAdmin();
    const q = query(
        collection(db, 'activityLogs'),
        where('userId', '==', userId),
    );
    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            timestamp: safeToDate(data.timestamp) || new Date(),
        } as ActivityLog
    });
    // Perform sorting in-memory to avoid composite index requirement
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return logs;
}

// Verification Actions
export async function getPendingVerifications(): Promise<PendingVerification[]> {
    await verifyAdmin();
    
    // Fetch all users using the admin SDK to have permission to see all documents.
    const allUsers = await getUsers();
    
    const results: PendingVerification[] = [];

    // Filter users in code, which is more reliable than a complex query.
    allUsers.forEach(user => {
        if (user.hasPendingKYC && user.kycData?.status === 'Pending') {
            results.push({
                userId: user.uid,
                userName: user.name,
                userEmail: user.email,
                type: 'KYC',
                data: user.kycData,
                requestedAt: user.kycData.submittedAt || new Date()
            });
        }
        
        if (user.hasPendingAddress && user.addressData?.status === 'Pending') {
             results.push({
                userId: user.uid,
                userName: user.name,
                userEmail: user.email,
                type: 'Address',
                data: user.addressData,
                requestedAt: user.addressData.submittedAt || new Date()
            });
        }
        
        if (user.hasPendingPhone && !user.phoneNumberVerified) {
            results.push({
                userId: user.uid,
                userName: user.name,
                userEmail: user.email,
                type: 'Phone',
                data: { phoneNumber: user.phoneNumber! },
                requestedAt: safeToDate(user.createdAt) || new Date()
            });
        }
    });

    return results.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
}

export async function updateVerificationStatus(
    userId: string,
    type: 'kyc' | 'address' | 'phone',
    status: 'Verified' | 'Rejected',
    rejectionReason?: string
) {
    await verifyAdmin();
    try {
        await adminDb.runTransaction(async (transaction) => {
            const userRef = adminDb.doc(`users/${userId}`);
            const updateData: Record<string, any> = {};
            let notificationMessage = '';
            const notificationType: Notification['type'] = 'account';

            const createAdminNotification = (
                message: string,
                link?: string
            ) => {
                const notifRef = adminDb.collection('notifications').doc();
                transaction.set(notifRef, {
                    userId,
                    message,
                    type: notificationType,
                    link,
                    isRead: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            };

            if (type === 'kyc') {
                updateData['kycData.status'] = status;
                updateData['hasPendingKYC'] = admin.firestore.FieldValue.delete();
                notificationMessage = `تم تحديث حالة التحقق من هويتك إلى: ${status}.`;
                if (status === 'Rejected' && rejectionReason) {
                    updateData['kycData.rejectionReason'] = rejectionReason;
                    notificationMessage += ` السبب: ${rejectionReason}`;
                }
            } else if (type === 'address') {
                updateData['addressData.status'] = status;
                updateData['hasPendingAddress'] = admin.firestore.FieldValue.delete();
                notificationMessage = `تم تحديث حالة التحقق من عنوانك إلى: ${status}.`;
                if (status === 'Rejected' && rejectionReason) {
                    updateData['addressData.rejectionReason'] = rejectionReason;
                    notificationMessage += ` السبب: ${rejectionReason}`;
                }
            } else if (type === 'phone') {
                updateData['phoneNumberVerified'] = status === 'Verified';
                updateData['hasPendingPhone'] = admin.firestore.FieldValue.delete();
                notificationMessage = status === 'Verified' ? 'تم التحقق من رقم هاتفك بنجاح.' : 'فشل التحقق من رقم هاتفك.';
            }

            transaction.update(userRef, updateData);
            createAdminNotification(notificationMessage, '/dashboard/settings/verification');
        });

        return { success: true, message: `تم تحديث حالة التحقق للمستخدم.` };
    } catch (error) {
        console.error("Error updating verification status:", error);
        return { success: false, message: 'فشل تحديث حالة التحقق.' };
    }
}
    
export async function adminUpdateKyc(userId: string, data: KycData) {
    await verifyAdmin();
    try {
        const userRef = adminDb.doc(`users/${userId}`);
        await userRef.update({ kycData: { ...data, submittedAt: data.submittedAt || serverTimestamp() } });
        return { success: true, message: "تم تحديث بيانات KYC للمستخدم." };
    } catch (error) {
        console.error("Error updating KYC by admin:", error);
        return { success: false, message: "فشل تحديث بيانات KYC." };
    }
}

export async function adminUpdateAddress(userId: string, data: AddressData) {
    await verifyAdmin();
    try {
        const userRef = adminDb.doc(`users/${userId}`);
        await userRef.update({ addressData: { ...data, submittedAt: data.submittedAt || serverTimestamp() } });
        return { success: true, message: "تم تحديث بيانات العنوان للمستخدم." };
    } catch (error) {
        console.error("Error updating address by admin:", error);
        return { success: false, message: "فشل تحديث بيانات العنوان." };
    }
}

export async function adminUpdatePhoneNumber(userId: string, phoneNumber: string) {
    await verifyAdmin();
    const userRef = adminDb.doc(`users/${userId}`);

    try {
        const parsedNumber = parsePhoneNumber(phoneNumber);
        if (!parsedNumber) {
            throw new Error('Invalid phone number format.');
        }
        
        const countryCode = parsedNumber.country;

        await userRef.update({
            phoneNumber: parsedNumber.number, // Store in E.164 format
            country: countryCode, // Update country code based on phone
            phoneNumberVerified: true, // Admin approval verifies it
            hasPendingPhone: admin.firestore.FieldValue.delete(),
        });

        return { success: true, message: "تم تحديث رقم الهاتف والتحقق منه." };
    } catch (error: any) {
        console.error("Error updating phone number by admin:", error);
        return { success: false, error: error.message };
    }
}

// User-level management functions (called from scripts/CLI)
export async function backfillUserStatuses(): Promise<{ success: boolean; message: string; }> {
    await verifyAdmin();
    try {
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const batch = writeBatch(db);
        let updatedCount = 0;

        for (const userDoc of usersSnapshot.docs) {
            const user = userDoc.data() as UserProfile;
            const userId = userDoc.id;

            if (user.status) { // Skip users who already have a status
                continue;
            }

            let newStatus: UserStatus = 'NEW';

            const cashbackQuery = query(collection(db, 'cashbackTransactions'), where('userId', '==', userId), limit(1));
            const cashbackSnap = await getDocs(cashbackQuery);

            if (!cashbackSnap.empty) {
                newStatus = 'Trader';
            } else {
                const accountsQuery = query(collection(db, 'tradingAccounts'), where('userId', '==', userId), where('status', '==', 'Approved'), limit(1));
                const accountsSnap = await getDocs(accountsQuery);
                if (!accountsSnap.empty) {
                    newStatus = 'Active';
                }
            }

            batch.update(userDoc.ref, { status: newStatus });
            updatedCount++;
        }

        if (updatedCount > 0) {
            await batch.commit();
            return { success: true, message: `Successfully updated ${updatedCount} users.` };
        } else {
            return { success: true, message: 'All users already have a status. No updates were needed.' };
        }
    } catch (error) {
        console.error("Error backfilling user statuses:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: `Failed to backfill statuses: ${errorMessage}` };
    }
}


export async function backfillUserLevels(): Promise<{ success: boolean; message: string; }> {
    await verifyAdmin();
    try {
        const levels = await getClientLevels();
        if (levels.length === 0) {
            return { success: false, message: "No client levels configured. Please seed them first." };
        }
        levels.sort((a, b) => b.required_total - a.required_total);
        const lowestLevel = levels[levels.length - 1];

        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ref: doc.ref, ...doc.data() } as UserProfile & { id: string, ref: any }));
        
        const monthStart = startOfMonth(new Date());
        const cashbackQuery = query(
            collection(db, 'cashbackTransactions'),
            where('date', '>=', monthStart)
        );
        const cashbackSnap = await getDocs(cashbackQuery);

        const monthlyEarningsMap = new Map<string, number>();
        cashbackSnap.forEach(doc => {
            const tx = doc.data();
            const currentEarnings = monthlyEarningsMap.get(tx.userId) || 0;
            monthlyEarningsMap.set(tx.userId, currentEarnings + tx.cashbackAmount);
        });

        const batch = writeBatch(db);
        let updatedCount = 0;

        for (const user of users) {
            const monthlyEarnings = monthlyEarningsMap.get(user.id) || 0;
            const newLevel = levels.find(level => monthlyEarnings >= level.required_total) || lowestLevel;
            
            batch.update(user.ref, { level: newLevel.id, monthlyEarnings: monthlyEarnings });
            updatedCount++;
        }

        if (updatedCount > 0) {
            await batch.commit();
            return { success: true, message: `Successfully updated ${updatedCount} users with calculated levels and earnings.` };
        } else {
            return { success: true, message: 'No users to update.' };
        }

    } catch (error) {
        console.error("Error backfilling user levels:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: `Failed to backfill levels: ${errorMessage}` };
    }
}

// Contact Settings
export async function getContactSettings(): Promise<ContactSettings> {
    await verifyAdmin();
    const docRef = doc(db, 'settings', 'contact');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as ContactSettings;
    }
    // Return default settings if not found
    return {
        email: 'support@example.com',
        phone: '+1 234 567 890',
        address: '123 Main Street, Anytown, USA',
        social: { facebook: '#', twitter: '#', instagram: '#', whatsapp: '#', telegram: '#' },
    };
}

export async function updateContactSettings(settings: ContactSettings) {
    await verifyAdmin();
    try {
        const docRef = doc(db, 'settings', 'contact');
        await setDoc(docRef, settings, { merge: true });
        return { success: true, message: 'تم تحديث إعدادات الاتصال بنجاح.' };
    } catch (error) {
        console.error("Error updating contact settings:", error);
        return { success: false, message: 'فشل تحديث إعدادات الاتصال.' };
    }
}
    

