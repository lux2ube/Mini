
"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Broker } from "@/types";
import { addBroker, updateBroker } from "@/app/admin/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "../ui/separator";

const formSchema = z.object({
  logoUrl: z.string().url("Must be a valid URL.").optional().default("https://placehold.co/100x100.png"),
  
  basicInfo: z.object({
    broker_name: z.string().min(2, "Broker name is required."),
    group_entity: z.string().optional().default(""),
    founded_year: z.coerce.number().optional().default(new Date().getFullYear()),
    headquarters: z.string().optional().default(""),
    CEO: z.string().optional().default(""),
  }),
  regulation: z.object({
    regulated_in: z.string().transform(v => v.split(',').map(s => s.trim())).optional().default([]),
    regulator_name: z.string().transform(v => v.split(',').map(s => s.trim())).optional().default([]),
    license_type: z.string().optional().default(""),
    regulation_status: z.enum(['Active', 'Revoked', 'Expired', 'Unregulated']).optional().default('Unregulated'),
    offshore_regulation: z.boolean().optional().default(false),
    risk_level: z.enum(['Low', 'Medium', 'High', 'Suspicious', 'Unregulated']).optional().default('Unregulated'),
  }),
  tradingConditions: z.object({
      broker_type: z.enum(['Market Maker', 'ECN', 'STP', 'Hybrid']).optional().default('Hybrid'),
      account_types: z.string().transform(v => v.split(',').map(s => s.trim())).optional().default([]),
      swap_free: z.boolean().optional().default(false),
      max_leverage: z.string().optional().default(""),
      min_deposit: z.coerce.number().optional().default(0),
      spread_type: z.enum(['Fixed', 'Variable']).optional().default('Variable'),
      min_spread: z.coerce.number().optional().default(0),
      commission_per_lot: z.coerce.number().optional().default(0),
      execution_speed: z.string().optional().default(""),
  }),
  platforms: z.object({
      platforms_supported: z.string().transform(v => v.split(',').map(s => s.trim())).optional().default([]),
      mt4_license_type: z.enum(['Full License', 'White Label', 'None']).optional().default('None'),
      mt5_license_type: z.enum(['Full License', 'White Label', 'None']).optional().default('None'),
      custom_platform: z.boolean().optional().default(false),
  }),
  instruments: z.object({
      forex_pairs: z.string().optional().default(""),
      crypto_trading: z.boolean().optional().default(false),
      stocks: z.boolean().optional().default(false),
      commodities: z.boolean().optional().default(false),
      indices: z.boolean().optional().default(false),
  }),
  depositsWithdrawals: z.object({
      payment_methods: z.string().transform(v => v.split(',').map(s => s.trim())).optional().default([]),
      min_withdrawal: z.coerce.number().optional().default(0),
      withdrawal_speed: z.string().optional().default(""),
      deposit_fees: z.boolean().optional().default(false),
      withdrawal_fees: z.boolean().optional().default(false),
  }),
  cashback: z.object({
      cashback_per_lot: z.coerce.number().optional().default(0),
      cashback_account_type: z.string().transform(v => v.split(',').map(s => s.trim())).optional().default([]),
      cashback_frequency: z.enum(['Daily', 'Weekly', 'Monthly']).optional().default('Daily'),
      rebate_method: z.string().transform(v => v.split(',').map(s => s.trim())).optional().default([]),
      affiliate_program_link: z.string().url("Must be a valid URL.").optional().default("https://example.com"),
  }),
  globalReach: z.object({
      business_region: z.string().transform(v => v.split(',').map(s => s.trim())).optional().default([]),
      global_presence: z.string().optional().default(""),
      languages_supported: z.string().transform(v => v.split(',').map(s => s.trim())).optional().default([]),
      customer_support_channels: z.string().transform(v => v.split(',').map(s => s.trim())).optional().default([]),
  }),
  reputation: z.object({
      wikifx_score: z.coerce.number().optional().default(0),
      trustpilot_rating: z.coerce.number().optional().default(0),
      reviews_count: z.coerce.number().optional().default(0),
      verified_users: z.coerce.number().optional().default(0),
  }),
  additionalFeatures: z.object({
      education_center: z.boolean().optional().default(false),
      copy_trading: z.boolean().optional().default(false),
      demo_account: z.boolean().optional().default(false),
      trading_contests: z.boolean().optional().default(false),
      regulatory_alerts: z.string().optional().default(""),
  }),
  // Legacy fields - for data migration and compatibility
  name: z.string().optional(),
  description: z.string().optional(),
  category: z.enum(['forex', 'crypto', 'other']).optional().default('forex'),
  rating: z.coerce.number().optional(),
}).passthrough(); // Allow extra fields from old structure

type BrokerFormValues = z.infer<typeof formSchema>;

