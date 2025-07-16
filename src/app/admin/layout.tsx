

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutGrid,
    Users,
    PlusCircle,
    ArrowDownUp,
    Briefcase,
    GalleryHorizontal,
    LogOut,
    Menu,
    Gift,
    Store,
    List,
    Package,
    ShoppingBag,
    Wallet,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { AuthProvider } from "@/hooks/useAuthContext";
import { AdminGuard } from "@/components/shared/AdminGuard";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/hooks/useAuthContext";

const navLinks = [
    { href: "/admin/dashboard", icon: LayoutGrid, label: "Dashboard" },
    { href: "/admin/users", icon: Users, label: "Manage Users" },
    { href: "/admin/manage-accounts", icon: Briefcase, label: "Manage Accounts" },
    { href: "/admin/manage-cashback", icon: PlusCircle, label: "Manage Cashback" },
    { href: "/admin/manage-withdrawals", icon: ArrowDownUp, label: "Manage Withdrawals" },
    { href: "/admin/manage-payment-methods", icon: Wallet, label: "Payment Methods" },
    { href: "/admin/manage-brokers", icon: Briefcase, label: "Manage Brokers" },
    { href: "/admin/manage-banner", icon: GalleryHorizontal, label: "Manage Banner" },
];

const storeLinks = [
    { href: "/admin/manage-categories", icon: List, label: "Manage Categories" },
    { href: "/admin/manage-products", icon: Package, label: "Manage Products" },
    { href: "/admin/manage-orders", icon: ShoppingBag, label: "Manage Orders" },
];

function NavLinks({ currentPathname }: { currentPathname: string }) {
    return (
        <nav className="flex flex-col gap-1 p-2 flex-1 overflow-y-auto">
            <p className="px-3 py-2 text-xs font-semibold text-muted-foreground">Main</p>
            {navLinks.map(link => (
                <Link
                    key={link.href}
                    href={link.href}
                    className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", {
                        "bg-primary/10 text-primary": currentPathname === link.href,
                    })}
                >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                </Link>
            ))}
            <p className="px-3 py-2 mt-4 text-xs font-semibold text-muted-foreground">Store</p>
            {storeLinks.map(link => (
                <Link
                    key={link.href}
                    href={link.href}
                    className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", {
                        "bg-primary/10 text-primary": currentPathname.startsWith(link.href),
                    })}
                >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                </Link>
            ))}
        </nav>
    );
}

function SidebarHeader() {
    return (
        <div className="p-4 border-b">
            <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-6 h-6 text-primary-foreground"><path fill="currentColor" d="M213.38 181.38a8 8 0 0 1-10.76 1.35A103.92 103.92 0 0 0 128 160a103.92 103.92 0 0 0-74.62 22.73a8 8 0 1 1-9.41-12.7A119.92 119.92 0 0 1 128 144a119.92 119.92 0 0 1 83.94 25.32a8 8 0 0 1 1.44 12.06M240 128a112 112 0 1 1-112-112a112 112 0 0 1 112 112m-24 0a88 88 0 1 0-88 88a88.1 88.1 0 0 0 88-88"/></svg>
                </div>
                <span className="font-headline text-lg">Cashback Tracker</span>
            </Link>
        </div>
    )
}

function UserInfoFooter({ user }: { user: any }) {
    return (
        <div className="mt-auto p-4 border-t space-y-2">
            <div className="text-sm">
                <p className="font-semibold">{user?.profile?.name || 'Admin'}</p>
                <p className="text-muted-foreground">{user?.email}</p>
            </div>
             <Link
                href="/"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
                <LogOut className="h-4 w-4" />
                Logout
            </Link>
        </div>
    )
}


export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    
    const { user } = useAuthContext();
    const pathname = usePathname();

    const DesktopNav = () => (
         <div className="flex flex-col h-full">
            <SidebarHeader />
            <NavLinks currentPathname={pathname} />
            <UserInfoFooter user={user} />
        </div>
    );
    
    const MobileNav = () => (
        <>
            <SheetHeader className="p-4 border-b">
                <SheetTitle>
                    <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-6 h-6 text-primary-foreground"><path fill="currentColor" d="M213.38 181.38a8 8 0 0 1-10.76 1.35A103.92 103.92 0 0 0 128 160a103.92 103.92 0 0 0-74.62 22.73a8 8 0 1 1-9.41-12.7A119.92 119.92 0 0 1 128 144a119.92 119.92 0 0 1 83.94 25.32a8 8 0 0 1 1.44 12.06M240 128a112 112 0 1 1-112-112a112 112 0 0 1 112 112m-24 0a88 88 0 1 0-88 88a88.1 88.1 0 0 0 88-88"/></svg>
                        </div>
                        <span className="font-headline text-lg">Cashback Tracker</span>
                    </Link>
                </SheetTitle>
            </SheetHeader>
            <NavLinks currentPathname={pathname} />
            <UserInfoFooter user={user} />
        </>
    );

    return (
        <AuthProvider>
            <AdminGuard>
                 <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
                    <aside className="hidden border-r bg-muted/40 md:block">
                        <DesktopNav />
                    </aside>
                    <div className="flex flex-col">
                        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 md:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="icon">
                                        <Menu className="h-5 w-5" />
                                        <span className="sr-only">Toggle navigation menu</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="flex flex-col p-0 w-full max-w-sm">
                                    <MobileNav />
                                </SheetContent>
                            </Sheet>
                            <h1 className="text-lg font-semibold font-headline">Admin Panel</h1>
                        </header>
                        <main className="flex flex-1 flex-col p-4 lg:p-6">
                            {children}
                        </main>
                    </div>
                 </div>
            </AdminGuard>
        </AuthProvider>
    )
}
