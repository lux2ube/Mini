import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold font-headline text-primary">
          Welcome to Cashback Companion
        </h1>
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
