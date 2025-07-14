
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, CheckCircle, HandCoins, LinkIcon as LucideLinkIcon, LogIn, Milestone, Star, Users, BotMessageSquare } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {

  const howItWorksSteps = [
    {
      icon: <LogIn className="w-8 h-8 text-primary" />,
      title: "Sign Up for Free",
      description: "Create your account in seconds with just your email. No lengthy forms, no fees.",
    },
    {
      icon: <LucideLinkIcon className="w-8 h-8 text-primary" />,
      title: "Link Your Trading Account",
      description: "Securely connect your existing trading account from any of our partner brokers.",
    },
    {
      icon: <HandCoins className="w-8 h-8 text-primary" />,
      title: "Trade & Earn Cashback",
      description: "Trade as you normally would. We track your trades and automatically credit cashback to your account.",
    },
  ];

  const benefits = [
    { title: "Up to $12 per lot traded", description: "Earn one of the highest cashback rates in the industry." },
    { title: "Instant Cashback Tracking", description: "See your earnings accumulate in real-time on your dashboard." },
    { title: "Monthly Performance Reports", description: "Get detailed reports to track your trading volume and earnings." },
    { title: "Flexible Withdrawals", description: "Withdraw your cashback in USDT, via local bank transfer, or PayPal." },
    { title: "Personal Dashboard", description: "A simple, powerful dashboard to manage everything in one place." },
    { title: "AI-Powered Insights", description: "Leverage AI to understand project rules and maximize your earnings potential." },
  ];

  const faqs = [
    {
      question: "How do I link my account?",
      answer: "After signing up, go to the 'Brokers' page, select your broker, and follow the simple on-screen instructions to enter your trading account number. We'll handle the rest!"
    },
    {
      question: "Is cashback guaranteed?",
      answer: "Yes! As long as your account is correctly linked under our partner ID and you are trading eligible instruments, cashback is guaranteed. We are paid by the broker, and we share that revenue with you."
    },
    {
      question: "When do I get paid?",
      answer: "Cashback is typically calculated and credited to your dashboard daily or weekly, depending on the broker. You can request a withdrawal anytime once your balance meets the minimum threshold."
    },
    {
      question: "Can I link an existing trading account?",
      answer: "In many cases, yes. However, some brokers require a new account to be opened under our partner link. Our broker detail pages provide specific instructions for each partner."
    }
  ];
  
  const brokerLogos = [
    { name: 'Exness', url: 'https://placehold.co/150x50.png', hint: 'logo' },
    { name: 'IC Markets', url: 'https://placehold.co/150x50.png', hint: 'logo' },
    { name: 'Pepperstone', url: 'https://placehold.co/150x50.png', hint: 'logo' },
    { name: 'OctaFX', url: 'https://placehold.co/150x50.png', hint: 'logo' },
    { name: 'XM', url: 'https://placehold.co/150x50.png', hint: 'logo' },
    { name: 'HFM', url: 'https://placehold.co/150x50.png', hint: 'logo' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="#" className="flex items-center gap-2 font-semibold mr-6">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-6 h-6 text-primary-foreground"><path fill="currentColor" d="M213.38 181.38a8 8 0 0 1-10.76 1.35A103.92 103.92 0 0 0 128 160a103.92 103.92 0 0 0-74.62 22.73a8 8 0 1 1-9.41-12.7A119.92 119.92 0 0 1 128 144a119.92 119.92 0 0 1 83.94 25.32a8 8 0 0 1 1.44 12.06M240 128a112 112 0 1 1-112-112a112 112 0 0 1 112 112m-24 0a88 88 0 1 0-88 88a88.1 88.1 0 0 0 88-88"/></svg>
            </div>
            <span className="font-headline text-lg">Cashback Companion</span>
          </Link>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <Button asChild variant="ghost">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started <ArrowRight className="ml-2" /></Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 sm:py-28 text-center bg-muted/20">
          <div className="container">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl font-headline text-primary">
              Earn Real Cashback Every Time You Trade
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Works with top brokers like Exness, IC Markets, & XM. We pay you for the trades you're already making. Zero risk, zero fees, just pure cashback.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/register">Start Earning Cashback</Link>
              </Button>
            </div>
             <p className="mt-4 text-sm text-muted-foreground">
               ✅ No Risk – We Pay You for Trading  |  ✅ Withdraw Anytime
            </p>
          </div>
        </section>

        {/* Trust & Proof Section */}
        <section className="py-16 sm:py-24 bg-background">
          <div className="container">
            <div className="text-center">
              <h2 className="text-3xl font-bold font-headline">Built on Trust, Proven by Numbers</h2>
              <p className="mt-4 text-muted-foreground max-w-xl mx-auto">We're official partners with the world's most reputable brokers.</p>
            </div>
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="space-y-1">
                <Users className="w-10 h-10 mx-auto text-primary" />
                <p className="text-2xl font-bold">10,000+</p>
                <p className="text-muted-foreground">Traders Served</p>
              </div>
              <div className="space-y-1">
                <Milestone className="w-10 h-10 mx-auto text-primary" />
                <p className="text-2xl font-bold">8+</p>
                <p className="text-muted-foreground">Official Broker Partners</p>
              </div>
              <div className="space-y-1">
                <Star className="w-10 h-10 mx-auto text-primary" />
                <p className="text-2xl font-bold">4.9 ⭐</p>
                <p className="text-muted-foreground">On TrustPilot</p>
              </div>
               <div className="space-y-1">
                <BotMessageSquare className="w-10 h-10 mx-auto text-primary" />
                <p className="text-2xl font-bold">AI-Powered</p>
                <p className="text-muted-foreground">For Clarity & Insights</p>
              </div>
            </div>
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-x-8 gap-y-4 items-center">
              {brokerLogos.map(logo => (
                <Image 
                    key={logo.name}
                    src={logo.url} 
                    alt={`${logo.name} logo`} 
                    width={150} 
                    height={50}
                    className="aspect-[3/1] object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all"
                    data-ai-hint={logo.hint}
                />
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 sm:py-24 bg-muted/40">
          <div className="container max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold font-headline">Get Paid in 3 Simple Steps</h2>
              <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Start earning cashback in under 5 minutes. It's that easy.</p>
            </div>
            <div className="space-y-8">
              {howItWorksSteps.map((step, index) => (
                <Card key={index} className="p-6 flex gap-6 items-start shadow-md hover:shadow-lg transition-shadow">
                  <div className="bg-primary/10 p-4 rounded-full">
                    {step.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary">STEP {index + 1}</p>
                    <h3 className="text-xl font-bold font-headline mt-1">{step.title}</h3>
                    <p className="mt-2 text-muted-foreground">{step.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* Benefits Section */}
        <section id="benefits" className="py-16 sm:py-24 bg-background">
           <div className="container">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold font-headline">Everything You Need to Succeed</h2>
                <p className="mt-4 text-muted-foreground max-w-xl mx-auto">We provide the best rates and tools to maximize your earnings.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-muted/40">
                        <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="font-semibold">{benefit.title}</h3>
                            <p className="text-sm text-muted-foreground">{benefit.description}</p>
                        </div>
                    </div>
                ))}
              </div>
           </div>
        </section>

        {/* Demo Preview */}
        <section className="py-16 sm:py-24 bg-muted/40">
            <div className="container text-center">
                <h2 className="text-3xl font-bold font-headline">Your Powerful, Simple Dashboard</h2>
                <p className="mt-4 text-muted-foreground max-w-xl mx-auto">This is where you track earnings, link accounts, and request withdrawals. Everything is simple.</p>
                <div className="mt-8">
                    <Image 
                        src="https://placehold.co/1200x700.png"
                        alt="Dashboard Preview"
                        width={1200}
                        height={700}
                        className="rounded-xl shadow-2xl border-4 border-foreground/5 mx-auto"
                        data-ai-hint="dashboard analytics"
                    />
                </div>
            </div>
        </section>


        {/* Final CTA */}
        <section className="py-20 sm:py-28 text-center bg-primary text-primary-foreground">
          <div className="container">
            <h2 className="text-3xl font-extrabold tracking-tight lg:text-4xl font-headline">
              Ready to Earn Cashback on Every Trade?
            </h2>
            <div className="mt-8 flex justify-center">
              <Button asChild size="lg" variant="secondary" className="text-lg">
                <Link href="/register">
                  Start Free – Link My Account
                </Link>
              </Button>
            </div>
             <p className="mt-4 text-sm text-primary-foreground/80">
               No fees. No contracts. Just cashback.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-16 sm:py-24 bg-background">
          <div className="container max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold font-headline">Frequently Asked Questions</h2>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-lg font-semibold text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-muted/40 border-t">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 font-semibold">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-6 h-6 text-primary-foreground"><path fill="currentColor" d="M213.38 181.38a8 8 0 0 1-10.76 1.35A103.92 103.92 0 0 0 128 160a103.92 103.92 0 0 0-74.62 22.73a8 8 0 1 1-9.41-12.7A119.92 119.92 0 0 1 128 144a119.92 119.92 0 0 1 83.94 25.32a8 8 0 0 1 1.44 12.06M240 128a112 112 0 1 1-112-112a112 112 0 0 1 112 112m-24 0a88 88 0 1 0-88 88a88.1 88.1 0 0 0 88-88"/></svg>
                </div>
                <span>Cashback Companion</span>
            </div>
            <nav className="flex gap-4 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-primary">About</Link>
              <Link href="#" className="hover:text-primary">Contact</Link>
              <Link href="#" className="hover:text-primary">Terms</Link>
              <Link href="#" className="hover:text-primary">Privacy</Link>
            </nav>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Cashback Companion. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
