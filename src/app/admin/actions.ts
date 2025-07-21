
'use server';

import { db } from '@/lib/firebase/config';
import { collection, doc, getDocs, updateDoc, addDoc, serverTimestamp, query, where, Timestamp, orderBy, writeBatch, deleteDoc, getDoc, setDoc, runTransaction } from 'firebase/firestore';
import type { ActivityLog, BannerSettings, BlogPost, Broker, CashbackTransaction, DeviceInfo, Notification, Order, PaymentMethod, ProductCategory, Product, TradingAccount, UserProfile, Withdrawal, GeoInfo } from '@/types';
import { headers } from 'next/headers';

// Activity Logging
export async function logUserActivity(
    userId: string, 
    event: ActivityLog['event'], 
    clientInfo: { deviceInfo: DeviceInfo, geoInfo: GeoInfo },
    details?: Record<string, any>,
) {
    try {
        const headersList = headers();
        const userAgent = headersList.get('user-agent') ?? 'unknown';

        const logEntry: Omit<ActivityLog, 'id'> = {
            userId,
            event,
            timestamp: new Date(),
            ipAddress: clientInfo.geoInfo.ip || 'unknown',
            userAgent,
            device: clientInfo.deviceInfo,
            details,
        };
        await addDoc(collection(db, 'activityLogs'), logEntry);
    } catch (error) {
        console.error(`Failed to log activity for event ${event}:`, error);
        // We don't want to block the user's action if logging fails
    }
}

export async function getActivityLogs(): Promise<ActivityLog[]> {
    const logsSnapshot = await getDocs(query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc')));
    return logsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            timestamp: (data.timestamp as Timestamp).toDate(),
        } as ActivityLog
    });
}

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

export async function updateBroker(brokerId: string, data: Partial<Omit<Broker, 'id'>>) {
    try {
        const brokerRef = doc(db, 'brokers', brokerId);
        await updateDoc(brokerRef, data);
        return { success: true, message: 'تم تحديث الوسيط بنجاح.' };
    } catch (error) {
        console.error("Error updating broker:", error);
        return { success: false, message: 'فشل تحديث الوسيط.' };
    }
}

export async function deleteBroker(brokerId: string) {
    try {
        await deleteDoc(doc(db, 'brokers', brokerId));
        return { success: true, message: 'تم حذف الوسيط بنجاح.' };
    } catch (error) {
        console.error("Error deleting broker:", error);
        return { success: false, message: 'فشل حذف الوسيط.' };
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
        return { success: true, message: 'تم تحديث ترتيب الوسطاء.' };
    } catch (error) {
        console.error("Error updating broker order:", error);
        return { success: false, message: 'فشل تحديث ترتيب الوسطاء.' };
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

export async function updateTradingAccountStatus(accountId: string, status: 'Approved' | 'Rejected', reason?: string) {
  try {
    const accountRef = doc(db, 'tradingAccounts', accountId);
    
    await runTransaction(db, async (transaction) => {
        const accountSnap = await transaction.get(accountRef);
        if (!accountSnap.exists()) throw new Error("لم يتم العثور على الحساب");
        const accountData = accountSnap.data() as TradingAccount;

        const updateData: { status: 'Approved' | 'Rejected', rejectionReason?: string } = { status };
        let message = `تم ${status === 'Approved' ? 'الموافقة على' : 'رفض'} حساب التداول الخاص بك ${accountData.accountNumber}.`;

        if (status === 'Rejected') {
            if (!reason) throw new Error("سبب الرفض مطلوب.");
            updateData.rejectionReason = reason;
            message += ` السبب: ${reason}`;
        } else {
             updateData.rejectionReason = ""; // Clear reason on approval
        }

        transaction.update(accountRef, updateData);
        await createNotification(transaction, accountData.userId, message, 'account', '/dashboard/my-accounts');
    });

    return { success: true, message: `تم تحديث حالة الحساب إلى ${status}.` };
  } catch (error) {
    console.error("Error updating account status:", error);
    const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير معروف";
    return { success: false, message: `فشل تحديث حالة الحساب: ${errorMessage}` };
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

export async function updateUser(userId: string, data: { name: string }) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { name: data.name });
        return { success: true, message: 'تم تحديث الملف الشخصي بنجاح.' };
    } catch (error) {
        console.error("Error updating user profile:", error);
        const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير معروف.';
        return { success: false, message: `فشل تحديث الملف الشخصي: ${errorMessage}` };
    }
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

            const message = `لقد تلقيت ${data.cashbackAmount.toFixed(2)}$ كاش باك للحساب ${data.accountNumber}.`;
            await createNotification(transaction, data.userId, message, 'cashback', '/dashboard/transactions');
        });

        return { success: true, message: 'تمت إضافة معاملة الكاش باك بنجاح.' };
    } catch (error) {
        console.error("Error adding cashback transaction:", error);
        return { success: false, message: 'فشل إضافة معاملة الكاش باك.' };
    }
}


