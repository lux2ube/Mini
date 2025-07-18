
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
 * Represents a partner broker with a highly detailed structure.
 */
export interface Broker {
    id: string;
    order: number;
    logoUrl: string; // From original design
    basicInfo: {
        broker_name: string;
        group_entity: string;
        founded_year: number;
        headquarters: string;
        CEO: string;
    };
    regulation: {
        regulated_in: string[];
        regulator_name: string[];
        license_type: string;
        regulation_status: 'Active' | 'Revoked' | 'Expired' | 'Unregulated';
        offshore_regulation: boolean;
        risk_level: 'Low' | 'Medium' | 'High' | 'Suspicious' | 'Unregulated';
    };
    tradingConditions: {
        broker_type: 'Market Maker' | 'ECN' | 'STP' | 'Hybrid';
        account_types: string[];
        swap_free: boolean;
        max_leverage: string;
        min_deposit: number;
        spread_type: 'Fixed' | 'Variable';
        min_spread: number;
        commission_per_lot: number;
        execution_speed: string;
    };
    platforms: {
        platforms_supported: string[];
        mt4_license_type: 'Full License' | 'White Label' | 'None';
        mt5_license_type: 'Full License' | 'White Label' | 'None';
        custom_platform: boolean;
    };
    instruments: {
        forex_pairs: string;
        crypto_trading: boolean;
        stocks: boolean;
        commodities: boolean;
        indices: boolean;
    };
    depositsWithdrawals: {
        payment_methods: string[];
        min_withdrawal: number;
        withdrawal_speed: string;
        deposit_fees: boolean;
        withdrawal_fees: boolean;
    };
    cashback: {
        cashback_per_lot: number;
        cashback_account_type: string[];
        cashback_frequency: 'Daily' | 'Weekly' | 'Monthly';
        rebate_method: string[];
        affiliate_program_link: string;
    };
    globalReach: {
        business_region: string[];
        global_presence: string;
        languages_supported: string[];
        customer_support_channels: string[];
    };
    reputation: {
        wikifx_score: number;
        trustpilot_rating: number;
        reviews_count: number;
        verified_users: number;
    };
    additionalFeatures: {
        education_center: boolean;
        copy_trading: boolean;
        demo_account: boolean;
        trading_contests: boolean;
        regulatory_alerts: string;
    };
    // Legacy fields for compatibility until UI is updated
    name: string;
    description: string;
    category: 'forex' | 'crypto' | 'other';
    rating: number; // A number from 1 to 5
    details: {
        cashbackType: string; // e.g., "Daily Forex Cashback"
        minDeposit: string; // e.g., "$1"
    };
    cashbackRate: {
        tradeType: string; // e.g., "Trade 1 lot"
        amount: number; // e.g., 8
    };
    features: {
        text: string;
        available: boolean;
    }[];
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
    // DEPRECATED - use withdrawalDetails
    walletAddress?: string;
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

/**
 * Represents a log of user activity for security and analytics.
 */
export interface ActivityLog {
    id: string;
    userId: string;
    event: 'login' | 'signup' | 'withdrawal_request' | 'store_purchase';
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
    geo?: {
        country?: string;
        region?: string;
        city?: string;
    };
    details?: Record<string, any>; // For event-specific data, e.g., { amount: 100, method: 'USDT' }
}
