
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
    Gift
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { AuthProvider } from "@/hooks/useAuthContext";
import { AuthGuard } from "@/components/shared/AuthGuard";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const navLinks = [
        { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/dashboard/my-accounts", icon: Users, label: "My Accounts" },
        { href: "/dashboard/brokers", icon: Briefcase, label: "Brokers" },
        { href: "/dashboard/transactions", icon: ReceiptText, label: "Transactions" },
        { href: "/dashboard/referrals", icon: Gift, label: "Referrals" },
        { href: "/dashboard/withdraw", icon: Landmark, label: "Withdraw" },
        { href: "/dashboard/settings", icon: Settings, label: "Settings" },
    ];

    return (
        <AuthProvider>
            <AuthGuard>
                <div className="flex flex-col min-h-screen w-full">
                    <header className="sticky top-0 flex h-14 items-center gap-4 border-b bg-background px-4">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Toggle navigation menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="flex flex-col p-0">
                                <SheetHeader className="p-4 border-b">
                                    <SheetTitle>
                                         <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-6 h-6 text-primary-foreground"><path fill="currentColor" d="M213.38 181.38a8 8 0 0 1-10.76 1.35A103.92 103.92 0 0 0 128 160a103.92 103.92 0 0 0-74.62 22.73a8 8 0 1 1-9.41-12.7A119.92 119.92 0 0 1 128 144a119.92 119.92 0 0 1 83.94 25.32a8 8 0 0 1 1.44 12.06M240 128a112 112 0 1 1-112-112a112 112 0 0 1 112 112m-24 0a88 88 0 1 0-88 88a88.1 88.1 0 0 0 88-88"/></svg>
                                            </div>
                                            <span className="font-headline">Cashback Companion</span>
                                        </Link>
                                    </SheetTitle>
                                </SheetHeader>
                                <nav className="grid gap-2 text-lg font-medium p-4">
                                    {navLinks.map(link => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className="flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                                        >
                                            <link.icon className="h-5 w-5" />
                                            {link.label}
                                        </Link>
                                    ))}
                                </nav>
                                <div className="mt-auto p-4 border-t">
                                     <Link
                                        href="/"
                                        className="flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                                    >
                                        <LogOut className="h-5 w-5" />
                                        Logout
                                    </Link>
                                </div>
                            </SheetContent>
                        </Sheet>
                        <div className="w-full flex-1">
                            <h1 className="text-lg font-semibold font-headline">Cashback Companion</h1>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="icon" className="rounded-full">
                                    <CircleUser className="h-5 w-5" />
                                    <span className="sr-only">Toggle user menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <Link href="/dashboard/settings"><DropdownMenuItem>Settings</DropdownMenuItem></Link>
                                <DropdownMenuItem>Support</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <Link href="/"><DropdownMenuItem>Logout</DropdownMenuItem></Link>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </header>
                    <main className="flex flex-1 flex-col">
                        {children}
                    </main>
                </div>
            </AuthGuard>
        </AuthProvider>
    )
}
