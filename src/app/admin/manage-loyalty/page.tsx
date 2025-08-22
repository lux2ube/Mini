
"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { getLoyaltyTiers, updateLoyaltyTiers } from "../actions";
import { Loader2, Save, Gem, User, Handshake, Gift } from "lucide-react";
import type { LoyaltyTier } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const tierSchema = z.object({
  name: z.enum(['New', 'Bronze', 'Silver', 'Gold', 'Diamond', 'Ambassador']),
  monthlyPointsRequired: z.coerce.number().min(0),
  
  // User Actions
  referralCommissionPercent: z.coerce.number().min(0),
  storeDiscountPercent: z.coerce.number().min(0),
  user_signup_pts: z.coerce.number().min(0),
  user_approval_pts: z.coerce.number().min(0),
  user_cashback_pts: z.coerce.number().min(0),
  user_store_pts: z.coerce.number().min(0),

  // Partner Direct Earnings
  partner_cashback_com: z.coerce.number().min(0),
  partner_store_com: z.coerce.number().min(0),
  partner_cashback_pts: z.coerce.number().min(0),
  partner_store_pts: z.coerce.number().min(0),

  // Referral Bonuses
  ref_signup_pts: z.coerce.number().min(0),
  ref_approval_pts: z.coerce.number().min(0),
  ref_cashback_pts: z.coerce.number().min(0),
  ref_store_pts: z.coerce.number().min(0),
});

const formSchema = z.object({
  tiers: z.array(tierSchema),
});

type FormData = z.infer<typeof formSchema>;

const tierColumnGroups = [
    { 
        title: "متطلبات المستوى",
        fields: [
            { name: "monthlyPointsRequired", label: "النقاط الشهرية" }
        ]
    },
    { 
        title: "مكافآت المستخدم", 
        icon: User,
        fields: [
            { name: "user_signup_pts", label: "تسجيل" },
            { name: "user_approval_pts", label: "موافقة الحساب" },
            { name: "user_cashback_pts", label: "كاش باك (لكل 100$)" },
            { name: "user_store_pts", label: "متجر (لكل 100$)" }
        ]
    },
    { 
        title: "أرباح الشريك المباشرة", 
        icon: Handshake,
        fields: [
            { name: "partner_cashback_com", label: "عمولة كاش باك (%)" },
            { name: "partner_store_com", label: "عمولة متجر (%)" },
            { name: "partner_cashback_pts", label: "نقاط كاش باك (لكل 100$)" },
            { name: "partner_store_pts", label: "نقاط متجر (لكل 100$)" }
        ]
    },
    { 
        title: "مكافآت الإحالة", 
        icon: Gift,
        fields: [
            { name: "ref_signup_pts", label: "تسجيل" },
            { name: "ref_approval_pts", label: "موافقة الحساب" },
            { name: "ref_cashback_pts", label: "كاش باك (لكل 100$)" },
            { name: "ref_store_pts", label: "متجر (لكل 100$)" }
        ]
    }
];

export default function ManageLoyaltyPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { tiers: [] },
  });

  const { fields } = useFieldArray({ control: form.control, name: "tiers" });

  useEffect(() => {
    async function fetchTiers() {
      setIsLoading(true);
      try {
        const data = await getLoyaltyTiers();
        form.reset({ tiers: data });
      } catch (error) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'لا يمكن تحميل مستويات الولاء.'});
      } finally {
        setIsLoading(false);
      }
    }
    fetchTiers();
  }, [form, toast]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const result = await updateLoyaltyTiers(data.tiers);
    if (result.success) {
      toast({ title: "نجاح", description: result.message });
    } else {
      toast({ variant: "destructive", title: "خطأ", description: result.message });
    }
    setIsSubmitting(false);
  };
  
  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-full min-h-[calc(100vh-theme(spacing.14))]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      <PageHeader
        title="إدارة نظام الولاء"
        description="تكوين مستويات الولاء والمكافآت لكل إجراء."
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardContent className="p-0">
                <ScrollArea>
                  <Table className="min-w-max">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 z-10 bg-muted/95 w-32">المستوى</TableHead>
                        {tierColumnGroups.map(group => (
                            <TableHead key={group.title} colSpan={group.fields.length} className="text-center border-l">
                                <div className="flex items-center justify-center gap-2">
                                    {group.icon && <group.icon className="h-4 w-4" />}
                                    {group.title}
                                </div>
                            </TableHead>
                        ))}
                      </TableRow>
                       <TableRow>
                        <TableHead className="sticky left-0 z-10 bg-muted/95"></TableHead>
                         {tierColumnGroups.flatMap(group => group.fields.map(field => (
                           <TableHead key={field.name} className="text-xs text-center border-l w-28">{field.label}</TableHead>
                         )))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((tier, index) => (
                           <TableRow key={tier.id}>
                               <TableCell className="font-semibold sticky left-0 z-10 bg-background/95">
                                   <div className="flex items-center gap-2">
                                       <Gem className="h-4 w-4 text-primary" />
                                       {tier.name}
                                   </div>
                               </TableCell>
                               {tierColumnGroups.flatMap(group => group.fields.map(field => (
                                   <TableCell key={field.name} className="border-l">
                                       <FormField
                                            control={form.control}
                                            name={`tiers.${index}.${field.name as keyof LoyaltyTier}` as any}
                                            render={({ field: formField }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input type="number" {...formField} className="h-8 text-center" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                   </TableCell>
                               )))}
                           </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </CardContent>
          </Card>
           <div className="flex justify-end mt-6">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" /> حفظ كل التغييرات
                </Button>
            </div>
        </form>
      </Form>
    </div>
  );
}
