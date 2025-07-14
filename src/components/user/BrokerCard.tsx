
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
import type { Broker } from "@/lib/data";

export function BrokerCard({ broker }: BrokerCardProps) {
  return (
    <Card>
        <CardHeader>
            <div className="flex items-start gap-4">
                <Image 
                    src={broker.logoUrl} 
                    alt={`${broker.name} logo`} 
                    width={48} 
                    height={48}
                    className="w-12 h-12 object-contain rounded-md border p-1"
                    data-ai-hint="logo"
                />
                <div>
                    <CardTitle>{broker.name}</CardTitle>
                    <CardDescription className="line-clamp-3 mt-1">{broker.description}</CardDescription>
                </div>
            </div>
        </CardHeader>
      <CardFooter>
        <Button asChild className="w-full">
            <Link href={`/dashboard/brokers/${broker.id}`}>
                Link Account
            </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

    