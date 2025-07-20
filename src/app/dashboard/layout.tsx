
"use client";

import Link from "next/link";
import {
    CircleUser,
    Settings,
    LogOut,
    Bell,
    Check,
    Store,
    MessageCircle,
    User,
    ShieldCheck,
    Lock,
    Activity,
    ChevronRight,
    Home,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { AuthProvider, useAuthContext } from "@/hooks/useAuthContext";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { useEffect, useState } from "react";
import type { Notification } from "@/types";
import { getNotificationsForUser, markNotificationsAsRead } from "../admin/actions";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { usePathname } from "next/navigation";


function NotificationBell() {
    const { user } = useAuthContext();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;
        
        const fetchNotifications = async () => {
            const data = await getNotificationsForUser(user.uid);
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        };
        fetchNotifications();
        
        // Poll for new notifications
        const intervalId = setInterval(fetchNotifications, 30000); // every 30 seconds
        return () => clearInterval(intervalId);

    }, [user]);

    const handleMarkAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
        if (unreadIds.length > 0) {
            await markNotificationsAsRead(unreadIds);
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        }
    };

    return (
        <Popover onOpenChange={(open) => { if (!open) handleMarkAsRead(); }}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative h-9 w-9">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs text-white">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="p-2 border-b">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                </div>
                <ScrollArea className="h-80">
                    <div className="p-2 space-y-1">
                        {notifications.length > 0 ? (
                            notifications.map(n => (
                                <Link href={n.link || '/dashboard'} key={n.id} className="block">
                                    <div className={cn("p-2 rounded-md hover:bg-muted", !n.isRead && "bg-primary/10")}>
                                        <p className="text-sm">{n.message}</p>
                                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(n.createdAt, { addSuffix: true })}</p>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <p className="p-4 text-center text-sm text-muted-foreground">No notifications yet.</p>
                        )}
                    </div>
                </ScrollArea>
                <div className="p-2 border-t">
                    <Button variant="ghost" size="sm" className="w-full text-sm" onClick={handleMarkAsRead}>
                        <Check className="mr-2 h-4 w-4" />
                        Mark all as read
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

const settingsLinks = [
    { href: "/dashboard/profile", icon: User, label: "Profile", description: "Edit your personal information." },
    { href: "/dashboard/settings/verification", icon: ShieldCheck, label: "Verification", description: "Complete KYC and unlock features." },
    { href: "/dashboard/settings/security", icon: Lock, label: "Security", description: "Manage password and 2FA." },
    { href: "/dashboard/settings/activity-logs", icon: Activity, label: "Activity Logs", description: "Review recent account activity." },
];

function SettingsSidebar() {
    const { user } = useAuthContext();
    const pathname = usePathname();

    return (
        <div className="flex flex-col h-full">
            <SheetHeader className="p-4 border-b text-left">
                <SheetTitle>Settings</SheetTitle>
            </SheetHeader>
            <div className="p-4 space-y-4">
                <Link href="/dashboard/profile">
                    <Card className="hover:bg-muted/50 transition-colors">
                        <CardContent className="p-3 flex items-center gap-3">
                             <Avatar className="h-12 w-12">
                                <AvatarFallback className="text-xl bg-primary/20 text-primary font-bold">
                                    {user?.profile?.name ? user.profile.name.charAt(0).toUpperCase() : '?'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-grow">
                                <h3 className="font-semibold">{user?.profile?.name}</h3>
                                <p className="text-xs text-muted-foreground">{user?.profile?.email}</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <nav className="flex flex-col gap-2">
                    {settingsLinks.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10", {
                                "bg-primary/10 text-primary": pathname === link.href,
                            })}
                        >
                            <link.icon className="h-5 w-5" />
                            <div className="flex-grow">
                               <p className="text-sm font-medium">{link.label}</p>
                            </div>
                             <ChevronRight className="h-4 w-4" />
                        </Link>
                    ))}
                </nav>
            </div>
             <div className="mt-auto p-4 border-t">
                <Link href="/" className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10">
                    <LogOut className="h-5 w-5" />
                    <span className="text-sm font-medium">Logout</span>
                </Link>
            </div>
        </div>
    )
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AuthProvider>
            <AuthGuard>
                <div className="flex flex-col min-h-screen w-full">
                    <header className="sticky top-0 flex h-14 items-center gap-4 border-b bg-background px-4 z-10">
                         <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-primary-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"></path><path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                            </div>
                            <span className="font-headline text-lg hidden sm:inline-block">Cashback Companion</span>
                        </Link>
                        
                        <div className="ml-auto flex items-center gap-2">
                            <Button asChild variant="ghost" size="icon" className="h-9 w-9">
                                <Link href="/dashboard"><Home className="h-5 w-5" /></Link>
                            </Button>
                            <Button asChild variant="ghost" size="icon" className="h-9 w-9">
                                <Link href="/dashboard/store"><Store className="h-5 w-5" /></Link>
                            </Button>
                            <Button asChild variant="ghost" size="icon" className="h-9 w-9">
                               <Link href="/contact"><MessageCircle className="h-5 w-5" /></Link>
                            </Button>
                            <NotificationBell />
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="secondary" size="icon" className="rounded-full h-9 w-9">
                                        <CircleUser className="h-5 w-5" />
                                        <span className="sr-only">Open settings panel</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="p-0 w-full max-w-xs">
                                    <SettingsSidebar />
                                </SheetContent>
                            </Sheet>
                        </div>
                    </header>
                    <main className="flex flex-1 flex-col">
                        {children}
                    </main>
                </div>
            </AuthGuard>
        </AuthProvider>
    )
}
