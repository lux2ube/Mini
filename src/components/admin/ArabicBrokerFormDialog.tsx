
"use client";

import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Broker } from "@/types";
import { addBroker, updateBroker } from "@/app/admin/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { TermsBank } from "@/lib/terms-bank";
import { ScrollArea } from "../ui/scroll-area";
import React from 'react';

const licenseSchema = z.object({
    authority: z.string().min(1, "جهة الترخيص مطلوبة"),
    licenseNumber: z.string().optional(),
    status: z.string().min(1, "حالة الترخيص مطلوبة"),
});

const formSchema = z.object({
  logoUrl: z.string().url("يجب أن يكون رابطًا صالحًا.").default("https://placehold.co/100x100.png"),
  category: z.enum(['forex', 'crypto', 'other']).default('forex'),
  
  basicInfo: z.object({
    broker_name: z.string().min(2, "اسم الوسيط مطلوب."),
    group_entity: z.string().optional().default(""),
    founded_year: z.coerce.number().optional().default(new Date().getFullYear()),
    headquarters: z.string().optional().default(""),
    CEO: z.string().optional().default(""),
    broker_type: z.string().optional().default(""),
  }),
  regulation: z.object({
    regulation_status: z.string().optional().default(""),
    licenses: z.array(licenseSchema).optional().default([]),
    offshore_regulation: z.boolean().default(false),
    risk_level: z.string().optional().default(""),
    regulated_in: z.array(z.string()).optional().default([]),
    regulator_name: z.array(z.string()).optional().default([]),
  }),
  tradingConditions: z.object({
      account_types: z.array(z.string()).optional().default([]),
      swap_free: z.boolean().default(false),
      max_leverage: z.string().optional().default("1:500"),
      min_deposit: z.coerce.number().min(0).default(10),
      spread_type: z.string().optional().default(""),
      min_spread: z.coerce.number().min(0).optional().default(0),
      commission_per_lot: z.coerce.number().min(0).optional().default(0),
      execution_speed: z.string().optional().default(""),
  }),
  platforms: z.object({
      platforms_supported: z.array(z.string()).optional().default([]),
      mt4_license_type: z.enum(['Full License', 'White Label', 'None']).default('None'),
      mt5_license_type: z.enum(['Full License', 'White Label', 'None']).default('None'),
      custom_platform: z.boolean().optional().default(false),
  }),
  instruments: z.object({
      forex_pairs: z.string().optional().default(""),
      crypto_trading: z.boolean().default(false),
      stocks: z.boolean().default(false),
      commodities: z.boolean().default(false),
      indices: z.boolean().default(false),
  }),
  depositsWithdrawals: z.object({
      payment_methods: z.array(z.string()).optional().default([]),
      min_withdrawal: z.coerce.number().min(0).optional().default(0),
      withdrawal_speed: z.string().optional().default(""),
      deposit_fees: z.boolean().default(false),
      withdrawal_fees: z.boolean().default(false),
  }),
  cashback: z.object({
      affiliate_program_link: z.string().url("يجب أن يكون رابطًا صالحًا.").or(z.literal("")).optional().default(""),
      cashback_account_type: z.array(z.string()).optional().default([]),
      cashback_frequency: z.string().optional().default(""),
      rebate_method: z.array(z.string()).optional().default([]),
      cashback_per_lot: z.coerce.number().min(0).optional().default(0),
  }),
  globalReach: z.object({
      business_region: z.array(z.string()).optional().default([]),
      global_presence: z.string().optional().default(""),
      languages_supported: z.array(z.string()).optional().default([]),
      customer_support_channels: z.array(z.string()).optional().default([]),
  }),
  reputation: z.object({
      wikifx_score: z.coerce.number().min(0).max(10).optional().default(0),
      trustpilot_rating: z.coerce.number().min(0).max(5).optional().default(0),
      reviews_count: z.coerce.number().min(0).optional().default(0),
      verified_users: z.coerce.number().min(0).optional().default(0),
  }),
  additionalFeatures: z.object({
      education_center: z.boolean().default(false),
      copy_trading: z.boolean().default(false),
      demo_account: z.boolean().default(false),
      trading_contests: z.boolean().default(false),
      regulatory_alerts: z.string().optional().default(""),
      welcome_bonus: z.boolean().default(false),
  }),
  instructions: z.object({
      description: z.string().optional().default(""),
      new_account_instructions: z.string().optional().default(""),
      new_account_link: z.string().url("يجب أن يكون رابطًا صالحًا.").or(z.literal("")).optional().default(""),
      new_account_link_text: z.string().optional().default(""),
  }),
  existingAccountInstructions: z.string().optional().default(""),
});

