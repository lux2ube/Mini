
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
    createdAt: any;
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
    createdAt: any;
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
    date: any;
    tradeDetails: string; // e.g., "Trade 1.5 lots EURUSD"
    cashbackAmount: number;
}


/**
 * Represents a withdrawal request document in the 'withdrawals' collection.
 */
export interface Withdrawal {
    id: string; // Document ID
    userId: string;
    amount: number;
    status: 'Processing' | 'Completed' | 'Failed';
    network: 'bep20' | 'trc20';
    walletAddress: string;
    requestedAt: any;
    completedAt?: any;
    txId?: string; // Transaction ID from the blockchain
}
