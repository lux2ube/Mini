

"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from "@/components/shared/PageHeader";
import { getClientLevels, getUsers } from '@/app/admin/actions';
import type { UserProfile, ClientLevel } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, History, Gem } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';

type EnrichedUser = UserProfile & { referredByName?: string };

export default function ManageUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<EnrichedUser[]>([]);
    const [levels, setLevels] = useState<ClientLevel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();

    const fetchUsersAndLevels = async () => {
        setIsLoading(true);
        try {
            const [fetchedUsers, fetchedLevels] = await Promise.all([
                getUsers(),
                getClientLevels()
            ]);
            
            setLevels(fetchedLevels);

            const enriched = fetchedUsers.map(user => {
                if (!user) return null;
                const referrer = fetchedUsers.find(u => u && u.uid === user.referredBy);
                return {
                    ...user,
                    referredByName: referrer ? referrer.name : '-'
                };
            }).filter(Boolean) as EnrichedUser[];

            enriched.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
            setUsers(enriched);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            toast({ variant: 'destructive', title: 'خطأ في تحميل البيانات', description: `تعذر جلب المستخدمين: ${errorMessage}` });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsersAndLevels();
    }, []);

    const levelMap = useMemo(() => {
        return new Map(levels.map(level => [level.id, level.name]));
    }, [levels]);

    const filteredUsers = useMemo(() => {
        if (!searchQuery) return users;
        const lowerCaseQuery = searchQuery.toLowerCase();
        return users.filter(user => {
            if (!user) return false;
            const nameMatch = user.name?.toLowerCase().includes(lowerCaseQuery) || false;
            const emailMatch = user.email?.toLowerCase().includes(lowerCaseQuery) || false;
            const clientIdMatch = user.clientId && String(user.clientId).includes(lowerCaseQuery);
            const referralCodeMatch = user.referralCode && user.referralCode.toLowerCase().includes(lowerCaseQuery);
            const uidMatch = user.uid?.toLowerCase().includes(lowerCaseQuery) || false;
            const countryMatch = user.country?.toLowerCase().includes(lowerCaseQuery) || false;
            return nameMatch || emailMatch || clientIdMatch || referralCodeMatch || uidMatch || countryMatch;
        });
    }, [searchQuery, users]);

    const getSafeDate = (date: Date | undefined) => {
        try {
            if (date) return format(date, 'PP');
            return '-';
        } catch {
            return '-';
        }
    }


    return (
        <div className="container mx-auto space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-2">
                 <PageHeader title="إدارة المستخدمين" description="عرض وإدارة جميع المستخدمين المسجلين." />
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>جميع المستخدمين</CardTitle>
                    <CardDescription>
                        تم العثور على {filteredUsers.length} من {users.length} مستخدم.
                    </CardDescription>
                    <div className="relative max-w-sm">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="بحث بالاسم، البريد، الدولة، أو ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pr-10"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>معرف العميل</TableHead>
                                        <TableHead>الاسم</TableHead>
                                        <TableHead>البريد الإلكتروني</TableHead>
                                        <TableHead>الحالة</TableHead>
                                        <TableHead>المستوى</TableHead>
                                        <TableHead>تاريخ الانضمام</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map(user => (
                                        <TableRow 
                                            key={user.uid} 
                                            onClick={() => router.push(`/admin/users/${user.uid}`)}
                                            className="cursor-pointer"
                                        >
                                            <TableCell className="font-mono text-xs">{user.clientId || 'N/A'}</TableCell>
                                            <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                                            <TableCell>{user.email || 'N/A'}</TableCell>
                                             <TableCell>
                                                <Badge variant={user.status === 'Trader' ? 'default' : user.status === 'Active' ? 'outline' : 'secondary'}>
                                                    {user.status || 'N/A'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{levelMap.get(user.level) || 'N/A'}</TableCell>
                                            <TableCell>{getSafeDate(user.createdAt)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
