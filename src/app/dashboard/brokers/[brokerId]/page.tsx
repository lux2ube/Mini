
"use client";

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { Info, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { notFound } from 'next/navigation';

const formSchema = z.object({
  accountNumber: z.string().min(5, { message: 'Account number must be at least 5 characters.' }),
});

export default function BrokerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const brokerId = params.brokerId as string;
  const broker = brokers.find(b => b.id === brokerId);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountNumber: '',
    },
  });

  if (!broker) {
    return notFound();
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
        title: 'Success',
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
    <>
      <PageHeader
        title={broker.name}
        description={`Link your ${broker.name} account to start earning cashback.`}
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Broker Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
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

            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Important Instructions</AlertTitle>
                <AlertDescription>
                    <p className="mb-2">{broker.instructions.description}</p>
                    <p>Follow our partner link to ensure your account is correctly tracked for cashback: <a href={broker.instructions.link} target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-primary">{broker.instructions.linkText}</a></p>
                </AlertDescription>
            </Alert>

            <Card>
                <CardHeader>
                    <CardTitle>Link Your Account</CardTitle>
                    <CardDescription>Once your account is created or linked under our partner ID, enter your account number below.</CardDescription>
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
                                <Input placeholder="e.g., 123456789" {...field} />
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

        <aside className="space-y-6">
            <Card className="flex flex-col items-center text-center">
                 <CardHeader>
                    <Image 
                        src={broker.logoUrl} 
                        alt={`${broker.name} logo`} 
                        width={80} 
                        height={80}
                        className="w-20 h-20 object-contain rounded-lg border p-2 mx-auto"
                        data-ai-hint="logo"
                    />
                    <CardTitle className="mt-4">{broker.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <CardDescription>{broker.description}</CardDescription>
                </CardContent>
                 <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                        <a href={broker.instructions.link} target="_blank" rel="noopener noreferrer">Visit Broker Website</a>
                    </Button>
                </CardFooter>
            </Card>
        </aside>

      </div>
    </>
  );
}
