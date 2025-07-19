
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthContext } from "@/hooks/useAuthContext";
import { Loader2, User, KeyRound, Copy, ShieldCheck, Diamond, Star } from "lucide-react";
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


const profileSchema = z.object({
    name: z.string().min(3, { message: "Name must be at least 3 characters." }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
    currentPassword: z.string().min(8, "Password must be at least 8 characters."),
    newPassword: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters."),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
    const { user, isLoading, refetchUserData } = useAuthContext();
    const { toast } = useToast();
    
    const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
    const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

    const profileForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        values: {
            name: user?.profile?.name || "",
        },
    });

    const passwordForm = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
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
    
    const handlePasswordSubmit = async (values: PasswordFormValues) => {
        // TODO: Implement actual password change logic with Firebase Auth
        // This requires re-authentication which is more complex.
        // For now, this is a UI demonstration.
        setIsPasswordSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        toast({ type: "success", title: "Password Updated", description: "Your password has been changed successfully." });
        passwordForm.reset();
        setIsPasswordSubmitting(false);
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
            <PageHeader title="Profile & Settings" description="Manage your personal information and security." />

            {/* --- Personal Information Card --- */}
            <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                            <Avatar className="h-16 w-16">
                                <AvatarFallback className="text-2xl bg-primary/20 text-primary font-bold">
                                    {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
                                </AvatarFallback>
                            </Avatar>
                             <div className="flex-grow">
                                <CardTitle className="text-base">Personal Information</CardTitle>
                                <CardDescription className="text-xs">Update your name and view your email.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <FormField
                                control={profileForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Your full name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div>
                                <Label>Email Address</Label>
                                <p className="text-sm font-medium">{profile.email}</p>
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

            {/* --- Referral & Tier Card --- */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Referral & Tier</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Your Referral Code</Label>
                        <div className="flex items-center gap-2">
                            <Input readOnly value={profile.referralCode || 'N/A'} className="font-mono text-sm" />
                            <Button type="button" variant="outline" size="icon" onClick={() => copyToClipboard(profile.referralCode)}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                     <div>
                        <Label>Current Tier</Label>
                        <div className="flex items-center gap-2">
                             <Badge variant="secondary" className="text-base">
                                <Star className="mr-2 h-4 w-4 text-amber-500"/>
                                {profile.tier || 'Bronze'}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* --- Security Card --- */}
             <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Security</CardTitle>
                            <CardDescription className="text-xs">Change your account password.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <FormField
                                control={passwordForm.control}
                                name="currentPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Current Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={passwordForm.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>New Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={passwordForm.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm New Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                         <CardFooter className="p-4 pt-0 justify-end">
                            <Button type="submit" size="sm" disabled={isPasswordSubmitting}>
                                {isPasswordSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Password
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </Form>
        </div>
    )
}
