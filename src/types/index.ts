import { Timestamp } from "firebase/firestore";

export interface Transaction {
    id: string;
    userId: string;
    merchant: string;
    amount: number;
    mcc: string;
    cashbackAmount: number;
    status: 'Pending' | 'Approved' | 'Rejected';
    submittedAt: Date;
}

export interface TradingAccount {
    id: string;
    userId: string;
    broker: string;
    accountNumber: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    createdAt: Timestamp;
}

export interface Withdrawal {
    id: string;
    amount: number;
    status: 'Processing' | 'Completed' | 'Failed';
    date: Date;
    network: 'bep20' | 'trc20';
    address: string;
}

export interface CashbackTransaction {
    id: string;
    userId: string;
    date: Date | Timestamp;
    accountNumber: string;
    broker: string;
    merchant: string;
    transactionAmount: number;
    cashbackAmount: number;
}
