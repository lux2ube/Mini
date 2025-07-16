
'use server';

import { db } from '@/lib/firebase/config';
import { collection, doc, getDocs, updateDoc, addDoc, serverTimestamp, query, where, Timestamp, orderBy, writeBatch, deleteDoc, getDoc, setDoc, runTransaction } from 'firebase/firestore';
import type { TradingAccount, UserProfile, Withdrawal, CashbackTransaction, Broker, BannerSettings, Notification, ProductCategory, Product, Order } from '@/types';

// Generic function to create a notification
async function createNotification(userId: string, message: string, type: 'account' | 'cashback' | 'withdrawal' | 'general' | 'store', link?: string) {
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
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { status });

        // Optional: Notify user
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
            const orderData = orderSnap.data() as Order;
            const message = `The status of your order for "${orderData.productName}" has been updated to ${status}.`;
            await createNotification(orderData.userId, message, 'store', '/dashboard/store/orders');
        }

        return { success: true, message: 'Order status updated.' };
    } catch (error) {
        console.error("Error updating order status:", error);
        return { success: false, message: 'Failed to update order status.' };
    }
}

export async function placeOrder(userId: string, productId: string, phoneNumber: string) {
    try {
        return await runTransaction(db, async (transaction) => {
            const productRef = doc(db, 'products', productId);
            const productSnap = await transaction.get(productRef);

            if (!productSnap.exists()) {
                throw new Error("Product not found.");
            }

            const product = productSnap.data() as Product;
            const price = product.price;

            if (product.stock <= 0) {
                return { success: false, message: 'This item is out of stock.' };
            }

            // Calculate current balance
            const transactionsQuery = query(collection(db, 'cashbackTransactions'), where('userId', '==', userId));
            const transactionsSnap = await getDocs(transactionsQuery);
            const totalEarned = transactionsSnap.docs.reduce((sum, doc) => sum + doc.data().cashbackAmount, 0);

            const withdrawalsQuery = query(collection(db, 'withdrawals'), where('userId', '==', userId));
            const withdrawalsSnap = await getDocs(withdrawalsQuery);
            const totalWithdrawn = withdrawalsSnap.docs
                .filter(doc => doc.data().status === 'Completed' || doc.data().status === 'Processing')
                .reduce((sum, doc) => sum + doc.data().amount, 0);
            
            const ordersQuery = query(collection(db, 'orders'), where('userId', '==', userId), where('status', '!=', 'Cancelled'));
            const ordersSnap = await getDocs(ordersQuery);
            const totalSpent = ordersSnap.docs.reduce((sum, doc) => sum + doc.data().price, 0);

            const balance = totalEarned - totalWithdrawn - totalSpent;
            
            if (balance < price) {
                return { success: false, message: 'Insufficient balance to purchase this item.' };
            }

            // Decrement stock and create order
            transaction.update(productRef, { stock: product.stock - 1 });

            const userRef = doc(db, 'users', userId);
            const userSnap = await transaction.get(userRef);
            const userData = userSnap.data();

            const orderRef = doc(collection(db, 'orders'));
            transaction.set(orderRef, {
                userId,
                productId,
                productName: product.name,
                productImage: product.imageUrl,
                price,
                deliveryPhoneNumber: phoneNumber,
                status: 'Pending',
                createdAt: serverTimestamp(),
                userName: userData?.name || 'N/A',
                userEmail: userData?.email || 'N/A',
            });

            await createNotification(userId, `Your order for ${product.name} has been placed.`, 'store', '/dashboard/store/orders');
            
            return { success: true, message: 'Order placed successfully!' };
        });
    } catch (error) {
        console.error('Error placing order:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        return { success: false, message: errorMessage };
    }
}
