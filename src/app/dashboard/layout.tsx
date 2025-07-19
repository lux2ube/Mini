
"use client";

import Link from "next/link";
import {
    CircleUser,
    Menu,
    Settings,
    LayoutDashboard,
    CreditCard,
    Briefcase,
    Landmark,
    ReceiptText,
    LogOut,
    Users,
    Gift,
    Bell,
    Check,
    Store,
    ShoppingBag,
    User,
    History,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

const navLinks = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/dashboard/my-accounts", icon: Users, label: "My Accounts" },
    { href: "/dashboard/brokers", icon: Briefcase, label: "Brokers" },
    { href: "/dashboard/wallet/history", icon: History, label: "Wallet History" },
    { href: "/dashboard/referrals", icon: Gift, label: "Referrals" },
    { href: "/dashboard/store", icon: Store, label: "Store" },
    { href: "/dashboard/withdraw", icon: Landmark, label: "Withdraw" },
    { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];


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


export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AuthProvider>
            <AuthGuard>
                <div className="flex flex-col min-h-screen w-full">
                    <header className="sticky top-0 flex h-12 items-center gap-4 border-b bg-background px-4">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon" className="h-9 w-9">
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Toggle navigation menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="flex flex-col p-0">
                                <SheetHeader className="p-4 border-b">
                                    <SheetTitle>
                                         <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                                <svg className="w-6 h-6 text-primary-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"></path><path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                            </div>
                                            <span className="font-headline text-base">Cashback Companion</span>
                                        </Link>
                                    </SheetTitle>
                                </SheetHeader>
                                <nav className="grid gap-1 text-sm font-medium p-2">
                                    {navLinks.map(link => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground hover:text-foreground"
                                        >
                                            <link.icon className="h-4 w-4" />
                                            {link.label}
                                        </Link>
                                    ))}
                                </nav>
                                <div className="mt-auto p-4 border-t">
                                     <Link
                                        href="/"
                                        className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground hover:text-foreground"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Logout
                                    </Link>
                                </div>
                            </SheetContent>
                        </Sheet>
                        <div className="w-full flex-1">
                            <h1 className="text-base font-semibold font-headline">Cashback Companion</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <NotificationBell />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="secondary" size="icon" className="rounded-full h-9 w-9">
                                        <CircleUser className="h-5 w-5" />
                                        <span className="sr-only">Toggle user menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <Link href="/dashboard/profile"><DropdownMenuItem><User />Profile</DropdownMenuItem></Link>
                                    <Link href="/dashboard/settings"><DropdownMenuItem><Settings />Settings</DropdownMenuItem></Link>
                                    <DropdownMenuItem>Support</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <Link href="/"><DropdownMenuItem><LogOut/>Logout</DropdownMenuItem></Link>
                                </DropdownMenuContent>
                            </DropdownMenu>
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
