
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PhoneInput, { isPossiblePhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useToast } from '@/hooks/use-toast';
import { updateUserPhoneNumber } from '../actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function PhoneVerificationForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [phoneNumber, setPhoneNumber] = useState<string | undefined>();
    const [isLoading, setIsLoading] = useState(false);
    const userId = searchParams.get('userId');
    
    useEffect(() => {
        if (!userId) {
            // If no user ID is present, they shouldn't be on this page.
            toast({ variant: 'destructive', title: 'Error', description: 'Invalid session. Please log in.' });
            router.push('/login');
        }
    }, [userId, router, toast]);

    const handleSave = async () => {
        if (!userId) return;

        if (!phoneNumber || !isPossiblePhoneNumber(phoneNumber)) {
            toast({ variant: 'destructive', title: 'Invalid Phone Number', description: 'Please enter a valid phone number.' });
            return;
        }

        setIsLoading(true);
        const result = await updateUserPhoneNumber(userId, phoneNumber);
        if (result.success) {
            toast({ type: 'success', title: 'Success', description: 'Phone number saved.' });
            router.push('/login');
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to save phone number.' });
        }
        setIsLoading(false);
    };

    const handleSkip = () => {
        router.push('/login');
    };

    if (!userId) {
        return (
             <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                     <Button variant="ghost" size="icon" className="absolute top-3 right-3" onClick={handleSkip}>
                        <X className="h-5 w-5" />
                     </Button>
                    <CardTitle>Verify your phone number</CardTitle>
                    <CardDescription>
                        Please enter your mobile number.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert variant="default" className="bg-amber-50 border-amber-200 text-amber-800">
                        <AlertDescription className="text-xs">
                             Please update your phone number for the development of personal data, so that you can receive maximum efficiency in receiving cashback.
                        </AlertDescription>
                    </Alert>

                    <div className="phone-input-container">
                        <PhoneInput
                            international
                            defaultCountry="TH"
                            placeholder="Enter phone number"
                            value={phoneNumber}
                            onChange={setPhoneNumber}
                            className="w-full"
                        />
                    </div>
                    
                    <Button onClick={handleSave} disabled={isLoading} className="w-full">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save & Continue'}
                    </Button>
                    <Button variant="link" onClick={handleSkip} className="w-full">
                        Remind me later
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}


export default function PhoneVerificationPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <PhoneVerificationForm />
        </Suspense>
    );
}

