
import Link from "next/link";
import { Button } from "@/components/ui/button";

function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-5xl mx-auto px-4">
                <div className="flex h-14 items-center justify-between">
                     <Link href="/" className="flex items-center gap-2 font-semibold">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-6 h-6 text-primary-foreground"><path fill="currentColor" d="M213.38 181.38a8 8 0 0 1-10.76 1.35A103.92 103.92 0 0 0 128 160a103.92 103.92 0 0 0-74.62 22.73a8 8 0 1 1-9.41-12.7A119.92 119.92 0 0 1 128 144a119.92 119.92 0 0 1 83.94 25.32a8 8 0 0 1 1.44 12.06M240 128a112 112 0 1 1-112-112a112 112 0 0 1 112 112m-24 0a88 88 0 1 0-88 88a88.1 88.1 0 0 0 88-88"/></svg>
                        </div>
                        <span className="font-headline text-lg hidden sm:inline-block">Cashback Companion</span>
                    </Link>
                    <nav className="flex items-center gap-4">
                        <Button variant="ghost" asChild><Link href="/about">About</Link></Button>
                        <Button variant="ghost" asChild><Link href="/contact">Contact</Link></Button>
                        <Button asChild><Link href="/login">Login</Link></Button>
                    </nav>
                </div>
            </div>
        </header>
    );
}

function Footer() {
    return (
        <footer className="border-t">
            <div className="max-w-5xl mx-auto py-6 px-4 text-center text-sm text-muted-foreground">
                © {new Date().getFullYear()} Cashback Companion. All rights reserved.
            </div>
        </footer>
    );
}


export default function StaticPagesLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
        </div>
    )
}
