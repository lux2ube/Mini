
"use client";

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Mail, Lock, KeyRound } from 'lucide-react';
import { handleRegisterUser } from '../actions';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const referralCodeFromUrl = searchParams.get('ref');

  useEffect(() => {
    if (referralCodeFromUrl) {
      setReferralCode(referralCodeFromUrl);
    }
  }, [referralCodeFromUrl]);


  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "خطأ", description: "كلمات المرور غير متطابقة." });
      return;
    }
    if (password.length < 6) {
      toast({ variant: "destructive", title: "خطأ", description: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل." });
      return;
    }
    setIsLoading(true);

    const result = await handleRegisterUser({
        name,
        email,
        password,
        referralCode: referralCode || undefined,
    });

    if (result.success) {
        window.dispatchEvent(new CustomEvent('refetchUser'));
        toast({ type: "success", title: "نجاح", description: "تم إنشاء الحساب بنجاح. جارٍ إعادة التوجيه..." });
        router.push('/dashboard');
    } else {
        toast({ variant: 'destructive', title: "فشل التسجيل", description: result.error });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
       <div className="max-w-[400px] w-full mx-auto space-y-4">
        <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold font-headline">إنشاء حساب</h1>
            <p className="text-muted-foreground">انضم إلينا وابدأ في الكسب.</p>
        </div>
        <Card>
            <CardContent className="p-4">
                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">الاسم الكامل</Label>
                         <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="name" type="text" placeholder="جون دو" required value={name} onChange={(e) => setName(e.target.value)} className="pl-10"/>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">البريد الإلكتروني</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10"/>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">كلمة المرور</Label>
                         <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10"/>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                         <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10"/>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="referral-code">رمز الإحالة (اختياري)</Label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="referral-code" type="text" placeholder="مثال: JOH123" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} className="pl-10"/>
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : "إنشاء حساب"}
                    </Button>
                </form>
            </CardContent>
        </Card>
        <div className="text-center text-sm">
            هل لديك حساب بالفعل؟{' '}
            <Link href="/login" className="underline text-primary">
                تسجيل الدخول
            </Link>
        </div>
       </div>
    </div>
  );
}
