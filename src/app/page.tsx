
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, CheckCircle, HandCoins, LinkIcon as LucideLinkIcon, LogIn } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';

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
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow max-w-[400px] mx-auto w-full px-4 py-4 space-y-8">
        <header className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-10 h-10 text-primary-foreground"><path fill="currentColor" d="M213.38 181.38a8 8 0 0 1-10.76 1.35A103.92 103.92 0 0 0 128 160a103.92 103.92 0 0 0-74.62 22.73a8 8 0 1 1-9.41-12.7A119.92 119.92 0 0 1 128 144a119.92 119.92 0 0 1 83.94 25.32a8 8 0 0 1 1.44 12.06M240 128a112 112 0 1 1-112-112a112 112 0 0 1 112 112m-24 0a88 88 0 1 0-88 88a88.1 88.1 0 0 0 88-88"/></svg>
          </div>
          <h1 className="text-3xl font-extrabold font-headline text-primary">
            Earn Cashback Every Time You Trade
          </h1>
          <p className="text-muted-foreground">
            Zero risk, zero fees, just pure cashback. We pay you for the trades you're already making.
          </p>
          <div className="w-full space-y-2">
              <Button asChild className="w-full">
                  <Link href="/register">Get Started</Link>
              </Button>
              <Button asChild variant="secondary" className="w-full">
                <Link href="/login">Login</Link>
              </Button>
          </div>
        </header>

        <main className="space-y-8">
          <section id="how-it-works">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold font-headline">How It Works</h2>
            </div>
            <div className="flex flex-col space-y-4">
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
          </section>
          
          <section id="benefits">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold font-headline">Our Benefits</h2>
            </div>
            <div className="space-y-2">
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/40">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      <p className="text-sm text-muted-foreground">Up to $12 per lot traded</p>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/40">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      <p className="text-sm text-muted-foreground">Instant Cashback Tracking</p>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/40">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      <p className="text-sm text-muted-foreground">Flexible Withdrawals in USDT</p>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/40">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      <p className="text-sm text-muted-foreground">AI-Powered Rule Insights</p>
                  </div>
            </div>
          </section>

          <section id="faq">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold font-headline">FAQ</h2>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>

                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </main>
      </div>
      <footer className="w-full border-t bg-background">
          <div className="max-w-[400px] mx-auto px-4 py-8">
              <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                      <h3 className="font-semibold mb-2 font-headline">Quick Links</h3>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                          <li><Link href="/about" className="hover:text-primary">About Us</Link></li>
                          <li><Link href="/contact" className="hover:text-primary">Contact Us</Link></li>
                          <li><Link href="/login" className="hover:text-primary">Login</Link></li>
                          <li><Link href="/register" className="hover:text-primary">Sign Up</Link></li>
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
    </div>
  );
}
