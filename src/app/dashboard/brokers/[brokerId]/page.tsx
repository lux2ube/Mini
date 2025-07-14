
"use client";

import { useState } from 'react';
import { useRouter, useParams, notFound } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/hooks/useAuthContext';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { brokers } from '@/lib/data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Loader2, ArrowRight, ExternalLink } from 'lucide-react';
import Image from 'next/image';

const formSchema = z.object({
  accountNumber: z.string().min(5, { message: 'Account number must be at least 5 characters.' }),
});

export default function BrokerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'needsAccount' | 'hasAccount'>('needsAccount');

  const brokerId = params.brokerId as string;
  const broker = brokers.find(b => b.id === brokerId);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountNumber: '',
    },
  });

  if (!broker) {
    notFound();
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to add an account.',
      });
      return;
    }

    setIsLoading(true);

    try {
      await addDoc(collection(db, 'tradingAccounts'), {
        userId: user.uid,
        broker: broker.name,
        accountNumber: values.accountNumber,
        status: 'Pending',
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Success!',
        description: 'Your trading account has been submitted for approval.',
      });
      router.push('/dashboard/my-accounts');
    } catch (error) {
      console.error('Error adding document: ', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'There was a problem submitting your account. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={broker.name}
        description="Follow the steps below to link your account and start earning cashback."
      />

      <div className="space-y-8">
        <Card>
            <CardHeader className="flex-row items-center gap-4">
                <Image 
                    src={broker.logoUrl} 
                    alt={`${broker.name} logo`} 
                    width={80} 
                    height={80}
                    className="w-20 h-20 object-contain rounded-lg border p-2"
                    data-ai-hint="logo"
                />
                <div className="space-y-1">
                    <CardTitle className="text-2xl">{broker.name}</CardTitle>
                    <CardDescription>{broker.description}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm border-t pt-4">
                    <div className="space-y-1">
                        <p className="text-muted-foreground">Min. Deposit</p>
                        <p className="font-medium">{broker.details.minDeposit}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-muted-foreground">Max. Leverage</p>
                        <p className="font-medium">{broker.details.leverage}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-muted-foreground">Typical Spread</p>
                        <p className="font-medium">{broker.details.spreads}</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Step 1: Choice */}
        <Card>
            <CardHeader>
                <CardTitle>Step 1: Choose Your Path</CardTitle>
                <CardDescription>Do you already have a trading account with {broker.name}?</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
                <Button onClick={() => setStep('hasAccount')} size="lg" className="w-full" variant={step === 'hasAccount' ? 'default' : 'secondary'}>
                    Yes, I have an account
                </Button>
                <Button onClick={() => setStep('needsAccount')} size="lg" className="w-full" variant={step === 'needsAccount' ? 'default' : 'secondary'}>
                    No, I need to create one
                </Button>
            </CardContent>
        </Card>
        
        {/* Step 2: Instructions (Conditional) */}
        <div className="space-y-6">
            {step === 'hasAccount' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Step 2: Check Your Account</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Important: Is your account under our Partner Link?</AlertTitle>
                            <AlertDescription>
                                <p className="mb-2">For us to track your trades for cashback, your account must be registered under our partner link. If it's not, you'll need to create a new one by selecting the "No, I need to create one" option above.</p>
                                <p>If you're sure your account is correctly linked, proceed to Step 3 below.</p>
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            )}

            {step === 'needsAccount' && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Step 2: Create Your New Account</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Create Your New Account on the Broker's Site</AlertTitle>
                            <AlertDescription>
                                <p className="mb-2">{broker.instructions.description}</p>
                                <p className="mb-4">Click the button below to go to the broker's website. This will ensure your new account is correctly tracked for cashback. Once you're done, come back here to complete Step 3.</p>
                                 <Button asChild>
                                    <a href={broker.instructions.link} target="_blank" rel="noopener noreferrer">
                                        {broker.instructions.linkText} <ExternalLink className="ml-2 h-4 w-4" />
                                    </a>
                                </Button>
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            )}
        </div>

        {/* Step 3: Link Account Form */}
        <Card>
            <CardHeader>
                <CardTitle>Step 3: Link Your Account</CardTitle>
                <CardDescription>Once your account is ready, enter the account number below to submit it for approval.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                        control={form.control}
                        name="accountNumber"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Trading Account Number</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter your account number here" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit for Approval
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}

