
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { auth, db, googleProvider, appleProvider } from '@/lib/firebase/config';
import { signInWithEmailAndPassword, signInWithPopup, UserCredential } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { Loader2, Mail, Lock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { generateReferralCode } from '@/lib/referral';
import { logUserActivity } from '../admin/actions';
import { getClientSessionInfo } from '@/lib/device-info';

const GoogleIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
);

const AppleIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="currentColor" d="M15.22,6.15a3.33,3.33,0,0,0-2.3,1.07,3.61,3.61,0,0,0-1.12,2.44,4.24,4.24,0,0,0,.7,2.47,4.3,4.3,0,0,0,1.88,1.52,3.34,3.34,0,0,0,2.62,.19c.14-.06.28-.11.41-.18a3.34,3.34,0,0,0,1.21-1.25,4.06,4.06,0,0,0,.4-1.95,3.4,3.4,0,0,0-2.14-3.35,5.82,5.82,0,0,0-1.66-.22Zm.46,6.38a2.59,2.59,0,0,1-1.67.6,2.37,2.37,0,0,1-1.66-1.14,2.77,2.77,0,0,1-.53-1.6,2.53,2.53,0,0,1,.87-2,2.34,2.34,0,0,1,1.54-.64c.2,0,.39,0,.58,0a2.66,2.66,0,0,1,2.1,1.23,2.94,2.94,0,0,1,.26,1.49A2.46,2.46,0,0,1,15.68,12.53ZM12,24A12,12,0,1,0,0,12,12,12,0,0,0,12,24Zm-1.5-18.73a4.2,4.2,0,0,1,3.29-1.84,4,4,0,0,1,1.69.34,4.22,4.22,0,0,0-1.39-1.07,4.52,4.52,0,0,0-2.82-.49,4.45,4.45,0,0,0-3.4,2.1,4.42,4.42,0,0,0-1.35,3.22,4.2,4.2,0,0,0,1.35,3.25,4.51,4.51,0,0,0,5.83.21,4.18,4.18,0,0,0,1.4-1.17,4.23,4.23,0,0,1-3.32,1.86,4.07,4.07,0,0,1-1.7-.35,4.45,4.45,0,0,1-2.43-3A4.52,4.52,0,0,1,10.5,5.27Z"/></svg>
);


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLoginSuccess = async (userCredential: UserCredential) => {
    const user = userCredential.user;
    const clientInfo = await getClientSessionInfo();
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    const isNewUser = !userDoc.exists();

    // If user signs in via social and doesn't exist, create them
    if (isNewUser) {
        const newUserProfile = { 
            uid: user.uid,
            name: user.displayName || "New User", 
            email: user.email!, 
            role: "user" as const,
            createdAt: Timestamp.now(),
            referralCode: generateReferralCode(user.displayName || "user"),
            referredBy: null,
            referrals: [],
            points: 0,
            tier: 'Bronze' as const,
        };
        await setDoc(userDocRef, newUserProfile);
         // Log activity
        await logUserActivity(user.uid, 'signup', clientInfo, { method: userCredential.providerId || 'social' });
    } else {
        await logUserActivity(user.uid, 'login', clientInfo, { method: userCredential.providerId || 'email' });
    }
    
    // Dispatch event to force refetch of user data in layout
    window.dispatchEvent(new CustomEvent('refetchUser'));

    toast({
        type: "success",
        title: "Success",
        description: "Logged in successfully.",
    });

    const finalUserDoc = await getDoc(userDocRef);
    if (finalUserDoc.exists() && finalUserDoc.data()?.role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/dashboard');
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleLoginSuccess(userCredential);
    } catch (error: any) {
      toast({
        type: "error",
        title: "Login Failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: typeof googleProvider | typeof appleProvider) => {
    setIsSocialLoading(true);
    try {
        const userCredential = await signInWithPopup(auth, provider);
        await handleLoginSuccess(userCredential);
    } catch (error: any) {
         toast({
            type: "error",
            title: "Login Failed",
            description: error.code === 'auth/account-exists-with-different-credential'
                ? "An account already exists with this email address. Please sign in with your original method."
                : error.message,
        });
    } finally {
        setIsSocialLoading(false);
    }
  }


  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-[400px] w-full mx-auto space-y-4">
        <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold font-headline">Login</h1>
            <p className="text-muted-foreground">Access your account.</p>
        </div>
        <Card>
            <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => handleSocialLogin(googleProvider)} disabled={isSocialLoading || isLoading}>
                        {isSocialLoading ? <Loader2 className="animate-spin" /> : <><GoogleIcon /> Google</>}
                    </Button>
                    <Button variant="outline" onClick={() => handleSocialLogin(appleProvider)} disabled={isSocialLoading || isLoading}>
                       {isSocialLoading ? <Loader2 className="animate-spin" /> : <><AppleIcon /> Apple</>}
                    </Button>
                </div>

                <div className="my-4 flex items-center">
                    <div className="flex-grow border-t border-muted"></div>
                    <span className="mx-4 text-xs uppercase text-muted-foreground">Or</span>
                    <div className="flex-grow border-t border-muted"></div>
                </div>

                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                id="email" 
                                type="email" 
                                placeholder="m@example.com" 
                                required 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading || isSocialLoading}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                         <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                id="password" 
                                type="password" 
                                required 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading || isSocialLoading}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading || isSocialLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : "Login with Email"}
                    </Button>
                </form>
            </CardContent>
        </Card>
        <div className="text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="underline text-primary">
                Sign up
            </Link>
        </div>
      </div>
    </div>
  );
}
