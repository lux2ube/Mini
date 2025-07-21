
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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getLoyaltyTiers, updateLoyaltyTiers, getPointsRules, addPointsRule, updatePointsRule, deletePointsRule } from "../actions";
import { PlusCircle, Loader2, Edit, Trash2, Save, Gem } from "lucide-react";
import type { LoyaltyTier, PointsRule, PointsRuleAction } from "@/types";
import { POINTS_RULE_ACTIONS } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const tierSchema = z.object({
  name: z.enum(['New', 'Bronze', 'Silver', 'Gold', 'Diamond']),
  monthlyPointsRequired: z.coerce.number().min(0, "النقاط المطلوبة يجب أن تكون موجبة."),
  referralCommissionPercent: z.coerce.number().min(0).max(100, "النسبة يجب أن تكون بين 0 و 100."),
  storeDiscountPercent: z.coerce.number().min(0).max(100, "النسبة يجب أن تكون بين 0 و 100."),
});

const tiersFormSchema = z.object({
  tiers: z.array(tierSchema),
});

type TiersFormData = z.infer<typeof tiersFormSchema>;

const ruleSchema = z.object({
    action: z.enum(POINTS_RULE_ACTIONS, { required_error: "نوع الإجراء مطلوب."}),
    points: z.coerce.number().int("يجب أن تكون النقاط رقمًا صحيحًا."),
    isDollarBased: z.boolean(),
    description: z.string().min(5, "الوصف مطلوب."),
});

type RuleFormData = z.infer<typeof ruleSchema>;

const defaultRules: Omit<PointsRule, 'id'>[] = [
    { action: 'approve_account', points: 50, isDollarBased: false, description: 'مقابل ربط والموافقة على حساب تداول جديد.' },
    { action: 'cashback_earned', points: 1, isDollarBased: true, description: 'اربح نقطة واحدة مقابل كل 1$ من الكاش باك المستلم.' },
    { action: 'store_purchase', points: 1, isDollarBased: true, description: 'اربح نقطة واحدة مقابل كل 1$ يتم إنفاقه في المتجر.' },
    { action: 'referral_signup', points: 25, isDollarBased: false, description: 'مقابل إحالة مستخدم جديد يقوم بالتسجيل.' },
    { action: 'referral_becomes_active', points: 100, isDollarBased: false, description: 'عندما يقوم أحد المحالين بربط أول حساب معتمد له.' },
    { action: 'referral_becomes_trader', points: 250, isDollarBased: false, description: 'عندما يتلقى أحد المحالين أول كاش باك له.' },
    { action: 'referral_commission', points: 1, isDollarBased: true, description: 'اربح نقاطًا من الكاش باك الخاص بالمحالين، بناءً على مستواك.' }
];


