
"use client"

import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { getActivityLogs } from '@/app/admin/actions';
import type { ActivityLog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuthContext } from '@/hooks/useAuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function UserActivityLogsPage() {
    const { user } = useAuthContext();
    const router = useRouter();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchLogs = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                // In a real app, we would query where userId equals the current user's ID.
                // For this demo, we'll fetch all and filter client-side.
                const fetchedLogs = await getActivityLogs();
                const userLogs = fetchedLogs.filter(log => log.userId === user.uid);
                setLogs(userLogs);
            } catch (error) {
                console.error("Failed to fetch logs:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch your activity logs.' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchLogs();
    }, [user, toast]);

    const getEventVariant = (event: ActivityLog['event']) => {
        switch (event) {
            case 'login': return 'default';
            case 'signup': return 'secondary';
            case 'withdrawal_request': return 'outline';
            case 'store_purchase': return 'outline';
            default: return 'outline';
        }
    }

    return (
        <div className="max-w-md mx-auto w-full px-4 py-4 space-y-6">
            <Button variant="ghost" onClick={() => router.back()} className="h-auto p-0 text-sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Settings
            </Button>
            <PageHeader title="Your Activity" description="A log of recent security-related events." />

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Recent Events</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : logs.length > 0 ? (
                        logs.map(log => (
                            <div key={log.id} className="flex items-start gap-4">
                                <div className="text-xs text-muted-foreground text-right">
                                    <p>{format(log.timestamp, 'MMM d')}</p>
                                    <p>{format(log.timestamp, 'p')}</p>
                                </div>
                                <div className="pl-4 border-l flex-grow">
                                    <p className="font-semibold text-sm capitalize">{log.event.replace('_', ' ')}</p>
                                    <p className="text-xs text-muted-foreground">
                                        From {log.geo?.city || 'Unknown City'}, {log.geo?.country || 'Unknown Country'} ({log.ipAddress})
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                       <p className="text-center text-muted-foreground text-sm py-8">No activity logs found.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
