
"use client";

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { getActivityLogs } from '../actions';
import type { ActivityLog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';

export default function SecurityLogsPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        const fetchLogs = async () => {
            setIsLoading(true);
            try {
                const fetchedLogs = await getActivityLogs();
                setLogs(fetchedLogs);
            } catch (error) {
                console.error("Failed to fetch logs:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch activity logs.' });
            } finally {
                setIsLoading(false);
            }
        };

        fetchLogs();
    }, [toast]);

    const filteredLogs = useMemo(() => {
        if (!searchQuery) return logs;
        const lowerCaseQuery = searchQuery.toLowerCase();
        return logs.filter(log =>
            log.userId.toLowerCase().includes(lowerCaseQuery) ||
            log.event.toLowerCase().includes(lowerCaseQuery) ||
            (log.ipAddress && log.ipAddress.toLowerCase().includes(lowerCaseQuery))
        );
    }, [searchQuery, logs]);

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
        <div className="container mx-auto space-y-6">
            <PageHeader title="Security & Activity Logs" description="Monitor key user activities across the application." />
            <Card>
                <CardHeader>
                    <CardTitle>All Logs</CardTitle>
                    <CardDescription>
                        Found {filteredLogs.length} of {logs.length} log entries.
                    </CardDescription>
                    <Input 
                        placeholder="Search by User ID, event, or IP..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-sm"
                    />
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Timestamp</TableHead>
                                        <TableHead>Event</TableHead>
                                        <TableHead>User ID</TableHead>
                                        <TableHead>IP Address</TableHead>
                                        <TableHead>User Agent</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLogs.map(log => (
                                        <TableRow key={log.id}>
                                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{format(log.timestamp, 'Pp')}</TableCell>
                                            <TableCell>
                                                <Badge variant={getEventVariant(log.event)} className="capitalize">
                                                    {log.event.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{log.userId}</TableCell>
                                            <TableCell className="font-mono text-xs">{log.ipAddress}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground truncate max-w-xs">{log.userAgent}</TableCell>
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
