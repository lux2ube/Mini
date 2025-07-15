
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { getBannerSettings, updateBannerSettings } from "../actions";
import { Loader2 } from "lucide-react";
import type { BannerSettings } from "@/types";

const formSchema = z.object({
    scriptCode: z.string().optional(),
    isEnabled: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

export default function ManageBannerPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            scriptCode: "",
            isEnabled: false,
        },
    });

    useEffect(() => {
        async function fetchSettings() {
            setIsLoading(true);
            try {
                const settings = await getBannerSettings();
                form.reset(settings);
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Could not fetch banner settings." });
            } finally {
                setIsLoading(false);
            }
        }
        fetchSettings();
    }, [form, toast]);

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        const result = await updateBannerSettings(data);
        if (result.success) {
            toast({ title: "Success", description: result.message });
        } else {
            toast({ variant: "destructive", title: "Error", description: result.message });
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
                title="Manage Banner"
                description="Update the promotional banner displayed to users."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Banner Settings</CardTitle>
                    <CardDescription>
                        Paste your ad script code below. This will be rendered on the user dashboard.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="isEnabled"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Enable Banner</FormLabel>
                                            <FormDescription>
                                                Turn this on to show the banner on the user dashboard.
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
                            <FormField
                                control={form.control}
                                name="scriptCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Banner Script Code</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder='<script src="..."></script>'
                                                className="min-h-[150px] font-mono text-xs"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Enter the full HTML script tag for your ad banner.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Settings
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
