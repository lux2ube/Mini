
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
import { auth, db } from '@/lib/firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from "firebase/firestore";
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user role from Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      toast({
        title: "Success",
        description: "Logged in successfully.",
      });

      if (userDoc.exists() && userDoc.data()?.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-[400px] w-full mx-auto space-y-4">
        <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold font-headline">Login</h1>
            <p className="text-muted-foreground">Access your account.</p>
        </div>
        <Card>
            <CardContent className="p-4">
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                        id="email" 
                        type="email" 
                        placeholder="m@example.com" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                        id="password" 
                        type="password" 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : "Login"}
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
