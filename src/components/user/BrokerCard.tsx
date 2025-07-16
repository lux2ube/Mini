
"use client"

import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Broker } from "@/types";
import { Star, Info, Check, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center">
            {[...Array(5)].map((_, index) => (
                <Star
                    key={index}
                    className={`h-5 w-5 ${index < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                />
            ))}
        </div>
    )
}

export function BrokerCard({ broker }: { broker: Broker }) {
  return (
    <Card className="w-full overflow-hidden">
        <CardContent className="p-3 space-y-3">
            <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                    <Image
                        src={broker.logoUrl}
                        alt={`${broker.name} logo`}
                        width={48}
                        height={48}
                        className="w-12 h-12 object-contain rounded-md border p-1 flex-shrink-0 bg-white"
                        data-ai-hint="logo"
                    />
                    <div className="space-y-1">
                        <h3 className="text-base font-bold">{broker.name}</h3>
                        <StarRating rating={broker.rating} />
                    </div>
                </div>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                                <Info className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="max-w-xs">{broker.description}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            
            <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                <li>{broker.details.cashbackType}</li>
                <li>Min Initial Deposit: {broker.details.minDeposit}</li>
            </ul>

            <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="space-y-1 text-center border-r pr-2">
                    <p className="text-xs text-muted-foreground">{broker.cashbackRate.tradeType}</p>
                    <p className="font-bold text-lg text-primary">${broker.cashbackRate.amount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Get Cashback...</p>
                </div>
                <div className="space-y-1 pl-2">
                    {broker.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-1.5 text-xs">
                            {feature.available ? (
                                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                            ) : (
                                <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                            )}
                            <span className="flex-1">{feature.text}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <Button asChild className="w-full" size="sm">
                    <Link href={`/dashboard/brokers/${broker.id}?action=new`}>
                        Open new {broker.name} account.
                    </Link>
                </Button>
                <Button asChild className="w-full" variant="secondary" size="sm">
                    <Link href={`/dashboard/brokers/${broker.id}?action=existing`}>
                        I already have {broker.name} account.
                    </Link>
                </Button>
            </div>
        </CardContent>
    </Card>
  )
}
