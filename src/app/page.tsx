
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, CheckCircle, HandCoins, LinkIcon as LucideLinkIcon, LogIn } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';

function Footer() {
    return (
        <footer className="w-full border-t bg-gradient-to-br from-primary/10 via-background to-background text-foreground">
             <div className="max-w-5xl mx-auto px-4 py-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center md:text-left">
                  <div className="col-span-2 md:col-span-1">
                      <Link href="/" className="flex items-center justify-center md:justify-start gap-2 font-semibold">
                          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-primary-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"></path><path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                          </div>
                          <span className="font-headline text-lg">Cashback Companion</span>
                      </Link>
                      <p className="text-xs text-muted-foreground mt-2">
                        Earn cashback every time you trade.
                      </p>
                  </div>
                  <div>
                      <h3 className="font-semibold mb-2 font-headline">Quick Links</h3>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                          <li><Link href="/about" className="hover:text-primary">About Us</Link></li>
                          <li><Link href="/contact" className="hover:text-primary">Contact Us</Link></li>
                      </ul>
                  </div>
                  <div>
                      <h3 className="font-semibold mb-2 font-headline">Account</h3>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                          <li><Link href="/login" className="hover:text-primary">Login</Link></li>
                          <li><Link href="/register" className="hover:text-primary">Sign Up</Link></li>
                          <li><Link href="/dashboard" className="hover:text-primary">Dashboard</Link></li>
                      </ul>
                  </div>
                   <div>
                      <h3 className="font-semibold mb-2 font-headline">Legal</h3>
                       <ul className="space-y-1 text-sm text-muted-foreground">
                          <li><Link href="#" className="hover:text-primary">Privacy Policy</Link></li>
                          <li><Link href="#" className="hover:text-primary">Terms of Service</Link></li>
                      </ul>
                  </div>
              </div>
              <div className="text-center text-xs text-muted-foreground pt-8 mt-8 border-t">
                  © {new Date().getFullYear()} Cashback Companion. All rights reserved.
              </div>
          </div>
        </footer>
    );
}

export default function Home() {
  const howItWorksSteps = [
    { title: "Sign Up for Free", description: "Create your account in seconds." },
    { title: "Link Your Trading Account", description: "Connect your account from our partner brokers." },
    { title: "Trade & Earn Cashback", description: "We track trades and credit your account." },
  ];

  const faqs = [
    { question: "How do I link my account?", answer: "Go to the 'Brokers' page, select your broker, and follow the simple on-screen instructions." },
    { question: "Is cashback guaranteed?", answer: "Yes! As long as your account is correctly linked under our partner ID, cashback is guaranteed." },
    { question: "When do I get paid?", answer: "Cashback is credited to your dashboard daily or weekly. You can request a withdrawal anytime." },
    { question: "Can I link an existing account?", answer: "In many cases, yes. Some brokers require a new account. Our app provides instructions for each." }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-5xl mx-auto px-4">
                <div className="flex h-14 items-center justify-between">
                     <Link href="/" className="flex items-center gap-2 font-semibold">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-primary-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"></path><path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
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
      
      <main className="flex-grow">
        <section className="py-16 md:py-24">
            <div className="max-w-5xl mx-auto px-4 text-center">
                <h1 className="text-4xl md:text-6xl font-extrabold font-headline text-primary">
                    Earn Cashback Every Time You Trade
                </h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                    Zero risk, zero fees, just pure cashback. We pay you for the trades you're already making.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                    <Button asChild size="lg">
                        <Link href="/register">Get Started Free</Link>
                    </Button>
                    <Button asChild variant="secondary" size="lg">
                        <Link href="/dashboard/brokers">View Brokers</Link>
                    </Button>
                </div>
            </div>
        </section>
        
        <section id="how-it-works" className="py-16 md:py-24 bg-muted/50">
           <div className="max-w-5xl mx-auto px-4">
                <div className="text-center mb-12">
                <h2 className="text-3xl font-bold font-headline">How It Works</h2>
                <p className="text-muted-foreground mt-2">A simple, three-step process to boost your earnings.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                {howItWorksSteps.map((step, index) => (
                    <Card key={index}>
                    <CardHeader>
                        <p className="text-sm font-semibold text-primary">STEP {index + 1}</p>
                        <CardTitle>{step.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{step.description}</p>
                    </CardContent>
                    </Card>
                ))}
                </div>
            </div>
        </section>
        
        <section id="benefits" className="py-16 md:py-24">
            <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold font-headline">Unmatched Benefits</h2>
                    <p className="text-muted-foreground">We are focused on providing the best possible cashback experience for traders.</p>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/40">
                            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="font-semibold">Highest Rates</h3>
                                <p className="text-sm text-muted-foreground">Up to $12 per lot traded with our premium partner brokers.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/40">
                            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                             <div>
                                <h3 className="font-semibold">Instant Tracking</h3>
                                <p className="text-sm text-muted-foreground">Your cashback is tracked and displayed on your dashboard in real-time.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/40">
                            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="font-semibold">Flexible Withdrawals</h3>
                                <p className="text-sm text-muted-foreground">Quick and easy withdrawals in USDT on multiple networks (BEP20, TRC20).</p>
                            </div>
                        </div>
                    </div>
                </div>
                 <div>
                    <Image 
                        src="https://placehold.co/600x600.png"
                        alt="Dashboard preview"
                        width={600}
                        height={600}
                        className="rounded-lg shadow-xl"
                        data-ai-hint="financial dashboard"
                    />
                </div>
            </div>
        </section>

        <section id="faq" className="py-16 md:py-24 bg-muted/50">
            <div className="max-w-3xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold font-headline">Frequently Asked Questions</h2>
                </div>
                <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left font-semibold">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                    </AccordionContent>
                    </AccordionItem>
                ))}
                </Accordion>
            </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