interface BrokerFormDialogProps {
  broker?: Broker | null;
  children: React.ReactNode;
  onSuccess: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const arrayToString = (arr: any) => Array.isArray(arr) ? arr.join(', ') : (typeof arr === 'string' ? arr : '');

// Function to safely get default values for the form, handling old and new data structures
const getSafeDefaultValues = (broker?: Broker | null): Partial<BrokerFormValues> => {
    if (!broker) {
        // Return default values for a new broker
        return {
          logoUrl: "https://placehold.co/100x100.png",
          basicInfo: { broker_name: "", group_entity: "", founded_year: new Date().getFullYear(), headquarters: "", CEO: "" },
          regulation: { regulated_in: [] as any, regulator_name: [] as any, license_type: "", regulation_status: 'Unregulated', offshore_regulation: false, risk_level: 'Unregulated' },
          tradingConditions: { broker_type: 'Hybrid', account_types: [] as any, swap_free: false, max_leverage: "1:500", min_deposit: 10, spread_type: 'Variable', min_spread: 0, commission_per_lot: 0, execution_speed: "" },
          platforms: { platforms_supported: [] as any, mt4_license_type: 'None', mt5_license_type: 'None', custom_platform: false },
          instruments: { forex_pairs: "", crypto_trading: false, stocks: false, commodities: false, indices: false },
          depositsWithdrawals: { payment_methods: [] as any, min_withdrawal: 0, withdrawal_speed: "", deposit_fees: false, withdrawal_fees: false },
          cashback: { cashback_per_lot: 0, cashback_account_type: [] as any, cashback_frequency: 'Daily', rebate_method: [] as any, affiliate_program_link: "https://example.com" },
          globalReach: { business_region: [] as any, global_presence: "", languages_supported: [] as any, customer_support_channels: [] as any },
          reputation: { wikifx_score: 0, trustpilot_rating: 0, reviews_count: 0, verified_users: 0 },
          additionalFeatures: { education_center: false, copy_trading: false, demo_account: false, trading_contests: false, regulatory_alerts: "" },
          category: 'forex',
        };
    }

    // If it's the new structure, format array fields and return
    if (broker.basicInfo) {
        return {
            ...broker,
            regulation: { ...broker.regulation, regulated_in: arrayToString(broker.regulation.regulated_in), regulator_name: arrayToString(broker.regulation.regulator_name) },
            tradingConditions: { ...broker.tradingConditions, account_types: arrayToString(broker.tradingConditions.account_types) },
            platforms: { ...broker.platforms, platforms_supported: arrayToString(broker.platforms.platforms_supported) },
            depositsWithdrawals: { ...broker.depositsWithdrawals, payment_methods: arrayToString(broker.depositsWithdrawals.payment_methods) },
            cashback: { ...broker.cashback, cashback_account_type: arrayToString(broker.cashback.cashback_account_type), rebate_method: arrayToString(broker.cashback.rebate_method) },
            globalReach: { ...broker.globalReach, business_region: arrayToString(broker.globalReach.business_region), languages_supported: arrayToString(broker.globalReach.languages_supported), customer_support_channels: arrayToString(broker.globalReach.customer_support_channels) },
        };
    }

    // Fallback for old data structure: map old fields to new structure
    return {
        logoUrl: broker.logoUrl,
        basicInfo: {
            broker_name: broker.name,
            group_entity: "",
            founded_year: new Date().getFullYear(),
            headquarters: "",
            CEO: "",
        },
        reputation: {
            wikifx_score: (broker.rating ?? 0) * 2,
            trustpilot_rating: 0,
            reviews_count: 0,
            verified_users: 0,
        },
        category: broker.category,
        // Set other fields to default empty values
        regulation: { regulated_in: [] as any, regulator_name: [] as any, license_type: "", regulation_status: 'Unregulated', offshore_regulation: false, risk_level: 'Unregulated' },
        tradingConditions: { broker_type: 'Hybrid', account_types: [] as any, swap_free: false, max_leverage: "1:500", min_deposit: 10, spread_type: 'Variable', min_spread: 0, commission_per_lot: 0, execution_speed: "" },
        platforms: { platforms_supported: [] as any, mt4_license_type: 'None', mt5_license_type: 'None', custom_platform: false },
        instruments: { forex_pairs: "", crypto_trading: false, stocks: false, commodities: false, indices: false },
        depositsWithdrawals: { payment_methods: [] as any, min_withdrawal: 0, withdrawal_speed: "", deposit_fees: false, withdrawal_fees: false },
        cashback: { cashback_per_lot: broker.cashbackRate?.amount ?? 0, cashback_account_type: [] as any, cashback_frequency: 'Daily', rebate_method: [] as any, affiliate_program_link: "https://example.com" },
        globalReach: { business_region: [] as any, global_presence: "", languages_supported: [] as any, customer_support_channels: [] as any },
        additionalFeatures: { education_center: false, copy_trading: false, demo_account: false, trading_contests: false, regulatory_alerts: "" },
    };
};

export function BrokerFormDialog({
  broker,
  children,
  onSuccess,
  isOpen,
  setIsOpen,
}: BrokerFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<BrokerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getSafeDefaultValues(broker)
  });

  const onSubmit = async (values: BrokerFormValues) => {
    setIsSubmitting(true);
    // Populate legacy fields for compatibility during transition
    const finalValues: any = {
        ...values,
        name: values.basicInfo.broker_name,
        description: `Founded in ${values.basicInfo.founded_year}, headquartered in ${values.basicInfo.headquarters}.`,
        rating: Math.round((values.reputation?.wikifx_score ?? 0) / 2),
    };

    try {
      let result;
      if (broker) {
        result = await updateBroker(broker.id, finalValues);
      } else {
        result = await addBroker(finalValues as Omit<Broker, "id" | "order">);
      }

      if (result.success) {
        toast({ title: "Success", description: result.message });
        setIsOpen(false);
        form.reset();
        onSuccess();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBooleanField = (name: any, label: string) => (
    <FormField control={form.control} name={name} render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>{label}</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
    )}/>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{broker ? "Edit" : "Add"} Broker</DialogTitle>
          <DialogDescription>
            {broker ? "Update the details of this broker." : "Add a new partner broker to the list."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-1">
            <Accordion type="multiple" defaultValue={['item-1']} className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Section 1: Basic Broker Information</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <FormField control={form.control} name="logoUrl" render={({ field }) => (<FormItem><FormLabel>Logo URL</FormLabel><FormControl><Input placeholder="https://placehold.co/100x100.png" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="forex">Forex</SelectItem><SelectItem value="crypto">Crypto</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="basicInfo.broker_name" render={({ field }) => (<FormItem><FormLabel>Broker Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="basicInfo.group_entity" render={({ field }) => (<FormItem><FormLabel>Parent Company</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="basicInfo.founded_year" render={({ field }) => (<FormItem><FormLabel>Year Founded</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="basicInfo.headquarters" render={({ field }) => (<FormItem><FormLabel>Headquarters</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="basicInfo.CEO" render={({ field }) => (<FormItem><FormLabel>CEO</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Section 2: Regulation & Licensing</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <FormField control={form.control} name="regulation.regulated_in" render={({ field }) => (<FormItem><FormLabel>Regulated In (comma-separated)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="regulation.regulator_name" render={({ field }) => (<FormItem><FormLabel>Regulator Names (comma-separated)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="regulation.license_type" render={({ field }) => (<FormItem><FormLabel>License Type</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="regulation.regulation_status" render={({ field }) => (<FormItem><FormLabel>Regulation Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Revoked">Revoked</SelectItem><SelectItem value="Expired">Expired</SelectItem><SelectItem value="Unregulated">Unregulated</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                  <FormField control={form.control} name="regulation.risk_level" render={({ field }) => (<FormItem><FormLabel>Risk Level</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Suspicious">Suspicious</SelectItem><SelectItem value="Unregulated">Unregulated</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                  {renderBooleanField('regulation.offshore_regulation', 'Offshore Regulation')}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                  <AccordionTrigger>Section 3: Trading Conditions</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                      <FormField control={form.control} name="tradingConditions.broker_type" render={({ field }) => (<FormItem><FormLabel>Broker Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Market Maker">Market Maker</SelectItem><SelectItem value="ECN">ECN</SelectItem><SelectItem value="STP">STP</SelectItem><SelectItem value="Hybrid">Hybrid</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                      <FormField control={form.control} name="tradingConditions.account_types" render={({ field }) => (<FormItem><FormLabel>Account Types (comma-separated)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={form.control} name="tradingConditions.max_leverage" render={({ field }) => (<FormItem><FormLabel>Max Leverage</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={form.control} name="tradingConditions.min_deposit" render={({ field }) => (<FormItem><FormLabel>Min Deposit (USD)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={form.control} name="tradingConditions.spread_type" render={({ field }) => (<FormItem><FormLabel>Spread Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Fixed">Fixed</SelectItem><SelectItem value="Variable">Variable</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                      <FormField control={form.control} name="tradingConditions.min_spread" render={({ field }) => (<FormItem><FormLabel>Min Spread (pips)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={form.control} name="tradingConditions.commission_per_lot" render={({ field }) => (<FormItem><FormLabel>Commission per Lot (USD)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={form.control} name="tradingConditions.execution_speed" render={({ field }) => (<FormItem><FormLabel>Execution Speed</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      {renderBooleanField('tradingConditions.swap_free', 'Swap-free Accounts')}
                  </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                  <AccordionTrigger>Section 4: Platforms & Technology</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                      <FormField control={form.control} name="platforms.platforms_supported" render={({ field }) => (<FormItem><FormLabel>Platforms Supported (comma-separated)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={form.control} name="platforms.mt4_license_type" render={({ field }) => (<FormItem><FormLabel>MT4 License</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Full License">Full License</SelectItem><SelectItem value="White Label">White Label</SelectItem><SelectItem value="None">None</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                      <FormField control={form.control} name="platforms.mt5_license_type" render={({ field }) => (<FormItem><FormLabel>MT5 License</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Full License">Full License</SelectItem><SelectItem value="White Label">White Label</SelectItem><SelectItem value="None">None</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                      {renderBooleanField('platforms.custom_platform', 'Uses Custom Platform')}
                  </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                  <AccordionTrigger>Section 5: Instruments Offered</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                      <FormField control={form.control} name="instruments.forex_pairs" render={({ field }) => (<FormItem><FormLabel>Forex Pairs</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      {renderBooleanField('instruments.crypto_trading', 'Crypto Trading')}
                      {renderBooleanField('instruments.stocks', 'Stocks')}
                      {renderBooleanField('instruments.commodities', 'Commodities')}
                      {renderBooleanField('instruments.indices', 'Indices')}
                  </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-6">
                  <AccordionTrigger>Section 6: Deposits & Withdrawals</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                      <FormField control={form.control} name="depositsWithdrawals.payment_methods" render={({ field }) => (<FormItem><FormLabel>Payment Methods (comma-separated)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={form.control} name="depositsWithdrawals.min_withdrawal" render={({ field }) => (<FormItem><FormLabel>Min Withdrawal (USD)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={form.control} name="depositsWithdrawals.withdrawal_speed" render={({ field }) => (<FormItem><FormLabel>Withdrawal Speed</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      {renderBooleanField('depositsWithdrawals.deposit_fees', 'Deposit Fees')}
                      {renderBooleanField('depositsWithdrawals.withdrawal_fees', 'Withdrawal Fees')}
                  </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-7">
                  <AccordionTrigger>Section 7: Cashback Settings</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                      <FormField control={form.control} name="cashback.cashback_per_lot" render={({ field }) => (<FormItem><FormLabel>Cashback per Lot (USD)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={form.control} name="cashback.cashback_account_type" render={({ field }) => (<FormItem><FormLabel>Cashback Account Types (comma-separated)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={form.control} name="cashback.cashback_frequency" render={({ field }) => (<FormItem><FormLabel>Cashback Frequency</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Daily">Daily</SelectItem><SelectItem value="Weekly">Weekly</SelectItem><SelectItem value="Monthly">Monthly</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                      <FormField control={form.control} name="cashback.rebate_method" render={({ field }) => (<FormItem><FormLabel>Rebate Method (comma-separated)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={form.control} name="cashback.affiliate_program_link" render={({ field }) => (<FormItem><FormLabel>Affiliate Program Link</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-8">
                  <AccordionTrigger>Section 8: Global Reach</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                      <FormField control={form.control} name="globalReach.business_region" render={({ field }) => (<FormItem><FormLabel>Business Region (comma-separated)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={form.control} name="globalReach.global_presence" render={({ field }) => (<FormItem><FormLabel>Global Presence</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={form.control} name="globalReach.languages_supported" render={({ field }) => (<FormItem><FormLabel>Languages Supported (comma-separated)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={form.control} name="globalReach.customer_support_channels" render={({ field }) => (<FormItem><FormLabel>Support Channels (comma-separated)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-9">
                  <AccordionTrigger>Section 9: Reputation & Scoring</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                      <FormField control={form.control} name="reputation.wikifx_score" render={({ field }) => (<FormItem><FormLabel>WikiFX Score (out of 10)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={form.control} name="reputation.trustpilot_rating" render={({ field }) => (<FormItem><FormLabel>Trustpilot Rating (out of 5)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={form.control} name="reputation.reviews_count" render={({ field }) => (<FormItem><FormLabel>Total Reviews</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={form.control} name="reputation.verified_users" render={({ field }) => (<FormItem><FormLabel>Verified Users</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-10">
                  <AccordionTrigger>Section 10: Additional Features</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                      {renderBooleanField('additionalFeatures.education_center', 'Education Center')}
                      {renderBooleanField('additionalFeatures.copy_trading', 'Copy Trading')}
                      {renderBooleanField('additionalFeatures.demo_account', 'Demo Account')}
                      {renderBooleanField('additionalFeatures.trading_contests', 'Trading Contests')}
                      <FormField control={form.control} name="additionalFeatures.regulatory_alerts" render={({ field }) => (<FormItem><FormLabel>Regulatory Alerts</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => { form.reset(); setIsOpen(false); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {broker ? "Save Changes" : "Create Broker"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
