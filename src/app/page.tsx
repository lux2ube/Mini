
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, CheckCircle, HandCoins, LinkIcon as LucideLinkIcon, LogIn, Facebook, Twitter, Instagram } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';

function Footer() {
    return (
        <footer className="w-full border-t bg-gradient-to-br from-primary/10 via-background to-background text-foreground">
             <div className="max-w-5xl mx-auto px-4 py-8">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center md:text-left">
                  <div className="col-span-2 md:col-span-1">
                      <Link href="/" className="flex items-center justify-center md:justify-start gap-2 font-semibold">
                          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-primary-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"></path><path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                          </div>
                          <span className="font-headline text-lg">رفيق الكاش باك</span>
                      </Link>
                      <p className="text-xs text-muted-foreground mt-2">
                        اكسب كاش باك في كل مرة تتداول.
                      </p>
                  </div>
                  <div>
                      <h3 className="font-semibold mb-2 font-headline">روابط سريعة</h3>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                          <li><Link href="/about" className="hover:text-primary">من نحن</Link></li>
                          <li><Link href="/contact" className="hover:text-primary">اتصل بنا</Link></li>
                      </ul>
                  </div>
                  <div>
                      <h3 className="font-semibold mb-2 font-headline">الحساب</h3>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                          <li><Link href="/login" className="hover:text-primary">تسجيل الدخول</Link></li>
                          <li><Link href="/register" className="hover:text-primary">إنشاء حساب</Link></li>
                          <li><Link href="/dashboard" className="hover:text-primary">لوحة التحكم</Link></li>
                      </ul>
                  </div>
                   <div>
                      <h3 className="font-semibold mb-2 font-headline">قانوني</h3>
                       <ul className="space-y-1 text-sm text-muted-foreground">
                          <li><Link href="#" className="hover:text-primary">سياسة الخصوصية</Link></li>
                          <li><Link href="/terms" className="hover:text-primary">شروط الخدمة</Link></li>
                      </ul>
                  </div>
                   <div>
                        <h3 className="font-semibold mb-2 font-headline">تابعنا</h3>
                        <div className="flex justify-center md:justify-start gap-4">
                            <Link href="#" className="text-muted-foreground hover:text-primary"><Facebook className="h-5 w-5" /></Link>
                            <Link href="#" className="text-muted-foreground hover:text-primary"><Twitter className="h-5 w-5" /></Link>
                            <Link href="#" className="text-muted-foreground hover:text-primary"><Instagram className="h-5 w-5" /></Link>
                        </div>
                   </div>
              </div>
              <div className="text-center text-xs text-muted-foreground pt-8 mt-8 border-t">
                  © {new Date().getFullYear()} رفيق الكاش باك. جميع الحقوق محفوظة.
              </div>
          </div>
        </footer>
    );
}

export default function Home() {
  const howItWorksSteps = [
    { title: "سجل مجاناً", description: "أنشئ حسابك في ثوانٍ." },
    { title: "اربط حساب التداول الخاص بك", description: "صل حسابك من وسطائنا الشركاء." },
    { title: "تداول واكسب الكاش باك", description: "نتتبع صفقاتك ونضيف الرصيد إلى حسابك." },
  ];

  const faqs = [
    { question: "كيف يمكنني ربط حسابي؟", answer: "اذهب إلى صفحة 'الوسطاء'، اختر وسيطك، واتبع التعليمات البسيطة التي تظهر على الشاشة." },
    { question: "هل الكاش باك مضمون؟", answer: "نعم! طالما أن حسابك مرتبط بشكل صحيح تحت هوية شريكنا، فإن الكاش باك مضمون." },
    { question: "متى أحصل على أموالي؟", answer: "يتم إضافة الكاش باك إلى لوحة التحكم الخاصة بك يوميًا أو أسبوعيًا. يمكنك طلب سحب في أي وقت." },
    { question: "هل يمكنني ربط حساب حالي؟", answer: "في كثير من الحالات، نعم. بعض الوسطاء يتطلبون حسابًا جديدًا. يوفر تطبيقنا تعليمات لكل وسيط." }
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
                        <span className="font-headline text-lg hidden sm:inline-block">رفيق الكاش باك</span>
                    </Link>
                    <nav className="flex items-center gap-4">
                        <Button variant="ghost" asChild><Link href="/about">من نحن</Link></Button>
                        <Button variant="ghost" asChild><Link href="/contact">اتصل بنا</Link></Button>
                        <Button asChild><Link href="/login">تسجيل الدخول</Link></Button>
                    </nav>
                </div>
            </div>
      </header>
      
      <main className="flex-grow">
        <section className="py-16 md:py-24">
            <div className="max-w-5xl mx-auto px-4 text-center">
                <h1 className="text-4xl md:text-6xl font-extrabold font-headline text-primary">
                    اربح كاش باك في كل مرة تتداول فيها
                </h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                    بدون مخاطر، بدون رسوم، فقط كاش باك صافي. نحن ندفع لك مقابل الصفقات التي تقوم بها بالفعل.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                    <Button asChild size="lg">
                        <Link href="/register">ابدأ مجاناً</Link>
                    </Button>
                    <Button asChild variant="secondary" size="lg">
                        <Link href="/dashboard/brokers">عرض الوسطاء</Link>
                    </Button>
                </div>
            </div>
        </section>
        
        <section id="how-it-works" className="py-16 md:py-24 bg-muted/50">
           <div className="max-w-5xl mx-auto px-4">
                <div className="text-center mb-12">
                <h2 className="text-3xl font-bold font-headline">كيف يعمل</h2>
                <p className="text-muted-foreground mt-2">عملية بسيطة من ثلاث خطوات لزيادة أرباحك.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                {howItWorksSteps.map((step, index) => (
                    <Card key={index}>
                    <CardHeader>
                        <p className="text-sm font-semibold text-primary">الخطوة {index + 1}</p>
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
                    <h2 className="text-3xl font-bold font-headline">مزايا لا مثيل لها</h2>
                    <p className="text-muted-foreground">نحن نركز على توفير أفضل تجربة كاش باك ممكنة للمتداولين.</p>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/40">
                            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="font-semibold">أعلى المعدلات</h3>
                                <p className="text-sm text-muted-foreground">تصل إلى 12 دولارًا لكل لوت يتم تداوله مع وسطائنا الشركاء المميزين.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/40">
                            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                             <div>
                                <h3 className="font-semibold">تتبع فوري</h3>
                                <p className="text-sm text-muted-foreground">يتم تتبع الكاش باك الخاص بك وعرضه على لوحة التحكم في الوقت الفعلي.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/40">
                            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="font-semibold">سحوبات مرنة</h3>
                                <p className="text-sm text-muted-foreground">سحوبات سريعة وسهلة بعملة USDT على شبكات متعددة (BEP20, TRC20).</p>
                            </div>
                        </div>
                    </div>
                </div>
                 <div>
                    <Image 
                        src="https://placehold.co/600x600.png"
                        alt="معاينة لوحة التحكم"
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
                    <h2 className="text-3xl font-bold font-headline">الأسئلة الشائعة</h2>
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
