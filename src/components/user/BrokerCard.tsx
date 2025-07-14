"use client"

import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react";
import type { Broker } from "@/lib/data";


interface BrokerCardProps {
    broker: Broker;
}

export function BrokerCard({ broker }: BrokerCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start gap-4 space-y-0">
        <Image 
            src={broker.logoUrl} 
            alt={`${broker.name} logo`} 
            width={64} 
            height={64}
            className="w-16 h-16 object-contain rounded-md border p-1"
            data-ai-hint="logo"
        />
        <div>
            <CardTitle>{broker.name}</CardTitle>
            <CardDescription className="line-clamp-3 mt-1">{broker.description}</CardDescription>
        </div>
      </CardHeader>
      <CardFooter className="mt-auto">
        <Button asChild className="w-full">
            <Link href={`/dashboard/brokers/${broker.id}`}>
                View Details & Link <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
