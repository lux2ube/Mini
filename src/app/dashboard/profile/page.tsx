
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthContext } from "@/hooks/useAuthContext";
import { Loader2, User, KeyRound, Copy, Star, Mail, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { updateUserProfile } from "@/app/admin/actions";
import { useRouter } from "next/navigation";


const profileSchema = z.object({
    name: z.string().min(3, { message: "Name must be at least 3 characters." }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
    const { user, isLoading, refetchUserData } = useAuthContext();
    const router = useRouter();
    const { toast } = useToast();
    
    const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);

    const profileForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        values: {
            name: user?.profile?.name || "",
        },
    });

    const handleProfileSubmit = async (values: ProfileFormValues) => {
        if (!user) return;
        setIsProfileSubmitting(true);
        const result = await updateUserProfile(user.uid, values);
        if (result.success) {
            toast({ type: "success", title: "Success", description: result.message });
            refetchUserData();
        } else {
            toast({ type: "error", title: "Error", description: result.message });
        }
        setIsProfileSubmitting(false);
    };
    
    const copyToClipboard = (text: string | undefined) => {
        if (text) {
            navigator.clipboard.writeText(text);
            toast({ title: 'Copied!' });
        }
    }

    if (isLoading || !user || !user.profile) {
        return (
            <div className="flex items-center justify-center h-full min-h-[calc(100vh-theme(spacing.14))]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const { profile } = user;

    return (
        <div className="max-w-md mx-auto w-full px-4 py-4 space-y-6">
            <Button variant="ghost" onClick={() => router.back()} className="h-auto p-0 text-sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Settings
            </Button>
            <PageHeader title="Edit Profile" description="Manage your personal information." />

            <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                    <AvatarFallback className="text-4xl bg-primary/20 text-primary font-bold">
                        {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
                    </AvatarFallback>
                </Avatar>
                <div className="text-center">
                    <h2 className="text-2xl font-bold">{profile.name}</h2>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                    <Badge variant="secondary" className="mt-2">
                        <Star className="mr-2 h-4 w-4 text-amber-500"/>
                        {profile.tier || 'Bronze'}
                    </Badge>
                </div>
            </div>

            {/* --- Personal Information Card --- */}
            <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Update Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <FormField
                                control={profileForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="Your full name" {...field} className="pl-10" />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div>
                                <Label>Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input readOnly value={profile.email} className="pl-10 bg-muted/70" />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0 justify-end">
                            <Button type="submit" size="sm" disabled={isProfileSubmitting}>
                                {isProfileSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </Form>

             {/* --- UID & Referral Code Card --- */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Account Identifiers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>User ID (UID)</Label>
                        <div className="flex items-center gap-2">
                            <Input readOnly value={profile.uid} className="font-mono text-xs" />
                            <Button type="button" variant="outline" size="icon" onClick={() => copyToClipboard(profile.uid)}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div>
                        <Label>Your Referral Code</Label>
                        <div className="flex items-center gap-2">
                             <div className="relative flex-grow">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input readOnly value={profile.referralCode || 'N/A'} className="font-mono text-sm pl-10" />
                            </div>
                            <Button type="button" variant="outline" size="icon" onClick={() => copyToClipboard(profile.referralCode)}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

        </div>
    )
}