type BrokerFormValues = z.infer<typeof formSchema>;

interface ArabicBrokerFormDialogProps {
  broker?: Broker | null;
  children: React.ReactNode;
  onSuccess: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const getSafeDefaultValues = (broker?: Broker | null): BrokerFormValues => {
    const defaults: BrokerFormValues = {
        logoUrl: "https://placehold.co/100x100.png",
        category: 'forex',
        basicInfo: { broker_name: "", group_entity: "", founded_year: new Date().getFullYear(), headquarters: "", CEO: "", broker_type: "" },
        regulation: { regulation_status: "", licenses: [], offshore_regulation: false, risk_level: "", regulated_in: [], regulator_name: [] },
        tradingConditions: { account_types: [], swap_free: false, max_leverage: "1:500", min_deposit: 10, spread_type: "", min_spread: 0, commission_per_lot: 0, execution_speed: "" },
        platforms: { platforms_supported: [], mt4_license_type: 'None', mt5_license_type: 'None', custom_platform: false },
        instruments: { forex_pairs: "", crypto_trading: false, stocks: false, commodities: false, indices: false },
        depositsWithdrawals: { payment_methods: [], min_withdrawal: 0, withdrawal_speed: "", deposit_fees: false, withdrawal_fees: false },
        cashback: { affiliate_program_link: "", cashback_account_type: [], cashback_frequency: "", rebate_method: [], cashback_per_lot: 0 },
        globalReach: { business_region: [], global_presence: "", languages_supported: [], customer_support_channels: [] },
        reputation: { wikifx_score: 0, trustpilot_rating: 0, reviews_count: 0, verified_users: 0 },
        additionalFeatures: { education_center: false, copy_trading: false, demo_account: false, trading_contests: false, regulatory_alerts: "", welcome_bonus: false },
        instructions: { description: "", new_account_instructions: "", new_account_link: "", new_account_link_text: "" },
        existingAccountInstructions: "",
    };

    if (!broker) {
        return defaults;
    }
    
    // Deep merge of broker data into defaults to ensure all keys exist
    const brokerCopy = JSON.parse(JSON.stringify(broker));
    
    const merged = {
        ...defaults,
        ...brokerCopy,
        basicInfo: { ...defaults.basicInfo, ...brokerCopy.basicInfo },
        regulation: { ...defaults.regulation, ...brokerCopy.regulation },
        tradingConditions: { ...defaults.tradingConditions, ...brokerCopy.tradingConditions },
        platforms: { ...defaults.platforms, ...brokerCopy.platforms },
        instruments: { ...defaults.instruments, ...brokerCopy.instruments },
        depositsWithdrawals: { ...defaults.depositsWithdrawals, ...brokerCopy.depositsWithdrawals },
        cashback: { ...defaults.cashback, ...brokerCopy.cashback },
        globalReach: { ...defaults.globalReach, ...brokerCopy.globalReach },
        reputation: { ...defaults.reputation, ...brokerCopy.reputation },
        additionalFeatures: { ...defaults.additionalFeatures, ...brokerCopy.additionalFeatures },
        instructions: { ...defaults.instructions, ...brokerCopy.instructions },
    };

    // Ensure arrays are not undefined
    Object.keys(merged).forEach(key => {
        const section = key as keyof BrokerFormValues;
        if (typeof merged[section] === 'object' && merged[section] !== null) {
            Object.keys(merged[section] as object).forEach(field => {
                if (Array.isArray(defaults[section as keyof typeof defaults]?.[field as keyof {}]) && !Array.isArray((merged[section] as any)[field])) {
                    (merged[section] as any)[field] = [];
                }
            });
        }
    });

    return merged;
};

export function ArabicBrokerFormDialog({
  broker,
  children,
  onSuccess,
  isOpen,
  setIsOpen,
}: ArabicBrokerFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<BrokerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getSafeDefaultValues(broker),
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "regulation.licenses",
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset(getSafeDefaultValues(broker));
    }
  }, [broker, form, isOpen]);

  const onSubmit = async (values: BrokerFormValues) => {
    setIsSubmitting(true);

    try {
      // Legacy fields for backward compatibility
      const legacyData = {
          name: values.basicInfo.broker_name,
          description: values.instructions.description,
          rating: Math.round(values.reputation.wikifx_score ? values.reputation.wikifx_score / 2 : 0),
          instructions: {
              description: values.instructions.new_account_instructions,
              linkText: values.instructions.new_account_link_text,
              link: values.instructions.new_account_link,
          }
      };

      const payload = { ...values, ...legacyData };

      let result;
      if (broker) {
        result = await updateBroker(broker.id, payload);
      } else {
        const { id, order, ...dataToAdd } = payload as any;
        result = await addBroker(dataToAdd as Omit<Broker, 'id' | 'order'>);
      }

      if (result.success) {
        toast({ title: "نجاح", description: result.message });
        setIsOpen(false);
        onSuccess();
      } else {
        toast({ variant: "destructive", title: "خطأ", description: result.message });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ غير متوقع." });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderBooleanField = (name: any, label: string) => (
    <FormField control={form.control} name={name} render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>{label}</FormLabel></div><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
    )}/>
  )

  const renderMultiSelect = (name: any, label: string, options: {key: string, label: string}[]) => (
     <FormField
            control={form.control}
            name={name}
            render={() => (
                <FormItem>
                <FormLabel>{label}</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {options.map((item) => (
                    <FormField
                        key={item.key}
                        control={form.control}
                        name={name}
                        render={({ field }) => {
                            return (
                            <FormItem key={item.key} className="flex flex-row-reverse items-center space-x-2 space-y-0 rounded-md border p-2 justify-end space-x-reverse">
                                <FormControl>
                                <Checkbox
                                    checked={field.value?.includes(item.key)}
                                    onCheckedChange={(checked) => {
                                        const currentValue = field.value || [];
                                        return checked
                                        ? field.onChange([...currentValue, item.key])
                                        : field.onChange(currentValue?.filter((value: string) => value !== item.key));
                                    }}
                                />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer text-right w-full">{item.label}</FormLabel>
                            </FormItem>
                            )
                        }}
                    />
                ))}
                </div>
                <FormMessage />
                </FormItem>
            )}
        />
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{broker ? "تعديل" : "إضافة"} وسيط</DialogTitle>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="h-[70vh] p-4">
            <Accordion type="multiple" defaultValue={['item-1']} className="w-full">
              {/* Section 1: Basic Info */}
              <AccordionItem value="item-1">
                <AccordionTrigger>1. المعلومات الأساسية</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <FormField control={form.control} name="logoUrl" render={({ field }) => (<FormItem><FormLabel>رابط الشعار</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="basicInfo.broker_name" render={({ field }) => (<FormItem><FormLabel>اسم الوسيط</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="basicInfo.CEO" render={({ field }) => (<FormItem><FormLabel>المؤسس / CEO</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="basicInfo.founded_year" render={({ field }) => (<FormItem><FormLabel>سنة التأسيس</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="basicInfo.headquarters" render={({ field }) => (<FormItem><FormLabel>المقر الرئيسي</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="basicInfo.broker_type" render={({ field }) => (<FormItem><FormLabel>نوع الشركة</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{TermsBank.brokerType.map(o=><SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="regulation.regulation_status" render={({ field }) => (<FormItem><FormLabel>الحالة التنظيمية</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{TermsBank.regulationStatus.map(o=><SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                </AccordionContent>
              </AccordionItem>

              {/* Section 2: Licenses */}
              <AccordionItem value="item-2">
                <AccordionTrigger>2. التراخيص</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-md relative space-y-2">
                        <Button type="button" variant="destructive" size="icon" className="absolute top-2 left-2 h-6 w-6 z-10" onClick={() => remove(index)}><Trash2 className="h-4 w-4"/></Button>
                        <FormField control={form.control} name={`regulation.licenses.${index}.authority`} render={({ field }) => (<FormItem><FormLabel>جهة الترخيص</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{TermsBank.licenseAuthority.map(o=><SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name={`regulation.licenses.${index}.licenseNumber`} render={({ field }) => (<FormItem><FormLabel>رقم الترخيص</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name={`regulation.licenses.${index}.status`} render={({ field }) => (<FormItem><FormLabel>حالة الترخيص</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{TermsBank.regulationStatus.map(o=><SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ authority: '', licenseNumber: '', status: '' })}><PlusCircle className="ml-2 h-4 w-4"/>إضافة ترخيص</Button>
                </AccordionContent>
              </AccordionItem>
              
              {/* Section 3: Platforms */}
              <AccordionItem value="item-3">
                <AccordionTrigger>3. منصات التداول</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  {renderMultiSelect('platforms.platforms_supported', 'المنصات المدعومة', TermsBank.platforms)}
                  <FormField control={form.control} name="platforms.mt4_license_type" render={({ field }) => (<FormItem><FormLabel>ترخيص MT4</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Full License">كامل</SelectItem><SelectItem value="None">لا يوجد</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="platforms.mt5_license_type" render={({ field }) => (<FormItem><FormLabel>ترخيص MT5</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Full License">كامل</SelectItem><SelectItem value="None">لا يوجد</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                </AccordionContent>
              </AccordionItem>
              
              {/* Section 4: Accounts */}
              <AccordionItem value="item-4">
                <AccordionTrigger>4. الحسابات وأنواعها</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  {renderMultiSelect('tradingConditions.account_types', 'أنواع الحسابات', TermsBank.accountTypes)}
                  <FormField control={form.control} name="tradingConditions.min_deposit" render={({ field }) => (<FormItem><FormLabel>الحد الأدنى للإيداع ($)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="tradingConditions.max_leverage" render={({ field }) => (<FormItem><FormLabel>الرافعة المالية</FormLabel><FormControl><Input placeholder="e.g. 1:500" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="tradingConditions.spread_type" render={({ field }) => (<FormItem><FormLabel>نوع السبريد</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{TermsBank.spreadType.map(o=><SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="tradingConditions.min_spread" render={({ field }) => (<FormItem><FormLabel>أدنى سبريد (نقاط)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5">
                <AccordionTrigger>5. ميزات الحساب</AccordionTrigger>
                <AccordionContent className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {renderBooleanField('additionalFeatures.welcome_bonus', 'بونص ترحيبي ومكافآت')}
                    {renderBooleanField('additionalFeatures.copy_trading', 'نسخ التداول')}
                    {renderBooleanField('instruments.crypto_trading', 'تداول العملات المشفرة')}
                    {renderBooleanField('tradingConditions.swap_free', 'حسابات إسلامية')}
                    {renderBooleanField('additionalFeatures.demo_account', 'حسابات تجريبية')}
                    {renderBooleanField('additionalFeatures.education_center', 'مركز تعليمي')}
                    {renderBooleanField('additionalFeatures.trading_contests', 'مسابقات تداول')}
                </AccordionContent>
              </AccordionItem>

              {/* Section 6: Payment */}
              <AccordionItem value="item-6">
                <AccordionTrigger>6. طرق الدفع والسحب</AccordionTrigger>
                <AccordionContent className="space-y-4">
                    {renderMultiSelect('depositsWithdrawals.payment_methods', 'طرق الدفع', TermsBank.depositMethods)}
                    {renderBooleanField('depositsWithdrawals.deposit_fees', 'توجد رسوم على الإيداع')}
                    {renderBooleanField('depositsWithdrawals.withdrawal_fees', 'توجد رسوم على السحب')}
                    <FormField control={form.control} name="depositsWithdrawals.min_withdrawal" render={({ field }) => (<FormItem><FormLabel>الحد الأدنى للسحب ($)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="depositsWithdrawals.withdrawal_speed" render={({ field }) => (<FormItem><FormLabel>سرعة السحب</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{TermsBank.supportHours.map(o=><SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                </AccordionContent>
              </AccordionItem>

              {/* Section 7: Support */}
              <AccordionItem value="item-7">
                <AccordionTrigger>7. الدعم والخدمة</AccordionTrigger>
                <AccordionContent className="space-y-4">
                    {renderMultiSelect('globalReach.languages_supported', 'اللغات المدعومة', TermsBank.languagesSupported)}
                    {renderMultiSelect('globalReach.customer_support_channels', 'قنوات الدعم', TermsBank.supportChannels)}
                    <FormField control={form.control} name="globalReach.business_region" render={({ field }) => (<FormItem><FormLabel>ساعات الدعم</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{TermsBank.supportHours.map(o=><SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                </AccordionContent>
              </AccordionItem>

              {/* Section 8: Rewards */}
              <AccordionItem value="item-8">
                <AccordionTrigger>8. برامج المكافآت</AccordionTrigger>
                <AccordionContent className="space-y-4">
                    <FormField control={form.control} name="cashback.affiliate_program_link" render={({ field }) => (<FormItem><FormLabel>رابط برنامج المكافآت</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    {renderMultiSelect('cashback.cashback_account_type', 'أنواع الحسابات المؤهلة', TermsBank.accountTypes)}
                    <FormField control={form.control} name="cashback.cashback_frequency" render={({ field }) => (<FormItem><FormLabel>تكرار المكافأة</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{TermsBank.cashbackFrequency.map(o=><SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                    {renderMultiSelect('cashback.rebate_method', 'طريقة دفع المكافأة', TermsBank.rebateMethod)}
                    <FormField control={form.control} name="cashback.cashback_per_lot" render={({ field }) => (<FormItem><FormLabel>قيمة المكافأة لكل لوت ($)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                </AccordionContent>
              </AccordionItem>

               {/* Section 9: Regional */}
              <AccordionItem value="item-9">
                <AccordionTrigger>9. التوزيع الإقليمي</AccordionTrigger>
                <AccordionContent className="space-y-4">
                    {renderMultiSelect('globalReach.business_region', 'المناطق المسموح بها', TermsBank.regionalDistribution)}
                </AccordionContent>
              </AccordionItem>

              {/* Section 10: Ratings */}
              <AccordionItem value="item-10">
                <AccordionTrigger>10. تقييمات الوسيط</AccordionTrigger>
                <AccordionContent className="space-y-4">
                    <FormField control={form.control} name="reputation.trustpilot_rating" render={({ field }) => (<FormItem><FormLabel>التقييم العام (1-5)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="reputation.reviews_count" render={({ field }) => (<FormItem><FormLabel>عدد المراجعات</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="reputation.verified_users" render={({ field }) => (<FormItem><FormLabel>عدد المستخدمين الموثوقين</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="reputation.wikifx_score" render={({ field }) => (<FormItem><FormLabel>تقييم WikiFX (1-10)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                </AccordionContent>
              </AccordionItem>

              {/* Section 11: Description */}
              <AccordionItem value="item-11">
                <AccordionTrigger>11. وصف وتعليمات</AccordionTrigger>
                <AccordionContent className="space-y-4">
                    <FormField control={form.control} name="instructions.description" render={({ field }) => (<FormItem><FormLabel>وصف الوسيط</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="instructions.new_account_instructions" render={({ field }) => (<FormItem><FormLabel>تعليمات فتح حساب جديد</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="instructions.new_account_link" render={({ field }) => (<FormItem><FormLabel>رابط فتح الحساب</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="instructions.new_account_link_text" render={({ field }) => (<FormItem><FormLabel>نص رابط فتح الحساب</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                     <FormField control={form.control} name="existingAccountInstructions" render={({ field }) => (<FormItem><FormLabel>تعليمات ربط الحساب الحالي</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)}/>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            </ScrollArea>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                {broker ? "حفظ التغييرات" : "إنشاء وسيط"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
