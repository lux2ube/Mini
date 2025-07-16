
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
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Broker } from "@/types";
import { addBroker, updateBroker } from "@/app/admin/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  description: z.string().min(10, "Description is too short"),
  logoUrl: z.string().url("Must be a valid URL"),
  category: z.enum(['forex', 'crypto', 'other']),
  rating: z.coerce.number().min(1).max(5),
  details: z.object({
    cashbackType: z.string().min(1, "Required"),
    minDeposit: z.string().min(1, "Required"),
  }),
  cashbackRate: z.object({
    tradeType: z.string().min(1, "Required"),
    amount: z.coerce.number().positive(),
  }),
  features: z.array(z.object({
    text: z.string().min(1, "Feature text is required"),
    available: z.boolean(),
  })),
  instructions: z.object({
    description: z.string().min(10, "Required"),
    linkText: z.string().min(1, "Required"),
    link: z.string().url("Must be a valid URL"),
  }),
  existingAccountInstructions: z.string().min(10, "Instructions are too short."),
});

type BrokerFormValues = z.infer<typeof formSchema>;

interface BrokerFormDialogProps {
  broker?: Broker | null;
  children: React.ReactNode;
  onSuccess: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

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
    defaultValues: broker
      ? {
          ...broker,
          rating: broker.rating || 0,
          cashbackRate: broker.cashbackRate || { tradeType: '', amount: 0},
          features: broker.features || []
        }
      : {
          name: "",
          description: "",
          logoUrl: "",
          category: 'forex',
          rating: 4,
          details: { cashbackType: "", minDeposit: "" },
          cashbackRate: { tradeType: "Trade 1 lot", amount: 0 },
          features: [],
          instructions: { description: "", linkText: "", link: "" },
          existingAccountInstructions: "",
        },
  });

  const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "features"
  });

  const onSubmit = async (values: BrokerFormValues) => {
    setIsSubmitting(true);
    try {
      let result;
      if (broker) {
        result = await updateBroker(broker.id, values);
      } else {
        result = await addBroker(values as Omit<Broker, "id" | "order">);
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{broker ? "Edit" : "Add"} Broker</DialogTitle>
          <DialogDescription>
            {broker ? "Update the details of this broker." : "Add a new partner broker to the list."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
            <div className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Broker Name</FormLabel><FormControl><Input placeholder="e.g., Exness" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="logoUrl" render={({ field }) => (
                    <FormItem><FormLabel>Logo URL</FormLabel><FormControl><Input placeholder="https://placehold.co/100x100.png" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="category" render={({ field }) => (
                        <FormItem><FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                           <SelectContent><SelectItem value="forex">Forex</SelectItem><SelectItem value="crypto">Crypto</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                        </Select>
                        <FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="rating" render={({ field }) => (
                        <FormItem><FormLabel>Rating (1-5)</FormLabel><FormControl><Input type="number" min="1" max="5" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                 <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Short Description</FormLabel><FormControl><Textarea placeholder="A short description of the broker..." {...field} /></FormControl><FormMessage /></FormItem>
                 )}/>
            </div>
            
            <Separator/>
            <h3 className="font-semibold text-lg">Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="details.cashbackType" render={({ field }) => (
                    <FormItem><FormLabel>Cashback Type</FormLabel><FormControl><Input placeholder="e.g., Daily Forex Cashback" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="details.minDeposit" render={({ field }) => (
                    <FormItem><FormLabel>Min. Deposit</FormLabel><FormControl><Input placeholder="$10" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
            
            <Separator/>
            <h3 className="font-semibold text-lg">Cashback Rate</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField control={form.control} name="cashbackRate.tradeType" render={({ field }) => (
                    <FormItem><FormLabel>Trade Type</FormLabel><FormControl><Input placeholder="e.g., Trade 1 lot" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <FormField control={form.control} name="cashbackRate.amount" render={({ field }) => (
                    <FormItem><FormLabel>Amount ($)</FormLabel><FormControl><Input type="number" placeholder="8.4" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
            
            <Separator/>
            <h3 className="font-semibold text-lg">Features</h3>
            <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-2">
                       <FormField control={form.control} name={`features.${index}.text`} render={({ field }) => (
                            <FormItem className="flex-grow"><FormLabel>Feature Text</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                        )}/>
                       <FormField control={form.control} name={`features.${index}.available`} render={({ field }) => (
                            <FormItem className="flex flex-col items-center gap-2 pb-2"><FormLabel>Available</FormLabel><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                        )}/>
                        <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => append({ text: "", available: true })}><PlusCircle className="mr-2 h-4 w-4"/>Add Feature</Button>
            </div>


            <Separator/>
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">New Account Instructions</h3>
                <FormField control={form.control} name="instructions.description" render={({ field }) => (
                    <FormItem><FormLabel>Instruction Text</FormLabel><FormControl><Textarea placeholder="Instructions for users opening a new account..." {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="instructions.linkText" render={({ field }) => (
                    <FormItem><FormLabel>Link Button Text</FormLabel><FormControl><Input placeholder="Open Account" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="instructions.link" render={({ field }) => (
                    <FormItem><FormLabel>Partner Link</FormLabel><FormControl><Input placeholder="https://broker.com/partner-link" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                </div>
            </div>

            <Separator/>
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Existing Account Instructions</h3>
                 <FormField control={form.control} name="existingAccountInstructions" render={({ field }) => (
                    <FormItem><FormLabel>Instruction Text</FormLabel><FormControl><Textarea placeholder="Instructions for users with an existing account..." {...field} /></FormControl><FormMessage /></FormItem>
                 )}/>
            </div>
            
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