function LoyaltyTiersManager() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<TiersFormData>({
    resolver: zodResolver(tiersFormSchema),
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

  const onSubmit = async (data: TiersFormData) => {
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
    return <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>إدارة مستويات الولاء</CardTitle>
        <CardDescription>قم بتعيين المتطلبات والمكافآت لكل مستوى.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="p-4 bg-muted/50">
                   <h3 className="font-semibold mb-2 flex items-center gap-2"><Gem className="h-4 w-4 text-primary" /> مستوى {field.name}</h3>
                   <div className="grid md:grid-cols-3 gap-4">
                       <FormField control={form.control} name={`tiers.${index}.monthlyPointsRequired`} render={({ field }) => (
                           <FormItem><FormLabel>النقاط الشهرية المطلوبة</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                       )}/>
                       <FormField control={form.control} name={`tiers.${index}.referralCommissionPercent`} render={({ field }) => (
                           <FormItem><FormLabel>عمولة الإحالة (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                       )}/>
                       <FormField control={form.control} name={`tiers.${index}.storeDiscountPercent`} render={({ field }) => (
                           <FormItem><FormLabel>خصم المتجر (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                       )}/>
                   </div>
                </Card>
              ))}
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" /> حفظ المستويات
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function PointsRuleForm({ rule, onSuccess, onCancel }: { rule?: PointsRule | null, onSuccess: () => void, onCancel: () => void }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<RuleFormData>({
        resolver: zodResolver(ruleSchema),
        defaultValues: rule || { action: undefined, points: 0, isDollarBased: false, description: "" },
    });

    const onSubmit = async (data: RuleFormData) => {
        setIsSubmitting(true);
        const result = rule
            ? await updatePointsRule(rule.id, data)
            : await addPointsRule(data);

        if (result.success) {
            toast({ title: "نجاح", description: result.message });
            onSuccess();
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
        }
        setIsSubmitting(false);
    }
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField control={form.control} name="action" render={({ field }) => (
                    <FormItem><FormLabel>الإجراء</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="اختر إجراءً" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {POINTS_RULE_ACTIONS.map(act => <SelectItem key={act} value={act}>{act.replace(/_/g, ' ')}</SelectItem>)}
                            </SelectContent>
                        </Select><FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>الوصف</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="points" render={({ field }) => (<FormItem><FormLabel>النقاط</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="isDollarBased" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3"><FormLabel>لكل دولار؟</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                )}/>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={onCancel}>إلغاء</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {rule ? "حفظ التغييرات" : "إنشاء قاعدة"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

function PointsRulesManager() {
    const [rules, setRules] = useState<PointsRule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<PointsRule | null>(null);
    const { toast } = useToast();

    const fetchRules = useCallback(async () => {
        setIsLoading(true);
        try {
            let data = await getPointsRules();
            // If no rules exist, seed them from the defaults
            if (data.length === 0) {
                console.log("No rules found. Seeding default rules...");
                const seedPromises = defaultRules.map(rule => addPointsRule(rule));
                await Promise.all(seedPromises);
                
                // Refetch after seeding
                data = await getPointsRules();
                toast({ title: "نجاح", description: "تم إنشاء قواعد الولاء الافتراضية بنجاح." });
            }
            setRules(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'لا يمكن تحميل قواعد الولاء.'});
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchRules();
    }, [fetchRules]);

    const handleEdit = (rule: PointsRule) => {
        setEditingRule(rule);
        setIsFormOpen(true);
    }

    const handleAdd = () => {
        setEditingRule(null);
        setIsFormOpen(true);
    }

    const handleDelete = async (id: string) => {
        const result = await deletePointsRule(id);
        if (result.success) {
            toast({ title: "نجاح", description: result.message });
            fetchRules();
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
        }
    }

    const handleFormSuccess = () => {
        setIsFormOpen(false);
        setEditingRule(null);
        fetchRules();
    }
    
    return (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>إدارة قواعد النقاط</CardTitle>
                        <CardDescription>حدد كيف يمكن للمستخدمين كسب نقاط الولاء.</CardDescription>
                    </div>
                    <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> إضافة قاعدة</Button>
                </CardHeader>
                <CardContent>
                     {isLoading ? (
                        <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <Table>
                            <TableHeader><TableRow><TableHead>الإجراء</TableHead><TableHead>النقاط</TableHead><TableHead>النوع</TableHead><TableHead className="text-left">الإجراءات</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {rules.map((rule) => (
                                    <TableRow key={rule.id}>
                                        <TableCell className="font-medium capitalize">{rule.action.replace(/_/g, ' ')}</TableCell>
                                        <TableCell>{rule.points}</TableCell>
                                        <TableCell>{rule.isDollarBased ? "لكل دولار" : "مبلغ ثابت"}</TableCell>
                                        <TableCell className="text-left space-x-2">
                                            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleEdit(rule)}><Edit className="h-4 w-4" /></Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild><Button size="icon" variant="destructive" className="h-8 w-8"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle><AlertDialogDescription>سيؤدي هذا إلى حذف هذه القاعدة بشكل دائم.</AlertDialogDescription></AlertDialogHeader>
                                                    <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(rule.id)}>حذف</AlertDialogAction></AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
            <DialogContent>
                <DialogHeader><DialogTitle>{editingRule ? "تعديل" : "إضافة"} قاعدة نقاط</DialogTitle></DialogHeader>
                <PointsRuleForm rule={editingRule} onSuccess={handleFormSuccess} onCancel={() => setIsFormOpen(false)} />
            </DialogContent>
        </Dialog>
    )
}


export default function ManageLoyaltyPage() {
  return (
    <div className="container mx-auto space-y-6">
      <PageHeader
        title="إدارة الولاء والنقاط"
        description="تكوين مستويات الولاء وقواعد كسب النقاط وعمولات الإحالة."
      />
      <LoyaltyTiersManager />
      <PointsRulesManager />
    </div>
  );
}
