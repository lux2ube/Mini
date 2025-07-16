
import type { Timestamp } from "firebase/firestore";

/**
 * Represents the settings for the promotional banner.
 */
export interface BannerSettings {
    scriptCode: string;
    isEnabled: boolean;
}

/**
 * Represents a user document in the 'users' collection.
 */
export interface UserProfile {
    uid: string;
    email: string;
    name: string;
    role: 'user' | 'admin';
    createdAt: Date;
    // New profile fields
    phoneNumber?: string;
    phoneNumberVerified?: boolean;
    // Referral fields
    referralCode: string;
    referredBy?: string; // UID of the user who referred this person
    referrals: string[]; // Array of UIDs of users this person has referred
    points: number;
    tier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
}

/**
 * Represents a partner broker in the 'brokers' collection.
 */
export interface Broker {
    id: string;
    order: number;
    name: string;
    description: string;
    logoUrl: string;
    details: {
        minDeposit: string;
        leverage: string;
        spreads: string;
    };
    instructions: {
        description: string;
        linkText: string;
        link: string;
    };
    existingAccountInstructions: string;
}


/**
 * Represents a linked trading account document in the 'tradingAccounts' collection.
 */
export interface TradingAccount {
    id: string; // Document ID
    userId: string;
    broker: string;
    accountNumber: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    createdAt: Date;
}

/**
 * Represents a cashback transaction document in the 'cashbackTransactions' collection.
 */
export interface CashbackTransaction {
    id: string; // Document ID
    userId: string;
    accountId: string; // Reference to the TradingAccount document ID
    accountNumber: string;
    broker: string;
    date: Date;
    tradeDetails: string; // e.g., "Trade 1.5 lots EURUSD"
    cashbackAmount: number;
    // Optional referral fields
    referralBonusTo?: string;
    referralBonusAmount?: number;
}

/**
 * Represents a configurable field for a payment method.
 */
export interface PaymentMethodField {
    name: string; // e.g., "walletAddress", "binanceId"
    label: string; // e.g., "USDT (BEP20) Wallet Address", "Binance ID"
    type: 'text' | 'number';
    placeholder?: string;
    validation: {
        required: boolean;
        minLength?: number;
        maxLength?: number;
        regex?: string; // Stored as a string
        regexErrorMessage?: string;
    };
}

/**
 * Represents a withdrawal payment method configured by the admin.
 */
export interface PaymentMethod {
    id: string;
    name: string; // e.g., "USDT (BEP20)", "Internal Transfer"
    description: string;
    isEnabled: boolean;
    fields: PaymentMethodField[];
    type: 'crypto' | 'internal_transfer' | 'trading_account';
}

/**
 * Represents a payment method saved by a user.
 */
export interface UserPaymentMethod {
    id: string; // Document ID
    userId: string;
    paymentMethodId: string; // Reference to the admin-defined PaymentMethod
    methodName: string; // e.g., "USDT (TRC20)"
    methodType: PaymentMethod['type'];
    details: Record<string, any>; // e.g., { walletAddress: '0x123...' }
    createdAt: Date;
}


/**
 * Represents a withdrawal request document in the 'withdrawals' collection.
 */
export interface Withdrawal {
    id: string; // Document ID
    userId: string;
    amount: number;
    status: 'Processing' | 'Completed' | 'Failed';
    paymentMethod: string; // Name of the payment method, e.g., "USDT (TRC20)" or "Trading Account Transfer"
    withdrawalDetails: Record<string, any>; // Stores field values, e.g., { walletAddress: '0x123...' } or { broker: 'Exness', accountNumber: '12345' }
    requestedAt: Date;
    completedAt?: Date;
    txId?: string; // Transaction ID from the blockchain or internal reference
}


/**
 * Represents a notification for a user.
 */
export interface Notification {
    id: string;
    userId: string;
    message: string;
    type: 'account' | 'cashback' | 'withdrawal' | 'general' | 'store';
    isRead: boolean;
    createdAt: Date;
    link?: string;
}

/**
 * Represents a product category in the 'productCategories' collection.
 */
export interface ProductCategory {
    id: string;
    name: string;
    description: string;
}

/**
 * Represents a product in the 'products' collection.
 */
export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    categoryId: string;
    categoryName: string;
    stock: number;
}

/**
 * Represents a user's order from the store.
 */
export interface Order {
    id: string;
    userId: string;
    productId: string;
    productName: string;
    productImage: string;
    price: number;
    deliveryPhoneNumber: string;
    status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
    createdAt: Date;
    userEmail?: string;
    userName?: string;
}
