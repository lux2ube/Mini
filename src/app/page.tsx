import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6">
        <div className="flex justify-center items-center gap-3">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M15.5 8.5 12 12l-3.5 3.5"/><path d="m8.5 8.5 7 7"/></svg>
            </div>
            <h1 className="text-5xl font-bold font-headline text-primary">
              Cashback Companion
            </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your AI-powered assistant for managing and calculating cashback rewards. Get started by logging in.
        </p>
        <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
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

    