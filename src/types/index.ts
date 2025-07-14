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
