
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams, notFound } from 'next/navigation';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/hooks/useAuthContext';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import type { Broker } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Loader2, UserPlus, FileText, Link2, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';


const formSchema = z.object({
  hasAccount: z.enum(["yes", "no"], { required_error: "Please select an option." }),
  accountNumber: z.string().min(5, { message: 'Account number must be at least 5 characters.' }),
});

type FormData = z.infer<typeof formSchema>;

const STEPS = [
  { id: 1, name: 'Choose Path', icon: UserPlus },
  { id: 2, name: 'Instructions', icon: FileText },
  { id: 3, name: 'Link Account', icon: Link2 },
];

export default function BrokerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [broker, setBroker] = useState<Broker | null>(null);
  const [isBrokerLoading, setIsBrokerLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const action = searchParams.get('action');

  const brokerId = params.brokerId as string;

  useEffect(() => {
    const fetchBroker = async () => {
      if (!brokerId) return;
      setIsBrokerLoading(true);
      try {
        const brokerRef = doc(db, 'brokers', brokerId);
        const brokerSnap = await getDoc(brokerRef);
        if (brokerSnap.exists()) {
          setBroker({ id: brokerSnap.id, ...brokerSnap.data() } as Broker);
        } else {
          notFound();
        }
      } catch (error) {
        console.error("Error fetching broker", error);
        notFound();
      } finally {
        setIsBrokerLoading(false);
      }
    };
    fetchBroker();
  }, [brokerId]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hasAccount: action === 'existing' ? 'yes' : action === 'new' ? 'no' : undefined,
      accountNumber: '',
    },
  });

  // Effect to sync URL param to form state
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'existing') {
        form.setValue('hasAccount', 'yes');
    } else if (action === 'new') {
        form.setValue('hasAccount', 'no');
    }
  }, [searchParams, form]);


  const hasAccountValue = form.watch("hasAccount");

  if (isBrokerLoading) {
    return <BrokerPageSkeleton />
  }

  if (!broker) {
    notFound();
  }

  const processForm = async (data: FormData) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to add an account.' });
      return;
    }
    setIsSubmitting(true);
    try {
      // Check for duplicate account
      const q = query(
        collection(db, 'tradingAccounts'),
        where('broker', '==', broker.name),
        where('accountNumber', '==', data.accountNumber)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast({
          variant: 'destructive',
          title: 'Account Exists',
          description: 'This trading account number is already linked for this broker.',
        });
        setIsSubmitting(false);
        return;
      }

      await addDoc(collection(db, 'tradingAccounts'), {
        userId: user.uid,
        broker: broker.name,
        accountNumber: data.accountNumber,
        status: 'Pending',
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Success!', description: 'Your trading account has been submitted for approval.' });
      router.push('/dashboard/my-accounts');
    } catch (error) {
      console.error('Error adding document: ', error);
      toast({ variant: 'destructive', title: 'Error', description: 'There was a problem submitting your account. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  type FieldName = keyof FormData;

  const next = async () => {
    const fields: FieldName[] = [];
    if (currentStep === 1) {
        fields.push('hasAccount');
    }
    if (currentStep === 3) {
        fields.push('accountNumber');
    }

    if (fields.length > 0) {
      const output = await form.trigger(fields as FieldName[], { shouldFocus: true });
      if (!output) return;
    }
    
    if (currentStep < STEPS.length) {
      setCurrentStep(step => step + 1);
    } else {
      await form.handleSubmit(processForm)();
    }
  };

  const prev = () => {
    if (currentStep > 1) {
      setCurrentStep(step => step - 1);
    }
  };

  return (
    <div className="max-w-md mx-auto w-full px-4 py-4 space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col items-start gap-4">
            <Image
                src={broker.logoUrl}
                alt={`${broker.name} logo`}
                width={48}
                height={48}
                className="w-12 h-12 object-contain rounded-lg border p-1 bg-background flex-shrink-0"
                data-ai-hint="logo"
              />
            <div className="flex-1">
              <h1 className="text-lg font-bold font-headline">{broker.name}</h1>
              <p className="text-xs text-muted-foreground">{broker.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-center">
        <h2 className="text-lg font-bold font-headline">Start Earning Now</h2>
      </div>

      <div className="w-full">
          <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= step.id ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted border-border text-muted-foreground'}`}>
                        <step.icon className="w-4 h-4"/>
                    </div>
                    <p className={`mt-2 text-xs font-medium ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'}`}>{step.name}</p>
                  </div>
                  {index < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${currentStep > step.id ? 'bg-primary' : 'bg-border'}`}></div>}
                </React.Fragment>
              ))}
          </div>
      </div>

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(processForm)} className="space-y-4">
            <Card>
                {currentStep === 1 && <Step1 brokerName={broker.name} />}
                {currentStep === 2 && <Step2 hasAccount={hasAccountValue} broker={broker} />}
                {currentStep === 3 && <Step3 />}
            </Card>

            <div className="space-y-2">
                <Button type="button" onClick={next} disabled={isSubmitting} className="w-full">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {currentStep === STEPS.length ? 'Submit' : 'Next'}
                </Button>
                {currentStep > 1 && (
                    <Button type="button" onClick={prev} variant="secondary" className="w-full">
                        Previous
                    </Button>
                )}
            </div>
        </form>
      </FormProvider>
    </div>
  );
}

function Step1({ brokerName }: { brokerName: string }) {
    const { control } = useFormContext();
    return (
        <>
            <CardHeader>
                <CardTitle className="text-base">Choose Your Path</CardTitle>
                <CardDescription className="text-xs">Do you already have a trading account with {brokerName}?</CardDescription>
            </CardHeader>
            <CardContent>
                <FormField
                    control={control}
                    name="hasAccount"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-2">
                                    <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md has-[[data-state=checked]]:border-primary">
                                        <FormControl><RadioGroupItem value="no" id="no" /></FormControl>
                                        <FormLabel htmlFor="no" className="font-normal cursor-pointer w-full text-sm">No, I need a new account</FormLabel>
                                    </FormItem>
                                     <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md has-[[data-state=checked]]:border-primary">
                                        <FormControl><RadioGroupItem value="yes" id="yes" /></FormControl>
                                        <FormLabel htmlFor="yes" className="font-normal cursor-pointer w-full text-sm">Yes, I have an account</FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </>
    );
}

function Step2({ hasAccount, broker }: { hasAccount: string | undefined; broker: Broker }) {
    return (
        <>
            <CardHeader>
                <CardTitle className="text-base">Instructions</CardTitle>
                <CardDescription className="text-xs">Follow the relevant instructions.</CardDescription>
            </CardHeader>
            <CardContent>
                {hasAccount === 'no' && (
                    <Alert>
                        <UserPlus className="h-4 w-4" />
                        <AlertTitle>Create New Account</AlertTitle>
                        <AlertDescription className="space-y-4">
                            <p className="text-xs">{broker.instructions.description}</p>
                            <Button asChild size="sm" className="w-full">
                                <a href={broker.instructions.link} target="_blank" rel="noopener noreferrer">
                                    {broker.instructions.linkText} <ExternalLink className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}
                 {hasAccount === 'yes' && (
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Important: Link Existing Account</AlertTitle>
                        <AlertDescription>
                            <p className="text-xs">{broker.existingAccountInstructions}</p>
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </>
    );
}

function Step3() {
    const { control } = useFormContext();
    return (
        <>
            <CardHeader>
                <CardTitle className="text-base">Link Account</CardTitle>
                <CardDescription className="text-xs">Enter your trading account number.</CardDescription>
            </CardHeader>
            <CardContent>
                 <FormField
                    control={control}
                    name="accountNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Trading Account Number</FormLabel>
                        <FormControl>
                            <Input placeholder="Enter number" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </>
    )
}

function BrokerPageSkeleton() {
    return (
        <div className="max-w-md mx-auto w-full px-4 py-4 space-y-4 animate-pulse">
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col items-start gap-4">
                         <Skeleton className="w-12 h-12 rounded-lg" />
                         <div className="w-full space-y-2">
                             <Skeleton className="h-5 w-1/2" />
                             <Skeleton className="h-3 w-full" />
                             <Skeleton className="h-3 w-4/5" />
                         </div>
                    </div>
                </CardContent>
            </Card>
            <Skeleton className="h-6 w-1/2 mx-auto" />
            <Skeleton className="h-16 w-full" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        </div>
    )
}
