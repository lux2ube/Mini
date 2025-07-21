
"use client";

import { useState, useEffect } from "react";
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
import { PlusCircle, Loader2, Edit, Trash2, Save, Gem, Star, Percent } from "lucide-react";
import type { LoyaltyTier, PointsRule, PointsRuleAction } from "@/types";
import { POINTS_RULE_ACTIONS } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";

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
    getLoyaltyTiers().then(data => {
      form.reset({ tiers: data });
      setIsLoading(false);
    });
  }, [form]);

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
                <Card key={field.id} className="p-4">
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
              <Save className="ml-2 h-4 w-4" /> حفظ المستويات
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
                        {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
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

    const fetchRules = async () => {
        setIsLoading(true);
        const data = await getPointsRules();
        setRules(data);
        setIsLoading(false);
    }

    useEffect(() => {
        fetchRules();
    }, []);

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
                    <Button onClick={handleAdd}><PlusCircle className="ml-2 h-4 w-4" /> إضافة قاعدة</Button>
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