// Withdrawal Management
export async function getWithdrawals(): Promise<Withdrawal[]> {
    const withdrawalsSnapshot = await getDocs(query(collection(db, 'withdrawals')));
    const allUsersSnapshot = await getDocs(collection(db, 'users'));
    const allWithdrawalsSnapshot = await getDocs(query(collection(db, 'withdrawals'), orderBy('requestedAt', 'desc')));

    const allUsers = allUsersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as UserProfile }));
    const allWithdrawals = allWithdrawalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Withdrawal }));

    const withdrawals = withdrawalsSnapshot.docs.map(doc => {
        const data = doc.data() as Withdrawal;

        // Find the most recent *completed* withdrawal for this user and payment method type,
        // excluding the current withdrawal itself.
        const previousWithdrawal = allWithdrawals.find(w => 
            w.userId === data.userId && 
            w.paymentMethod === data.paymentMethod && 
            w.status === 'Completed' &&
            w.id !== doc.id
        );

        return {
            id: doc.id,
            ...data,
            requestedAt: (data.requestedAt as Timestamp).toDate(),
            completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : undefined,
            previousWithdrawalDetails: previousWithdrawal?.withdrawalDetails ?? null,
        } as Withdrawal;
    });

    withdrawals.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
    return withdrawals;
}

