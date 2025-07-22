
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { getBannerSettings, updateBannerSettings } from "../actions";
import { Loader2, Code, Megaphone, Target, Globe, Gem } from "lucide-react";
import type { BannerSettings } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
    isEnabled: z.boolean(),
    type: z.enum(['script', 'text']),
    
    // Text Banner Fields
    title: z.string().optional(),
    text: z.string().optional(),
    ctaText: z.string().optional(),
    ctaLink: z.string().url().or(z.literal('')).optional(),
    
    // Script Banner Fields
    scriptCode: z.string().optional(),

    // Targeting Fields
    targetTiers: z.array(z.string()).optional(),
    targetCountries: z.string().optional(), // Comma-separated list
});

type FormData = z.infer<typeof formSchema>;

const ALL_TIERS = ['New', 'Bronze', 'Silver', 'Gold', 'Diamond'];

export default function ManageBannerPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            isEnabled: false,
            type: 'text',
            title: "",
            text: "",
            ctaText: "",
            ctaLink: "",
            scriptCode: "",
            targetTiers: [],
            targetCountries: "",
        },
    });
    
    const bannerType = form.watch('type');

    useEffect(() => {
        async function fetchSettings() {
            setIsLoading(true);
            try {
                const settings = await getBannerSettings();
                form.reset({
                    ...settings,
                    targetCountries: settings.targetCountries?.join(', ')
                });
            } catch (error) {
                toast({ variant: "destructive", title: "خطأ", description: "تعذر جلب إعدادات البانر." });
            } finally {
                setIsLoading(false);
            }
        }
        fetchSettings();
    }, [form, toast]);

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        const payload: BannerSettings = {
            ...data,
            targetCountries: data.targetCountries ? data.targetCountries.split(',').map(c => c.trim().toUpperCase()) : [],
        };

        const result = await updateBannerSettings(payload);
        if (result.success) {
            toast({ title: "نجاح", description: result.message });
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
        }
        setIsSubmitting(false);
    };
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto space-y-6">
            <PageHeader 
                title="إدارة البانر"
                description="تحديث البانر الترويجي المعروض للمستخدمين."
            />

             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>الإعدادات العامة</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="isEnabled"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">تفعيل البانر</FormLabel>
                                            <FormDescription>
                                                قم بتشغيل هذا الخيار لعرض البانر للمستخدمين المستهدفين.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>محتوى البانر</CardTitle>
                            <CardDescription>
                                اختر نوع البانر الذي تريد عرضه.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>نوع البانر</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="text"><div className="flex items-center gap-2"><Megaphone/> بانر نصي مع زر</div></SelectItem>
                                            <SelectItem value="script"><div className="flex items-center gap-2"><Code/> بانر بكود مخصص</div></SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                                )}
                            />

                            {bannerType === 'text' && (
                                <div className="space-y-4 p-4 border rounded-md">
                                    <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>العنوان</FormLabel><FormControl><Input placeholder="عرض حصري!" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                    <FormField control={form.control} name="text" render={({ field }) => (<FormItem><FormLabel>النص</FormLabel><FormControl><Textarea placeholder="احصل على مكافأة 50$ عند إيداعك القادم." {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="ctaText" render={({ field }) => (<FormItem><FormLabel>نص الزر (CTA)</FormLabel><FormControl><Input placeholder="اعرف المزيد" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                        <FormField control={form.control} name="ctaLink" render={({ field }) => (<FormItem><FormLabel>رابط الزر (CTA)</FormLabel><FormControl><Input type="url" placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                    </div>
                                </div>
                            )}

                             {bannerType === 'script' && (
                                <div className="space-y-4 p-4 border rounded-md">
                                    <FormField
                                        control={form.control}
                                        name="scriptCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>كود سكريبت البانر</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder='<script src="..."></script>'
                                                        className="min-h-[150px] font-mono text-xs"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    أدخل وسم السكريبت الكامل للبانر الإعلاني الخاص بك.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Target/> استهداف الجمهور</CardTitle>
                            <CardDescription>
                                حدد من سيرى هذا البانر. اتركه فارغًا لإظهاره للجميع.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="targetTiers"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Gem className="h-4 w-4"/> استهداف حسب المستوى</FormLabel>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {ALL_TIERS.map((tier) => (
                                            <FormField
                                                key={tier}
                                                control={form.control}
                                                name="targetTiers"
                                                render={({ field }) => (
                                                <FormItem
                                                    key={tier}
                                                    className="flex flex-row items-center space-x-2 space-y-0 rounded-md border p-3"
                                                >
                                                    <FormControl>
                                                    <Switch
                                                        checked={field.value?.includes(tier)}
                                                        onCheckedChange={(checked) => {
                                                        return checked
                                                            ? field.onChange([...(field.value || []), tier])
                                                            : field.onChange(
                                                                field.value?.filter(
                                                                    (value) => value !== tier
                                                                )
                                                                )
                                                        }}
                                                    />
                                                    </FormControl>
                                                    <FormLabel className="font-normal w-full cursor-pointer">{tier}</FormLabel>
                                                </FormItem>
                                                )}
                                            />
                                        ))}
                                    </div>
                                    <FormDescription>
                                      اختر المستويات التي سيظهر لها البانر.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <Separator/>
                             <FormField
                                control={form.control}
                                name="targetCountries"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2"><Globe className="h-4 w-4"/> استهداف حسب الدولة</FormLabel>
                                        <FormControl>
                                            <Input placeholder="EG, SA, AE" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            أدخل رموز الدول (ISO 3166-1 alpha-2) مفصولة بفواصل. مثال: EG, SA, AE.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                    
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        حفظ الإعدادات
                    </Button>
                </form>
            </Form>
        </div>
    );
}
