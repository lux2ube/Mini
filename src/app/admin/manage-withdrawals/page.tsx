

"use client";

import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { approveWithdrawal, getWithdrawals, rejectWithdrawal, getUserDetails } from '../actions';
import type { Withdrawal, UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Copy, AlertTriangle, MessageSquare, Hash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';


function RejectWithdrawalDialog({ withdrawalId, onSuccess }: { withdrawalId: string, onSuccess: () => void }) {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (!reason.trim()) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'سبب الرفض لا يمكن أن يكون فارغاً.' });
            return;
        }
        setIsSubmitting(true);
        const result = await rejectWithdrawal(withdrawalId, reason);
        if (result.success) {
            toast({ title: 'نجاح', description: result.message });
            onSuccess();
        } else {
            toast({ variant: 'destructive', title: 'خطأ', description: result.message });
        }
        setIsSubmitting(false);
    }

    return (
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>رفض طلب السحب</AlertDialogTitle>
                <AlertDialogDescription>
                    يرجى تقديم سبب لرفض هذا السحب. سيتم إخطار المستخدم.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
                <Label htmlFor="reason">سبب الرفض</Label>
                <div className="relative">
                    <MessageSquare className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea 
                        id="reason" 
                        value={reason} 
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="مثال: نشاط تداول غير كافٍ."
                        className="pr-10"
                    />
                </div>
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    تأكيد الرفض
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    )
}

function ApproveWithdrawalDialog({ withdrawalId, onSuccess }: { withdrawalId: string, onSuccess: () => void }) {
    const [txId, setTxId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (!txId.trim()) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'معرف المعاملة لا يمكن أن يكون فارغًا.' });
            return;
        }
        setIsSubmitting(true);
        const result = await approveWithdrawal(withdrawalId, txId);
        if (result.success) {
            toast({ title: 'نجاح', description: result.message });
            onSuccess();
        } else {
            toast({ variant: 'destructive', title: 'خطأ', description: result.message });
        }
        setIsSubmitting(false);
    }

    return (
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>الموافقة على السحب</AlertDialogTitle>
                <AlertDialogDescription>
                    أدخل معرف معاملة البلوك تشين (TXID) أو المرجع الداخلي لتأكيد إرسال هذا السحب.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
                <Label htmlFor="txid">معرف المعاملة / المرجع</Label>
                <div className="relative">
                    <Hash className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        id="txid" 
                        value={txId} 
                        onChange={(e) => setTxId(e.target.value)}
                        placeholder="0x..."
                        className="pr-10"
                    />
                </div>
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    الموافقة
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    )
}

function areDetailsEqual(details1: Record<string, any>, details2: Record<string, any>) {
    const keys1 = Object.keys(details1);
    const keys2 = Object.keys(details2);
    if (keys1.length !== keys2.length) return false;
    for (const key of keys1) {
        if (details1[key] !== details2[key]) return false;
    }
    return true;
}

function WithdrawalDetail({ label, value, isChanged = false }: { label: string, value: any, isChanged?: boolean }) {
    if (!value) return null;
    
    // Convert label from camelCase to Title Case
    const formattedLabel = label.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
    
    return (
        <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold">{formattedLabel}:</span>
            <span className={`truncate ${isChanged ? 'text-destructive font-bold' : 'text-muted-foreground'}`} style={{ maxWidth: '150px' }}>
                {value}
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(value); }}>
                <Copy className="h-3 w-3" />
            </Button>
        </div>
    )
}

type EnrichedWithdrawal = Withdrawal & { userProfile?: UserProfile };

