

'use server';

import { db } from '@/lib/firebase/config';
import { collection, doc, getDocs, updateDoc, addDoc, serverTimestamp, query, where, Timestamp, orderBy, writeBatch, deleteDoc, getDoc, setDoc, runTransaction } from 'firebase/firestore';
import type { TradingAccount, UserProfile, Withdrawal, CashbackTransaction, Broker, BannerSettings, Notification, ProductCategory, Product, Order, PaymentMethod, UserPaymentMethod } from '@/types';

// Generic function to create a notification
async function createNotification(
    transaction: any, // Can be a transaction or the db instance
    userId: string, 
    message: string, 
    type: 'account' | 'cashback' | 'withdrawal' | 'general' | 'store', 
    link?: string
) {
    // We use a transaction to create the notification if one is provided
    const notificationsCollection = collection(db, 'notifications');
    const newNotifRef = doc(notificationsCollection); // Generate a new doc ref
    transaction.set(newNotifRef, {
        userId,
        message,
        type,
        link,
        isRead: false,
        createdAt: serverTimestamp(),
    });
}


// Balance Calculation
export async function getUserBalance(userId: string) {
    const transactionsQuery = query(collection(db, 'cashbackTransactions'), where('userId', '==', userId));
    const withdrawalsQuery = query(collection(db, 'withdrawals'), where('userId', '==', userId));
    const ordersQuery = query(collection(db, 'orders'), where('userId', '==', userId));

    const [transactionsSnap, withdrawalsSnap, ordersSnap] = await Promise.all([
        getDocs(transactionsQuery),
        getDocs(withdrawalsQuery),
        getDocs(ordersQuery)
    ]);

    const totalEarned = transactionsSnap.docs.reduce((sum, doc) => sum + doc.data().cashbackAmount, 0);
    
    let pendingWithdrawals = 0;
    let completedWithdrawals = 0;
    withdrawalsSnap.docs.forEach(doc => {
        const withdrawal = doc.data() as Withdrawal;
        if (withdrawal.status === 'Processing') {
            pendingWithdrawals += withdrawal.amount;
        } else if (withdrawal.status === 'Completed') {
            completedWithdrawals += withdrawal.amount;
        }
    });

    const totalSpentOnOrders = ordersSnap.docs
        .filter(doc => doc.data().status !== 'Cancelled')
        .reduce((sum, doc) => sum + doc.data().price, 0);
    
    const availableBalance = totalEarned - completedWithdrawals - pendingWithdrawals - totalSpentOnOrders;

    return {
        availableBalance: Number(availableBalance.toFixed(2)),
        totalEarned: Number(totalEarned.toFixed(2)),
        pendingWithdrawals: Number(pendingWithdrawals.toFixed(2)),
        completedWithdrawals: Number(completedWithdrawals.toFixed(2)),
        totalSpentOnOrders: Number(totalSpentOnOrders.toFixed(2)),
    };
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
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    } as TradingAccount
  });
}

export async function updateTradingAccountStatus(accountId: string, status: 'Approved' | 'Rejected') {
  try {
    const accountRef = doc(db, 'tradingAccounts', accountId);
    
    // Use a transaction to ensure atomicity
    await runTransaction(db, async (transaction) => {
        const accountSnap = await transaction.get(accountRef);
        if (!accountSnap.exists()) throw new Error("Account not found");
        const accountData = accountSnap.data() as TradingAccount;

        transaction.update(accountRef, { status });

        const message = `Your trading account ${accountData.accountNumber} has been ${status.toLowerCase()}.`;
        await createNotification(transaction, accountData.userId, message, 'account', '/dashboard/my-accounts');
    });

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
        await runTransaction(db, async (transaction) => {
            const newTransactionRef = doc(collection(db, 'cashbackTransactions'));
            transaction.set(newTransactionRef, {
                ...data,
                date: serverTimestamp(),
            });

            const message = `You received $${data.cashbackAmount.toFixed(2)} cashback for account ${data.accountNumber}.`;
            await createNotification(transaction, data.userId, message, 'cashback', '/dashboard/transactions');
        });

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
            requestedAt: data.requestedAt instanceof Timestamp ? data.requestedAt.toDate() : new Date(),
            completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : undefined,
        } as Withdrawal
    });
    return withdrawals;
}

export async function approveWithdrawal(withdrawalId: string, txId: string) {
    try {
        const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
        
        await runTransaction(db, async (transaction) => {
            const withdrawalSnap = await transaction.get(withdrawalRef);
            if (!withdrawalSnap.exists()) throw new Error("Withdrawal not found");
            const withdrawalData = withdrawalSnap.data() as Withdrawal;

            transaction.update(withdrawalRef, {
                status: 'Completed',
                completedAt: serverTimestamp(),
                txId: txId,
            });

            const message = `Your withdrawal of $${withdrawalData.amount.toFixed(2)} has been completed.`;
            await createNotification(transaction, withdrawalData.userId, message, 'withdrawal', '/dashboard/withdraw');
        });

        return { success: true, message: 'Withdrawal approved successfully with TXID.' };
    } catch (error) {
        console.error("Error approving withdrawal:", error);
        return { success: false, message: 'Failed to approve withdrawal.' };
    }
}

