
"use client";

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from '@/lib/firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, runTransaction, query, collection, where, getDocs, Timestamp, getDoc } from "firebase/firestore"; 
import { Loader2, User, Mail, Lock, KeyRound } from 'lucide-react';
import { generateReferralCode } from '@/lib/referral';
import { logUserActivity } from '../admin/actions';
import { getClientSessionInfo } from '@/lib/device-info';

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
      toast({ variant: "destructive", title: "Error", description: "Passwords do not match." });
      return;
    }
    setIsLoading(true);

    try {
      // Step 1: Create user in Firebase Auth.
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const finalReferralCode = (referralCode || referralCodeFromUrl || '').trim();
      let referrerProfile: { uid: string, data: any } | null = null;
      
      if (finalReferralCode) {
        const referrerQuery = query(collection(db, "users"), where("referralCode", "==", finalReferralCode));
        const referrerSnapshot = await getDocs(referrerQuery);
        if (!referrerSnapshot.empty) {
          const doc = referrerSnapshot.docs[0];
          referrerProfile = { uid: doc.id, data: doc.data() };
        } else {
          console.warn("Referral code not found:", finalReferralCode);
        }
      }

      await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, 'counters', 'userCounter');
        const counterSnap = await transaction.get(counterRef);
        const lastId = counterSnap.exists() ? counterSnap.data().lastId : 100000;
        const newClientId = lastId + 1;

        const newUserDocRef = doc(db, "users", user.uid);
        const newReferralCode = generateReferralCode(name);
        
        const newUserProfile = { 
            uid: user.uid,
            name, 
            email, 
            role: "user",
            clientId: newClientId,
            createdAt: Timestamp.now(),
            referralCode: newReferralCode,
            referredBy: referrerProfile ? referrerProfile.uid : null,
            referrals: [],
            points: 0,
            tier: 'Bronze',
        };
        transaction.set(newUserDocRef, newUserProfile);
        
        if (referrerProfile) {
          const referrerDocRef = doc(db, "users", referrerProfile.uid);
          const currentReferrals = referrerProfile.data.referrals || [];
          const currentPoints = referrerProfile.data.points || 0;

          transaction.update(referrerDocRef, {
            referrals: [...currentReferrals, user.uid],
            points: currentPoints + 10,
          });
        }
        
        transaction.set(counterRef, { lastId: newClientId }, { merge: true });
      });
      
      const clientInfo = await getClientSessionInfo();
      await logUserActivity(user.uid, 'signup', clientInfo, { method: 'email', referralCode: finalReferralCode || null });

      window.dispatchEvent(new CustomEvent('refetchUser'));

      toast({ type: "success", title: "Success", description: "Account created successfully. Redirecting..." });
      router.push('/dashboard');

    } catch (error: any) {
      console.error("Registration Error: ", error);
      if (error.code === 'auth/email-already-in-use') {
        toast({ variant: 'destructive', title: "Registration Failed", description: "This email address is already in use. Please log in." });
      } else {
        toast({ variant: 'destructive', title: "Error", description: error.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
       <div className="max-w-[400px] w-full mx-auto space-y-4">
        <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold font-headline">Create Account</h1>
            <p className="text-muted-foreground">Join and start earning.</p>
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
                            <Input id="referral-code" type="text" placeholder="e.g. JOH123" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} className="pl-10"/>
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
    </div>
  );
}
