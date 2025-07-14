
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ManageBannerPage() {
    // This is a placeholder page. In a real app, you would have state management
    // and an action to save the banner details to Firestore or another backend service.
    return (
        <div className="container mx-auto space-y-6">
            <PageHeader 
                title="Manage Banner"
                description="Update the promotional banner displayed to users."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Banner Content</CardTitle>
                    <CardDescription>
                        This content could be displayed on the user dashboard or landing page.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="banner-image">Banner Image URL</Label>
                        <Input id="banner-image" placeholder="https://example.com/image.png" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="banner-title">Title</Label>
                        <Input id="banner-title" placeholder="e.g., Special Promotion!" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="banner-text">Description</Label>
                        <Textarea id="banner-text" placeholder="e.g., Get 20% extra cashback this month." />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="banner-link">CTA Link</Label>
                        <Input id="banner-link" placeholder="e.g., /dashboard/brokers" />
                    </div>
                    <Button>Save Banner</Button>
                </CardContent>
            </Card>
        </div>
    );
}
