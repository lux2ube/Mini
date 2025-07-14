import Link from "next/link";
import {
    CircleUser,
    Menu,
    DollarSign,
    Settings,
    LayoutDashboard,
    CreditCard,
    Briefcase,
    Landmark
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
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
        { href: "/dashboard/brokers", icon: Briefcase, label: "Brokers" },
        { href: "/dashboard/my-accounts", icon: CreditCard, label: "My Accounts" },
        { href: "/dashboard/withdraw", icon: Landmark, label: "Withdraw" },
        { href: "/dashboard/settings", icon: Settings, label: "Settings" },
    ];

    return (
        <AuthProvider>
            <AuthGuard>
                <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
                    <div className="hidden border-r bg-muted/40 md:block">
                        <div className="flex h-full max-h-screen flex-col gap-2">
                            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M15.5 8.5 12 12l-3.5 3.5"/><path d="m8.5 8.5 7 7"/></svg>
                                    </div>
                                    <span className="">Cashback Companion</span>
                                </Link>
                            </div>
                            <div className="flex-1">
                                <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                                    {navLinks.map(link => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                                        >
                                            <link.icon className="h-4 w-4" />
                                            {link.label}
                                        </Link>
                                    ))}
                                </nav>
                            </div>
                            <div className="mt-auto p-4">
                                <Card>
                                    <CardHeader className="p-2 pt-0 md:p-4">
                                        <CardTitle>Need Help?</CardTitle>
                                        <CardDescription>
                                            Contact support for assistance with your account.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                                        <Button size="sm" className="w-full">
                                            Contact Support
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="shrink-0 md:hidden"
                                    >
                                        <Menu className="h-5 w-5" />
                                        <span className="sr-only">Toggle navigation menu</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="flex flex-col">
                                    <SheetHeader>
                                        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                                    </SheetHeader>
                                    <nav className="grid gap-2 text-lg font-medium">
                                        <Link
                                            href="/dashboard"
                                            className="flex items-center gap-2 text-lg font-semibold mb-4"
                                        >
                                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M15.5 8.5 12 12l-3.5 3.5"/><path d="m8.5 8.5 7 7"/></svg>
                                            </div>
                                            <span className="">Cashback Companion</span>
                                        </Link>
                                        {navLinks.map(link => (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                                            >
                                                <link.icon className="h-5 w-5" />
                                                {link.label}
                                            </Link>
                                        ))}
                                    </nav>
                                </SheetContent>
                            </Sheet>
                            <div className="w-full flex-1">
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
                                    <Link href="/dashboard/settings">
                                        <DropdownMenuItem>Settings</DropdownMenuItem>
                                    </Link>
                                    <DropdownMenuItem>Support</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <Link href="/">
                                        <DropdownMenuItem>Logout</DropdownMenuItem>
                                    </Link>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </header>
                        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                            {children}
                        </main>
                    </div>
                </div>
            </AuthGuard>
        </AuthProvider>
    )
}
