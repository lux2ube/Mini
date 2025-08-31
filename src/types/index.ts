

import type { Timestamp } from "firebase/firestore";

/**
 * Represents the settings for the promotional banner.
 */
export interface BannerSettings {
    isEnabled: boolean;
    type: 'script' | 'text';
    // Text Banner Fields
    title?: string;
    text?: string;
    ctaText?: string;
    ctaLink?: string;
    // Script Banner Fields
    scriptCode?: string;
    // Targeting Fields
    targetTiers?: ('New' | 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | 'Ambassador')[];
    targetCountries?: string[]; // Array of ISO 3166-1 alpha-2 country codes
}

export interface KycData {
    documentType: 'id_card' | 'passport';
    documentNumber: string;
    gender: 'male' | 'female';
    status: 'Pending' | 'Verified' | 'Rejected';
    rejectionReason?: string;
}

export interface AddressData {
    country: string;
    city: string;
    streetAddress: string;
    status: 'Pending' | 'Verified' | 'Rejected';
    rejectionReason?: string;
}

/**
 * Represents a user document in the 'users' collection.
 */
export interface UserProfile {
    uid: string; // Document ID, same as Firebase Auth UID
    email: string;
    name: string;
    role: 'user' | 'admin';
    clientId: number; // Sequential, human-readable ID
    createdAt?: Date;
    country?: string; // ISO 3166-1 alpha-2 country code
    isVerified?: boolean;
    status: 'NEW' | 'Active' | 'Trader'; // User lifecycle status
    // New profile fields
    phoneNumber?: string;
    phoneNumberVerified?: boolean;
    // Referral fields
    referralCode?: string;
    referredBy?: string | null; // UID of the user who referred this person
    referrals?: string[]; // Array of UIDs of users this person has referred
    // New Level System
    level: number; // Level 1-6
    monthlyEarnings?: number; // For level calculation
    // Verification fields
    kycData?: KycData;
    addressData?: AddressData;
    hasPendingKYC?: boolean;
    hasPendingAddress?: boolean;
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
        broker_type: string;
    };
    regulation: {
        licenses: { authority: string; licenseNumber?: string; status: string }[];
        regulated_in: string[];
        regulator_name: string[];
        regulation_status: string;
        offshore_regulation: boolean;
        risk_level: string;
    };
    tradingConditions: {
        account_types: string[];
        max_leverage: string;
        min_deposit: number;
        spread_type: string;
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
        swap_free: boolean;
        education_center: boolean;
        copy_trading: boolean;
        demo_account: boolean;
        trading_contests: boolean;
        regulatory_alerts: string;
        welcome_bonus: boolean;
    };
    // Legacy fields for compatibility until UI is updated
    name: string;
    description: string;
    category: 'forex' | 'crypto' | 'other';
    rating: number; // A number from 1 to 5
    instructions: {
        description: string;
        linkText: string;
        link: string;
        new_account_instructions?: string,
        new_account_link?: string,
        new_account_link_text?: string
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
    rejectionReason?: string;
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
    referralBonusTo?: string; // UID of the referrer who received the commission
    referralBonusAmount?: number; // The commission amount given to the referrer
    sourceUserId?: string; // The original user who generated the cashback/order
    sourceType?: 'cashback' | 'store_purchase'; // The type of original transaction
    // Admin-provided details
    transactionId?: string;
    notes?: string;
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
    rejectionReason?: string;
    // New field for security check
    previousWithdrawalDetails?: Record<string, any> | null;
}


/**
 * Represents a notification for a user.
 */
export interface Notification {
    id: string;
    userId: string;
    message: string;
    type: 'account' | 'cashback' | 'withdrawal' | 'general' | 'store' | 'loyalty' | 'announcement';
    isRead: boolean;
    createdAt: Date;
    link?: string;
}

/**
 * Represents a notification sent by an admin, for logging purposes.
 */
export interface AdminNotification {
    id: string;
    message: string;
    target: 'all' | 'specific';
    userIds: string[];
    createdAt: Date;
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
    referralCommissionAwarded?: boolean;
}

/**
 * Represents device information collected from the client.
 */
export interface DeviceInfo {
    device: string;
    os: string;
    browser: string;
}

/**
 * Represents geolocation information for a user.
 */
export interface GeoInfo {
    ip: string;
    country?: string;
    region?: string;
    city?: string;
}


/**
 * Represents a log of user activity for security and analytics.
 */
export interface ActivityLog {
    id: string;
    userId: string;
    event: 'login' | 'signup' | 'withdrawal_request' | 'store_purchase';
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    geo?: {
        country?: string;
        region?: string;
        city?: string;
    };
    device?: DeviceInfo;
    details?: Record<string, any>; // For event-specific data, e.g., { amount: 100, method: 'USDT' }
}

/**
 * Represents a blog post in the 'blogPosts' collection.
 */
export interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    content: string; // Markdown content
    imageUrl: string;
    authorName: string;
    authorId: string;
    status: 'draft' | 'published';
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

// Client Level System
export interface ClientLevel {
    id: number; // Level 1-6
    name: string; // e.g. Bronze, Silver
    required_total: number; // Total monthly earnings required for this level
    advantage_referral_cashback: number; // % commission
    advantage_referral_store: number; // % commission
    advantage_product_discount: number; // % discount
}

// Definition of a user's status based on their activity
export type UserStatus = 'NEW' | 'Active' | 'Trader';

// Feedback System
export interface FeedbackQuestion {
  id: string;
  text: string;
  type: 'text' | 'rating' | 'multiple-choice'; // Example types
  options?: string[]; // For multiple-choice
}

export interface FeedbackForm {
  id: string;
  title: string;
  description: string;
  questions: FeedbackQuestion[];
  status: 'active' | 'inactive';
  createdAt: Date;
  responseCount: number;
}

export interface FeedbackResponse {
  id: string;
  formId: string;
  userId: string;
  submittedAt: Date;
  answers: Record<string, any>; // question.id -> answer
}

export interface EnrichedFeedbackResponse extends FeedbackResponse {
    userName: string;
}

/**
 * Represents a pending verification request for the admin panel.
 */
export interface PendingVerification {
    userId: string;
    userName: string;
    userEmail: string;
    type: 'KYC' | 'Address';
    data: KycData | AddressData;
    requestedAt: Date;
}