export default function ManageWithdrawalsPage() {
    const [withdrawals, setWithdrawals] = useState<EnrichedWithdrawal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchWithdrawals = async () => {
        setIsLoading(true);
        try {
            const data = await getWithdrawals();
            
            const userIds = [...new Set(data.map(w => w.userId))];
            const userProfiles: Record<string, UserProfile> = {};

            // Fetch user profiles in chunks to avoid hitting Firestore limits
            for (let i = 0; i < userIds.length; i += 10) {
                const chunk = userIds.slice(i, i + 10);
                const userDetailsPromises = chunk.map(uid => getUserDetails(uid).then(res => ({...res, uid})));
                const userDetailsResults = await Promise.all(userDetailsPromises);
                userDetailsResults.forEach(res => {
                    if (!('error' in res) && res.userProfile) {
                        userProfiles[res.uid] = res.userProfile;
                    }
                });
            }
            
            const enrichedData = data.map(w => ({
                ...w,
                userProfile: userProfiles[w.userId]
            }));

            setWithdrawals(enrichedData);
        } catch (error) {
            console.error("Failed to fetch withdrawals:", error);
            toast({ variant: 'destructive', title: 'خطأ', description: 'تعذر جلب طلبات السحب.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Completed': return 'default';
            case 'Processing': return 'secondary';
            case 'Failed': return 'destructive';
            default: return 'outline';
        }
    }
    
    const getStatusText = (status: string) => {
        switch (status) {
            case 'Completed': return 'مكتمل';
            case 'Processing': return 'قيد المعالجة';
            case 'Failed': return 'فشل';
            default: return status;
        }
    }

    return (
        <div className="container mx-auto space-y-6">
            <PageHeader title="إدارة السحوبات" description="معالجة طلبات السحب من المستخدمين." />
            <Card>
                <CardHeader>
                    <CardTitle>جميع طلبات السحب</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                         <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>التاريخ</TableHead>
                                        <TableHead>المستخدم</TableHead>
                                        <TableHead>المبلغ</TableHead>
                                        <TableHead>الطريقة</TableHead>
                                        <TableHead>التفاصيل</TableHead>
                                        <TableHead>الحالة</TableHead>
                                        <TableHead>السبب</TableHead>
                                        <TableHead className="text-left">الإجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {withdrawals.map(w => {
                                        const detailsChanged = w.previousWithdrawalDetails && !areDetailsEqual(w.withdrawalDetails, w.previousWithdrawalDetails);
                                        return (
                                            <TableRow key={w.id}>
                                                <TableCell>{format(new Date(w.requestedAt), 'PP')}</TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-sm">{w.userProfile?.name}</div>
                                                    <div className="font-mono text-xs text-muted-foreground">{w.userProfile?.clientId}</div>
                                                </TableCell>
                                                <TableCell className="font-medium">${w.amount.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{w.paymentMethod}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        {w.withdrawalDetails && Object.entries(w.withdrawalDetails).map(([key, value]) => (
                                                            <WithdrawalDetail key={key} label={key} value={value} isChanged={detailsChanged}/>
                                                        ))}
                                                        {detailsChanged && (
                                                            <Alert variant="destructive" className="p-2">
                                                                <AlertTriangle className="h-4 w-4" />
                                                                <AlertTitle className="text-xs font-bold">تم تغيير التفاصيل</AlertTitle>
                                                                <AlertDescription className="text-xs">
                                                                    السابق: {w.previousWithdrawalDetails && Object.values(w.previousWithdrawalDetails).join(', ')}
                                                                </AlertDescription>
                                                            </Alert>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell><Badge variant={getStatusVariant(w.status)}>{getStatusText(w.status)}</Badge></TableCell>
                                                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{w.rejectionReason}</TableCell>
                                                <TableCell className="text-left space-x-2">
                                                    {w.status === 'Processing' && (
                                                        <>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button size="icon" variant="outline" className="h-8 w-8 text-green-600 hover:text-green-600">
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <ApproveWithdrawalDialog withdrawalId={w.id} onSuccess={fetchWithdrawals} />
                                                        </AlertDialog>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button size="icon" variant="destructive" className="h-8 w-8">
                                                                    <XCircle className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <RejectWithdrawalDialog withdrawalId={w.id} onSuccess={fetchWithdrawals} />
                                                        </AlertDialog>
                                                        </>
                                                    )}
                                                    {w.status === 'Completed' && w.txId && (
                                                        <WithdrawalDetail label="TXID" value={w.txId} />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                         </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