export async function rejectWithdrawal(withdrawalId: string) {
     try {
        const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
        
        await runTransaction(db, async (transaction) => {
            const withdrawalSnap = await transaction.get(withdrawalRef);
            if (!withdrawalSnap.exists()) throw new Error("Withdrawal not found");
            const withdrawalData = withdrawalSnap.data() as Withdrawal;

            transaction.update(withdrawalRef, { status: 'Failed' });

            const message = `Your withdrawal of $${withdrawalData.amount.toFixed(2)} has failed. Please contact support.`;
            await createNotification(transaction, withdrawalData.userId, message, 'withdrawal', '/dashboard/withdraw');
        });

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
        where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);

    const notifications = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: (data.createdAt as Timestamp).toDate(),
        } as Notification;
    });

    // Perform sorting in-memory to avoid composite index requirement
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


// Store Management - Categories
export async function getCategories(): Promise<ProductCategory[]> {
    const snapshot = await getDocs(query(collection(db, 'productCategories'), orderBy('name')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductCategory));
}

export async function addCategory(data: Omit<ProductCategory, 'id'>) {
    try {
        await addDoc(collection(db, 'productCategories'), data);
        return { success: true, message: 'Category added successfully.' };
    } catch (error) {
        console.error("Error adding category:", error);
        return { success: false, message: 'Failed to add category.' };
    }
}

export async function updateCategory(id: string, data: Partial<ProductCategory>) {
    try {
        await updateDoc(doc(db, 'productCategories', id), data);
        return { success: true, message: 'Category updated successfully.' };
    } catch (error) {
        console.error("Error updating category:", error);
        return { success: false, message: 'Failed to update category.' };
    }
}

export async function deleteCategory(id: string) {
    try {
        // TODO: Check if any products use this category before deleting.
        await deleteDoc(doc(db, 'productCategories', id));
        return { success: true, message: 'Category deleted successfully.' };
    } catch (error) {
        console.error("Error deleting category:", error);
        return { success: false, message: 'Failed to delete category.' };
    }
}

// Store Management - Products
export async function getProducts(): Promise<Product[]> {
    const snapshot = await getDocs(query(collection(db, 'products'), orderBy('name')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
}

export async function addProduct(data: Omit<Product, 'id'>) {
    try {
        await addDoc(collection(db, 'products'), data);
        return { success: true, message: 'Product added successfully.' };
    } catch (error) {
        console.error("Error adding product:", error);
        return { success: false, message: 'Failed to add product.' };
    }
}

export async function updateProduct(id: string, data: Partial<Product>) {
    try {
        await updateDoc(doc(db, 'products', id), data);
        return { success: true, message: 'Product updated successfully.' };
    } catch (error) {
        console.error("Error updating product:", error);
        return { success: false, message: 'Failed to update product.' };
    }
}

export async function deleteProduct(id: string) {
    try {
        await deleteDoc(doc(db, 'products', id));
        return { success: true, message: 'Product deleted successfully.' };
    } catch (error) {
        console.error("Error deleting product:", error);
        return { success: false, message: 'Failed to delete product.' };
    }
}


// Store Management - Orders
export async function getOrders(): Promise<Order[]> {
    // This query is on the entire collection, so sorting is fine.
    const snapshot = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: (data.createdAt as Timestamp).toDate(),
        } as Order;
    });
}

export async function updateOrderStatus(orderId: string, status: Order['status']) {
    try {
        await runTransaction(db, async (transaction) => {
            // --- ALL READS MUST HAPPEN FIRST ---
            const orderRef = doc(db, 'orders', orderId);
            const orderSnap = await transaction.get(orderRef);
            if (!orderSnap.exists()) {
                throw new Error("Order not found.");
            }
            const orderData = orderSnap.data() as Order;

            // --- ALL WRITES HAPPEN LAST ---
            // 1. Update the order status
            transaction.update(orderRef, { status });

            // 2. Create a notification for the user
            const message = `The status of your order for "${orderData.productName}" has been updated to ${status}.`;
            await createNotification(transaction, orderData.userId, message, 'store', '/dashboard/store/orders');
        });

        return { success: true, message: 'Order status updated.' };
    } catch (error) {
        console.error("Error updating order status:", error);
        return { success: false, message: 'Failed to update order status.' };
    }
}

