
"use client";

import { useState } from 'react';
import { useRouter, useParams, notFound } from 'next/navigation';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
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
import { Info, Loader2, ArrowRight, ExternalLink, Check, FileText, UserPlus, Link2 } from 'lucide-react';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  hasAccount: z.enum(["yes", "no"], { required_error: "Please select an option." }),
  accountNumber: z.string().min(5, { message: 'Account number must be at least 5 characters.' }),
});

type FormData = z.infer<typeof formSchema>;

const STEPS = [
  { id: 1, name: 'Select Path', icon: UserPlus },
  { id: 2, name: 'Follow Instructions', icon: FileText },
  { id: 3, name: 'Link Account', icon: Link2 },
];

export default function BrokerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const brokerId = params.brokerId as string;
  const broker = brokers.find(b => b.id === brokerId);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hasAccount: undefined,
      accountNumber: '',
    },
  });

  const hasAccountValue = form.watch("hasAccount");

  if (!broker) {
    notFound();
  }

  const processForm = async (data: FormData) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to add an account.' });
      return;
    }
    setIsLoading(true);
    try {
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
      setIsLoading(false);
    }
  };

  type FieldName = keyof FormData;

  const next = async () => {
    const fields: FieldName[] = currentStep === 1 ? ['hasAccount'] : [];
    if (currentStep === 3) {
        fields.push('accountNumber');
    }

    const output = await form.trigger(fields, { shouldFocus: true });
    if (!output) return;
    
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
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title={`Link ${broker.name} Account`}
        description="Follow the steps below to link your account and start earning cashback."
      />
      
      <div className="grid md:grid-cols-[1fr_2fr] gap-8">
        {/* Stepper */}
        <div className="space-y-0">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-start">
              <div className="flex flex-col items-center">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border-2", 
                    currentStep > step.id ? 'bg-primary border-primary text-primary-foreground' : 
                    currentStep === step.id ? 'bg-primary/10 border-primary text-primary' : 
                    'bg-muted border-border text-muted-foreground'
                  )}>
                    {currentStep > step.id ? <Check className="w-6 h-6"/> : <step.icon className="w-5 h-5"/>}
                  </div>
                  {index < STEPS.length - 1 && <div className={cn("w-0.5 h-16", currentStep > step.id ? 'bg-primary' : 'bg-border')}></div>}
              </div>
              <div className="ml-4 pt-1.5">
                <p className="text-xs text-muted-foreground">STEP {step.id}</p>
                <p className="font-medium text-foreground">{step.name}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form Content */}
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(processForm)} className="space-y-8">
            {currentStep === 1 && (
                <Step1 hasAccount={hasAccountValue} brokerName={broker.name} />
            )}
            {currentStep === 2 && (
                <Step2 hasAccount={hasAccountValue} broker={broker} />
            )}
            {currentStep === 3 && (
                <Step3 />
            )}

            {/* Navigation */}
            <div className="mt-8 pt-5 flex justify-between">
                <div>
                {currentStep > 1 && (
                    <Button type="button" onClick={prev} variant="secondary">
                        Previous
                    </Button>
                )}
                </div>
                <div>
                  <Button type="button" onClick={next} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {currentStep === STEPS.length ? 'Submit for Approval' : 'Next Step'}
                    <ArrowRight className="ml-2 h-4 w-4"/>
                  </Button>
                </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}


// Step Components

function Step1({ hasAccount, brokerName }: { hasAccount: string | undefined; brokerName: string }) {
    const { control } = useFormContext();
    return (
        <Card>
            <CardHeader>
                <CardTitle>Choose Your Path</CardTitle>
                <CardDescription>Do you already have a trading account with {brokerName}?</CardDescription>
            </CardHeader>
            <CardContent>
                <FormField
                    control={control}
                    name="hasAccount"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-col space-y-2"
                                >
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="no" id="no" />
                                        </FormControl>
                                        <FormLabel htmlFor="no" className="font-normal cursor-pointer">No, I need to create a new account</FormLabel>
                                    </FormItem>
                                     <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="yes" id="yes" />
                                        </FormControl>
                                        <FormLabel htmlFor="yes" className="font-normal cursor-pointer">Yes, I already have an account</FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}

function Step2({ hasAccount, broker }: { hasAccount: string | undefined; broker: any }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Follow Instructions</CardTitle>
                <CardDescription>Please follow the relevant instructions below before proceeding.</CardDescription>
            </CardHeader>
            <CardContent>
                {hasAccount === 'no' && (
                    <Alert>
                        <UserPlus className="h-4 w-4" />
                        <AlertTitle>Create Your New Account</AlertTitle>
                        <AlertDescription>
                            <p className="mb-2">{broker.instructions.description}</p>
                            <p className="mb-4">Click the button below to go to the broker's website. This will ensure your new account is correctly tracked for cashback. Once you're done, come back here and click "Next Step".</p>
                            <Button asChild size="sm">
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
                        <AlertTitle>Important: Check Your Partner Link</AlertTitle>
                        <AlertDescription>
                            <p>For us to track your trades for cashback, your existing account must be registered under our partner link. If it's not, you will need to create a new one.</p>
                            <p className="mt-2">To fix this, please go back to the previous step and select "No, I need to create a new account".</p>
                            <p className="mt-2 font-semibold">If you're sure your account is correctly linked, please proceed to the next step.</p>
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}

function Step3() {
    const { control } = useFormContext();
    return (
        <Card>
            <CardHeader>
                <CardTitle>Link Your Account</CardTitle>
                <CardDescription>Enter the trading account number below to submit it for approval.</CardDescription>
            </CardHeader>
            <CardContent>
                 <FormField
                    control={control}
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
            </CardContent>
        </Card>
    )
}
