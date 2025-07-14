
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { brokers } from "@/lib/data";
import type { Broker } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import Image from "next/image";

export default function ManageBrokersPage() {
    // This is a placeholder management page. In a real app, this data would come from Firestore
    // and the actions would perform CRUD operations on the 'brokers' collection.
    
    return (
        <div className="container mx-auto space-y-6">
            <PageHeader title="Manage Brokers" description="Add, edit, or remove partner brokers." />

            <div className="flex justify-end">
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Broker
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Current Brokers</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Logo</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Min. Deposit</TableHead>
                                    <TableHead>Leverage</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {brokers.map(broker => (
                                    <TableRow key={broker.id}>
                                        <TableCell>
                                            <Image 
                                                src={broker.logoUrl} 
                                                alt={`${broker.name} logo`} 
                                                width={32} 
                                                height={32}
                                                className="rounded-md border p-0.5"
                                                data-ai-hint="logo"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{broker.name}</TableCell>
                                        <TableCell>{broker.details.minDeposit}</TableCell>
                                        <TableCell>{broker.details.leverage}</TableCell>
                                        <TableCell className="space-x-2">
                                            <Button size="icon" variant="outline" className="h-8 w-8">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="destructive" className="h-8 w-8">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