export async function placeOrder(userId: string, productId: string, phoneNumber: string) {
    try {
        return await runTransaction(db, async (transaction) => {
            // --- ALL READS MUST HAPPEN FIRST ---
            const productRef = doc(db, 'products', productId);
            const userRef = doc(db, 'users', userId);
            
            const productSnap = await transaction.get(productRef);
            const userSnap = await transaction.get(userRef);

            if (!productSnap.exists()) throw new Error("Product not found.");
            if (!userSnap.exists()) throw new Error("User not found.");
            
            const product = productSnap.data() as Product;
            const userData = userSnap.data();

            // Perform balance check within transaction for consistency
            const transactionsQuery = query(collection(db, 'cashbackTransactions'), where('userId', '==', userId));
            const withdrawalsQuery = query(collection(db, 'withdrawals'), where('userId', '==', userId));
            const ordersQuery = query(collection(db, 'orders'), where('userId', '==', userId));

            const [transactionsSnap, withdrawalsSnap, ordersSnap] = await Promise.all([
                transaction.get(transactionsQuery),
                transaction.get(withdrawalsQuery),
                transaction.get(ordersQuery)
            ]);

            const totalEarned = transactionsSnap.docs.reduce((sum, doc) => sum + doc.data().cashbackAmount, 0);
            let pendingWithdrawals = 0;
            let completedWithdrawals = 0;
            withdrawalsSnap.docs.forEach(doc => {
                const withdrawal = doc.data() as Withdrawal;
                if (withdrawal.status === 'Processing') {
                    pendingWithdrawals += withdrawal.amount;
                } else if (withdrawal.status === 'Completed') {
                    completedWithdrawals += withdrawal.amount;
                }
            });
            const totalSpentOnOrders = ordersSnap.docs
                .filter(doc => doc.data().status !== 'Cancelled')
                .reduce((sum, doc) => sum + doc.data().price, 0);
            
            const availableBalance = totalEarned - completedWithdrawals - pendingWithdrawals - totalSpentOnOrders;


            // --- VALIDATION AND LOGIC ---
            if (product.stock <= 0) {
                return { success: false, message: 'This item is out of stock.' };
            }
            if (availableBalance < product.price) {
                return { success: false, message: 'Insufficient balance to purchase this item.' };
            }

            // --- ALL WRITES HAPPEN LAST ---
            // 1. Decrement stock
            transaction.update(productRef, { stock: product.stock - 1 });

            // 2. Create order
            const orderRef = doc(collection(db, 'orders'));
            transaction.set(orderRef, {
                userId,
                productId,
                productName: product.name,
                productImage: product.imageUrl,
                price: product.price,
                deliveryPhoneNumber: phoneNumber,
                status: 'Pending',
                createdAt: serverTimestamp(),
                userName: userData?.name || 'N/A',
                userEmail: userData?.email || 'N/A',
            });

            // 3. Create notification
            await createNotification(transaction, userId, `Your order for ${product.name} has been placed.`, 'store', '/dashboard/store/orders');
            
            return { success: true, message: 'Order placed successfully!' };
        });
    } catch (error) {
        console.error('Error placing order:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        return { success: false, message: errorMessage };
    }
}

// Admin: Payment Method Management
export async function getPaymentMethods(): Promise<PaymentMethod[]> {
    const snapshot = await getDocs(query(collection(db, 'paymentMethods'), orderBy('name')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentMethod));
}

export async function addPaymentMethod(data: Omit<PaymentMethod, 'id'>) {
    try {
        await addDoc(collection(db, 'paymentMethods'), data);
        return { success: true, message: 'Payment method added successfully.' };
    } catch (error) {
        console.error("Error adding payment method:", error);
        return { success: false, message: 'Failed to add payment method.' };
    }
}

export async function updatePaymentMethod(id: string, data: Partial<PaymentMethod>) {
    try {
        await updateDoc(doc(db, 'paymentMethods', id), data);
        return { success: true, message: 'Payment method updated successfully.' };
    } catch (error) {
        console.error("Error updating payment method:", error);
        return { success: false, message: 'Failed to update payment method.' };
    }
}

export async function deletePaymentMethod(id: string) {
    try {
        await deleteDoc(doc(db, 'paymentMethods', id));
        return { success: true, message: 'Payment method deleted successfully.' };
    } catch (error) {
        console.error("Error deleting payment method:", error);
        return { success: false, message: 'Failed to delete payment method.' };
    }
}

// User: Payment Method Management
export async function getUserPaymentMethods(userId: string): Promise<UserPaymentMethod[]> {
    const q = query(collection(db, 'userPaymentMethods'), where('userId', '==', userId));
    const snapshot = await getDocs(q);

    const methods = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: (data.createdAt as Timestamp).toDate(),
        } as UserPaymentMethod
    });
    
    // Perform sorting in-memory to avoid composite index
    methods.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return methods;
}

export async function addUserPaymentMethod(data: Omit<UserPaymentMethod, 'id' | 'createdAt'>) {
    try {
        await addDoc(collection(db, 'userPaymentMethods'), {
            ...data,
            createdAt: serverTimestamp(),
        });
        return { success: true, message: 'Payment method saved.' };
    } catch (error) {
        console.error("Error adding user payment method:", error);
        return { success: false, message: 'Failed to save payment method.' };
    }
}

export async function deleteUserPaymentMethod(id: string) {
    try {
        await deleteDoc(doc(db, 'userPaymentMethods', id));
        return { success: true, message: 'Payment method deleted.' };
    } catch (error) {
        console.error("Error deleting user payment method:", error);
        return { success: false, message: 'Failed to delete payment method.' };
    }
}