export async function approveWithdrawal(withdrawalId: string, txId: string) {
    try {
        const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
        
        await runTransaction(db, async (transaction) => {
            const withdrawalSnap = await transaction.get(withdrawalRef);
            if (!withdrawalSnap.exists()) throw new Error("لم يتم العثور على طلب السحب");
            const withdrawalData = withdrawalSnap.data() as Withdrawal;

            transaction.update(withdrawalRef, {
                status: 'Completed',
                completedAt: serverTimestamp(),
                txId: txId,
                rejectionReason: "", // Clear reason on approval
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
     try {
        const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
        
        await runTransaction(db, async (transaction) => {
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
        return { success: true, message: 'تمت إضافة الفئة بنجاح.' };
    } catch (error) {
        console.error("Error adding category:", error);
        return { success: false, message: 'فشل إضافة الفئة.' };
    }
}

export async function updateCategory(id: string, data: Partial<ProductCategory>) {
    try {
        await updateDoc(doc(db, 'productCategories', id), data);
        return { success: true, message: 'تم تحديث الفئة بنجاح.' };
    } catch (error) {
        console.error("Error updating category:", error);
        return { success: false, message: 'فشل تحديث الفئة.' };
    }
}

export async function deleteCategory(id: string) {
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
    try {
        await addDoc(collection(db, 'products'), data);
        return { success: true, message: 'تمت إضافة المنتج بنجاح.' };
    } catch (error) {
        console.error("Error adding product:", error);
        return { success: false, message: 'فشل إضافة المنتج.' };
    }
}

export async function updateProduct(id: string, data: Partial<Product>) {
    try {
        await updateDoc(doc(db, 'products', id), data);
        return { success: true, message: 'تم تحديث المنتج بنجاح.' };
    } catch (error) {
        console.error("Error updating product:", error);
        return { success: false, message: 'فشل تحديث المنتج.' };
    }
}

export async function deleteProduct(id: string) {
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
                throw new Error("لم يتم العثور على الطلب.");
            }
            const orderData = orderSnap.data() as Order;

            // --- ALL WRITES HAPPEN LAST ---
            // 1. Update the order status
            transaction.update(orderRef, { status });

            // 2. Create a notification for the user
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
    formData: { userName: string; userEmail: string; deliveryPhoneNumber: string }
) {
    try {
        return await runTransaction(db, async (transaction) => {
            // --- READS ---
            const productRef = doc(db, 'products', productId);
            const productSnap = await transaction.get(productRef);

            if (!productSnap.exists()) throw new Error("Product not found.");
            const product = productSnap.data() as Product;

            // Balance check
            const { availableBalance } = await getUserBalance(userId);

            // --- VALIDATION & LOGIC ---
            if (product.stock <= 0) {
                throw new Error("This product is currently out of stock.");
            }
            if (availableBalance < product.price) {
                throw new Error("You do not have enough available balance to purchase this item.");
            }

            // --- WRITES ---
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
                status: 'Pending',
                createdAt: serverTimestamp(),
                userName: formData.userName, // Use form data
                userEmail: formData.userEmail, // Use form data
                deliveryPhoneNumber: formData.deliveryPhoneNumber, // Use form data
            });

            // 3. Create notification
            await createNotification(transaction, userId, `تم تقديم طلبك لـ ${product.name}.`, 'store', '/dashboard/store/orders');
            
            // 4. Log the activity
            const headersList = headers();
            const ip = headersList.get('x-forwarded-for') ?? 'unknown';
            await logUserActivity(userId, 'store_purchase', {
                 deviceInfo: { device: 'Unknown', os: 'Unknown', browser: 'Unknown' },
                 geoInfo: { ip }
            }, { productId: productId, price: product.price });


            return { success: true, message: 'تم تقديم الطلب بنجاح!' };
        });
    } catch (error) {
        console.error('Error placing order:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while placing your order.';
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
        return { success: true, message: 'تمت إضافة طريقة الدفع بنجاح.' };
    } catch (error) {
        console.error("Error adding payment method:", error);
        return { success: false, message: 'فشل إضافة طريقة الدفع.' };
    }
}

export async function updatePaymentMethod(id: string, data: Partial<PaymentMethod>) {
    try {
        await updateDoc(doc(db, 'paymentMethods', id), data);
        return { success: true, message: 'تم تحديث طريقة الدفع بنجاح.' };
    } catch (error) {
        console.error("Error updating payment method:", error);
        return { success: false, message: 'فشل تحديث طريقة الدفع.' };
    }
}

export async function deletePaymentMethod(id: string) {
    try {
        await deleteDoc(doc(db, 'paymentMethods', id));
        return { success: true, message: 'تم حذف طريقة الدفع بنجاح.' };
    } catch (error) {
        console.error("Error deleting payment method:", error);
        return { success: false, message: 'فشل حذف طريقة الدفع.' };
    }
}

// Blog Post Management
function convertTimestamps(docData: any) {
    const data = docData.data();
    return {
        id: docData.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate(),
    } as BlogPost;
}


// Get all posts (for admin view)
export async function getAllBlogPosts(): Promise<BlogPost[]> {
    const snapshot = await getDocs(query(collection(db, 'blogPosts'), orderBy('createdAt', 'desc')));
    return snapshot.docs.map(convertTimestamps);
}

// Get all published posts (for public view)
export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
    const q = query(
        collection(db, 'blogPosts'), 
        where('status', '==', 'published')
    );
    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map(convertTimestamps);

    // Sort in-memory to avoid composite index
    posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return posts;
}

// Get a single post by its slug (for public view)
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    const q = query(
        collection(db, 'blogPosts'), 
        where('slug', '==', slug), 
        where('status', '==', 'published')
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    return convertTimestamps(snapshot.docs[0]);
}

// Add a new blog post
export async function addBlogPost(data: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>) {
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
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            throw new Error("لم يتم العثور على المستخدم");
        }
        
        const userProfile = { uid: userSnap.id, ...userSnap.data() } as UserProfile;
        if(userProfile.createdAt && userProfile.createdAt instanceof Timestamp) {
            userProfile.createdAt = userProfile.createdAt.toDate();
        }

        const accountsQuery = query(collection(db, "tradingAccounts"), where("userId", "==", userId));
        const transactionsQuery = query(collection(db, "cashbackTransactions"), where("userId", "==", userId));
        
        const [
            balanceData,
            accountsSnapshot,
            transactionsSnapshot
        ] = await Promise.all([
            getUserBalance(userId),
            getDocs(accountsQuery),
            getDocs(transactionsQuery),
        ]);

        const tradingAccounts = accountsSnapshot.docs.map(doc => {
            const data = doc.data();
            return { id: doc.id, ...data, createdAt: (data.createdAt as Timestamp).toDate() } as TradingAccount;
        });

        const cashbackTransactions = transactionsSnapshot.docs.map(doc => {
            const data = doc.data();
            return { id: doc.id, ...data, date: (data.date as Timestamp).toDate() } as CashbackTransaction;
        }).sort((a, b) => b.date.getTime() - a.date.getTime());

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
            referredByName,
            referralsWithNames,
        };
    } catch (error) {
        console.error("Error fetching user details:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { error: errorMessage };
    }
}
