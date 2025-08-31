
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

// Define a custom labels object for react-phone-number-input
import ar from 'react-phone-number-input/locale/ar.json'

function PhoneVerificationForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [phoneNumber, setPhoneNumber] = useState<string | undefined>();
    const [isLoading, setIsLoading] = useState(false);
    const userId = searchParams.get('userId');
    
    useEffect(() => {
        if (!userId) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'جلسة غير صالحة. يرجى تسجيل الدخول.' });
            router.push('/login');
        }
    }, [userId, router, toast]);

    const handleSave = async () => {
        if (!userId) return;

        if (!phoneNumber || !isPossiblePhoneNumber(phoneNumber)) {
            toast({ variant: 'destructive', title: 'رقم هاتف غير صالح', description: 'الرجاء إدخال رقم هاتف صحيح.' });
            return;
        }

        setIsLoading(true);
        const result = await updateUserPhoneNumber(userId, phoneNumber);
        if (result.success) {
            toast({ type: 'success', title: 'نجاح', description: 'تم حفظ رقم الهاتف.' });
            router.push('/dashboard');
        } else {
            toast({ variant: 'destructive', title: 'خطأ', description: result.error || 'فشل حفظ رقم الهاتف.' });
        }
        setIsLoading(false);
    };

    const handleSkip = () => {
        // If user skips, just send them to the dashboard
        router.push('/dashboard');
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
                     <Button variant="ghost" size="icon" className="absolute top-3 left-3" onClick={handleSkip}>
                        <X className="h-5 w-5" />
                     </Button>
                    <CardTitle>التحقق من رقم هاتفك</CardTitle>
                    <CardDescription>
                        الرجاء إدخال رقم هاتفك المحمول.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert variant="default" className="bg-amber-50 border-amber-200 text-amber-800 text-right">
                        <AlertDescription className="text-xs">
                             يرجى تحديث رقم هاتفك لتطوير البيانات الشخصية، حتى تتمكن من الحصول على أقصى كفاءة في تلقي الكاش باك.
                        </AlertDescription>
                    </Alert>

                    <div className="phone-input-container" dir="ltr">
                        <PhoneInput
                            international
                            labels={ar}
                            placeholder="أدخل رقم الهاتف"
                            value={phoneNumber}
                            onChange={setPhoneNumber}
                            className="w-full"
                            countries={['SA', 'AE', 'KW', 'QA', 'BH', 'OM', 'EG', 'JO', 'LB', 'IQ', 'SY', 'YE', 'PS', 'SD', 'TN', 'DZ', 'MA', 'LY', 'MR', 'US', 'GB', 'TR', 'ID', 'MY']}
                        />
                    </div>
                    
                    <Button onClick={handleSave} disabled={isLoading} className="w-full">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ ومتابعة'}
                    </Button>
                    <Button variant="link" onClick={handleSkip} className="w-full">
                        ذكرني لاحقًا
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
