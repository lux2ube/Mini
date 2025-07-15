
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Broker } from "@/types";
import { addBroker, updateBroker } from "@/app/admin/actions";

const formSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  description: z.string().min(10, "Description is too short"),
  logoUrl: z.string().url("Must be a valid URL"),
  details: z.object({
    minDeposit: z.string().min(1, "Required"),
    leverage: z.string().min(1, "Required"),
    spreads: z.string().min(1, "Required"),
  }),
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
          name: broker.name,
          description: broker.description,
          logoUrl: broker.logoUrl,
          details: broker.details,
          instructions: broker.instructions,
          existingAccountInstructions: broker.existingAccountInstructions,
        }
      : {
          name: "",
          description: "",
          logoUrl: "",
          details: { minDeposit: "", leverage: "", spreads: "" },
          instructions: { description: "", linkText: "", link: "" },
          existingAccountInstructions: "",
        },
  });

  const onSubmit = async (values: BrokerFormValues) => {
    setIsSubmitting(true);
    try {
      let result;
      if (broker) {
        result = await updateBroker(broker.id, values);
      } else {
        result = await addBroker(values as Omit<Broker, "id">);
      }

      if (result.success) {
        toast({ title: "Success", description: result.message });
        setIsOpen(false);
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
                 <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Broker Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Exness" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
                 <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                            <Textarea placeholder="A short description of the broker..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
                 <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Logo URL</FormLabel>
                        <FormControl>
                            <Input placeholder="https://placehold.co/100x100.png" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
            </div>
            
            <div className="space-y-4 p-4 border rounded-md">
                <h3 className="font-semibold text-lg">Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <FormField
                        control={form.control}
                        name="details.minDeposit"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Min. Deposit</FormLabel>
                            <FormControl><Input placeholder="$10" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="details.leverage"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Leverage</FormLabel>
                            <FormControl><Input placeholder="1:2000" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="details.spreads"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Spreads</FormLabel>
                            <FormControl><Input placeholder="From 0.0 pips" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            <div className="space-y-4 p-4 border rounded-md">
                <h3 className="font-semibold text-lg">New Account Instructions</h3>
                <FormField
                    control={form.control}
                    name="instructions.description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Instruction Text</FormLabel>
                        <FormControl><Textarea placeholder="Instructions for users opening a new account..." {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="instructions.linkText"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Link Button Text</FormLabel>
                        <FormControl><Input placeholder="Open Account" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="instructions.link"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Partner Link</FormLabel>
                        <FormControl><Input placeholder="https://broker.com/partner-link" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                </div>
            </div>

            <div className="space-y-4 p-4 border rounded-md">
                <h3 className="font-semibold text-lg">Existing Account Instructions</h3>
                 <FormField
                    control={form.control}
                    name="existingAccountInstructions"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Instruction Text</FormLabel>
                        <FormControl><Textarea placeholder="Instructions for users with an existing account..." {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
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
