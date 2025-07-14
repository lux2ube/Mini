import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SummaryGenerator } from "@/components/summary-generator";
import { CashbackCalculator } from "@/components/cashback-calculator";
import { CheckCircle2, Code, Github, LogOut, User } from "lucide-react";
import Link from 'next/link';

const features = [
  "Rule-based cashback calculation engine",
  "RESTful API for transaction processing",
  "Merchant Category Code (MCC) blacklisting",
  "Sophisticated logic for multiple cashback criteria",
  "Written in Go for high performance",
];

const techStack = [
  { name: "Go", type: "Language" },
  { name: "Gorilla Mux", type: "Library" },
  { name: "REST API", type: "Architecture" },
  { name: "JSON", type: "Data Format" },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M15.5 8.5 12 12l-3.5 3.5"/><path d="m8.5 8.5 7 7"/></svg>
             </div>
            <h1 className="text-2xl font-bold font-headline text-foreground">
              Cashback Companion
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/login" aria-label="Logout">
                    <LogOut className="h-5 w-5" />
                </Link>
            </Button>
            <Button variant="ghost" size="icon" aria-label="Profile">
                <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto p-4 md:p-8 lg:p-12">
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
          
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-headline">Project Overview</CardTitle>
              <CardDescription>
                High-level details for the <code>tcb4dev/cashback1</code> repository.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                This project is a sophisticated cashback calculation system designed to process customer transactions and determine applicable cashback rewards based on a complex set of rules.
              </p>
              <Button variant="outline" asChild>
                <Link href="https://github.com/tcb4dev/cashback1" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  <span>View on GitHub</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          <SummaryGenerator />

          <CashbackCalculator />

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-headline">Key Features</CardTitle>
              <CardDescription>Core functionalities of the cashback project.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
             <CardHeader>
              <CardTitle className="font-headline">Technology Stack</CardTitle>
              <CardDescription>Tools used in the project.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
               {techStack.map((tech) => (
                <div key={tech.name} className="flex items-center gap-3">
                   <Code className="h-6 w-6 text-primary shrink-0" />
                   <div>
                    <p className="font-semibold text-sm">{tech.name}</p>
                    <p className="text-xs text-muted-foreground">{tech.type}</p>
                   </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
       <footer className="py-6 border-t bg-background/50">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>AI-powered insights for Cashback Companion.</p>
        </div>
      </footer>
    </div>
  );
}
