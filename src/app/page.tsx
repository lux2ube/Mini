import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6">
        <div className="flex justify-center items-center gap-3">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-10 h-10 text-primary-foreground"><path fill="currentColor" d="M213.38 181.38a8 8 0 0 1-10.76 1.35A103.92 103.92 0 0 0 128 160a103.92 103.92 0 0 0-74.62 22.73a8 8 0 1 1-9.41-12.7A119.92 119.92 0 0 1 128 144a119.92 119.92 0 0 1 83.94 25.32a8 8 0 0 1 1.44 12.06M240 128a112 112 0 1 1-112-112a112 112 0 0 1 112 112m-24 0a88 88 0 1 0-88 88a88.1 88.1 0 0 0 88-88"/></svg>
            </div>
            <h1 className="text-5xl font-bold font-headline text-primary">
              Cashback Companion
            </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your AI-powered assistant for managing and calculating cashback rewards. Get started by logging in.
        </p>
        <Button asChild size="lg">
          <Link href="/login">
            Proceed to Login <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
       <footer className="absolute bottom-0 py-6 text-center text-sm text-muted-foreground">
          <p>AI-powered insights for Cashback Companion.</p>
        </footer>
    </div>
  );
}
