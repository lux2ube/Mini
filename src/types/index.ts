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
