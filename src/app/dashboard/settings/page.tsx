
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthContext } from "@/hooks/useAuthContext";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronRight, Copy } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";


function ProfileCard() {
    const { user } = useAuthContext();
    const { toast } = useToast();
    
    if (!user || !user.profile) {
      return (
          <Card>
              <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                      <div className="h-16 w-16 bg-muted rounded-full animate-pulse"></div>
                      <div className="flex-grow space-y-2">
                           <div className="h-5 w-3/4 bg-muted rounded animate-pulse"></div>
                           <div className="h-3 w-1/2 bg-muted rounded animate-pulse"></div>
                      </div>
                  </div>
              </CardContent>
          </Card>
      );
    }

    const { profile } = user;
    
    const handleCopy = () => {
        if (profile.clientId) {
            navigator.clipboard.writeText(String(profile.clientId));
            toast({ title: 'Copied!', description: 'Client ID copied to clipboard.' });
        }
    }

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-xl bg-primary/20 text-primary font-bold">
                            {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-grow space-y-1">
                        <h2 className="font-bold text-lg">{profile.name}</h2>
                        {profile.clientId ? (
                            <div className="flex items-center gap-2">
                               <p className="text-xs text-muted-foreground">Client ID: {profile.clientId}</p>
                               <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
                                   <Copy className="h-3 w-3" />
                               </Button>
                            </div>
                        ) : (
                             <p className="text-xs text-muted-foreground">Client ID: Not Assigned</p>
                        )}
                        {profile.tier && <Badge variant="secondary">{profile.tier}</Badge>}
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/profile">
                            <ChevronRight className="h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default function SettingsPage() {
  const { user, isLoading } = useAuthContext();
  
  if (isLoading || !user?.profile) {
    return (
        <div className="flex items-center justify-center h-full min-h-[calc(100vh-theme(spacing.14))]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="max-w-md mx-auto w-full px-4 py-4 space-y-4">
        <PageHeader title="Settings" description="Manage your account details and settings." />
        
        <ProfileCard />
        
         <Card>
            <CardHeader className="p-4">
                <CardTitle className="text-base">Change Password</CardTitle>
                <CardDescription className="text-xs">
                   For security, you can update your password here.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" />
                </div>
                <Button className="w-full" size="sm">Update Password</Button>
            </CardContent>
        </Card>
    </div>
  );
}
