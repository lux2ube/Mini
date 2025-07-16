
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
import type { Broker } from "@/types";

interface BrokerCardProps {
  broker: Broker;
}

export function BrokerCard({ broker }: BrokerCardProps) {
  return (
    <Card>
        <CardHeader className="p-4">
            <div className="flex items-start gap-4">
                <Image 
                    src={broker.logoUrl} 
                    alt={`${broker.name} logo`} 
                    width={40} 
                    height={40}
                    className="w-10 h-10 object-contain rounded-md border p-1"
                    data-ai-hint="logo"
                />
                <div>
                    <CardTitle className="text-base">{broker.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1 text-xs">{broker.description}</CardDescription>
                </div>
            </div>
        </CardHeader>
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full" size="sm">
            <Link href={`/dashboard/brokers/${broker.id}`}>
                Link Account
            </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
