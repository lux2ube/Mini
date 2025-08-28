
'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Mail, Lock, KeyRound } from 'lucide-react';
import { handleRegisterUser } from '../actions';

function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
        setReferralCode(refCode);
    }
  }, [searchParams]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Passwords do not match." });
      return;
    }
     if (password.length < 6) {
      toast({ variant: "destructive", title: "Error", description: "Password must be at least 6 characters." });
      return;
    }
    setIsLoading(true);

    const result = await handleRegisterUser({
        name,
        email,
        password,
        referralCode,
    });

    if (result.success) {
        toast({ type: "success", title: "Success!", description: "Account created successfully. Please log in." });
        router.push('/login');
    } else {
        toast({ variant: 'destructive', title: "Registration Failed", description: result.error });
    }

    setIsLoading(false);
  };

  return (
    <div className="max-w-[400px] w-full mx-auto space-y-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold font-headline">Create an Account</h1>
        <p className="text-muted-foreground">Join us and start earning.</p>
      </div>
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="name" type="text" placeholder="John Doe" required value={name} onChange={(e) => setName(e.target.value)} className="pl-10"/>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10"/>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10"/>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10"/>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="referral-code">Referral Code (Optional)</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="referral-code" type="text" placeholder="e.g., JOHN123" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} className="pl-10"/>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : "Create Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" className="underline text-primary">
          Login
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Suspense fallback={<div className="h-screen w-screen flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                <RegisterForm />
            </Suspense>
        </div>
    );
}
