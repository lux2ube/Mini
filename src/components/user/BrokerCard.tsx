
"use client"

import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Broker } from "@/types";
import { Star, Info, Check, X, HandCoins } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function StarRating({ rating }: { rating: number }) {
    // Round rating to nearest 0.5
    const roundedRating = Math.round(rating * 2) / 2;
    return (
        <div className="flex items-center">
            {[...Array(5)].map((_, index) => {
                 const starValue = index + 1;
                 let fillClass = 'text-gray-300';
                 if (roundedRating >= starValue) {
                     fillClass = 'text-yellow-400 fill-yellow-400';
                 }
                return (
                     <Star key={index} className={`h-4 w-4 ${fillClass}`} />
                );
            })}
        </div>
    )
}

export function BrokerCard({ broker }: { broker: Broker }) {
  // --- Backward Compatibility ---
  // Check if we're dealing with the new, detailed structure or the old one.
  const isNewStructure = !!broker.basicInfo;

  const name = isNewStructure ? broker.basicInfo.broker_name : broker.name;
  const rating = isNewStructure ? (broker.reputation?.wikifx_score ?? 0) / 2 : broker.rating;
  const description = isNewStructure ? `Founded in ${broker.basicInfo.founded_year}` : broker.description;
  const cashbackPerLot = isNewStructure ? broker.cashback?.cashback_per_lot ?? 0 : broker.cashbackRate.amount;
  const cashbackFrequency = isNewStructure ? broker.cashback?.cashback_frequency : "Daily";
  const swapFree = isNewStructure ? broker.tradingConditions?.swap_free : broker.features.find(f => f.text.toLowerCase().includes("islamic"))?.available ?? false;
  const copyTrading = isNewStructure ? broker.additionalFeatures?.copy_trading : broker.features.find(f => f.text.toLowerCase().includes("copy"))?.available ?? false;
  const affiliateLink = isNewStructure ? broker.cashback?.affiliate_program_link : `/dashboard/brokers/${broker.id}?action=new`;

  return (
    <Card className="w-full overflow-hidden">
        <CardContent className="p-3 space-y-3">
            <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                    <Image
                        src={broker.logoUrl}
                        alt={`${name} logo`}
                        width={48}
                        height={48}
                        className="w-12 h-12 object-contain rounded-md border p-1 flex-shrink-0 bg-white"
                        data-ai-hint="logo"
                    />
                    <div className="space-y-1">
                        <h3 className="text-base font-bold">{name}</h3>
                        <StarRating rating={rating} />
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
                            <p className="max-w-xs">{description}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="space-y-1 text-center border-r pr-2">
                    <p className="text-xs text-muted-foreground">Cashback per Lot</p>
                    <p className="font-bold text-lg text-primary">${cashbackPerLot.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{cashbackFrequency}</p>
                </div>
                <div className="space-y-1 pl-2">
                    <div className="flex items-center gap-1.5 text-xs">
                         <HandCoins className="h-4 w-4 text-primary flex-shrink-0" />
                         <span className="flex-1">Rebates Available</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                        {swapFree ? <Check className="h-4 w-4 text-green-500 flex-shrink-0" /> : <X className="h-4 w-4 text-red-500 flex-shrink-0" />}
                        <span className="flex-1">Islamic Account</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                       {copyTrading ? <Check className="h-4 w-4 text-green-500 flex-shrink-0" /> : <X className="h-4 w-4 text-red-500 flex-shrink-0" />}
                        <span className="flex-1">Copy Trading</span>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Button asChild className="w-full" size="sm">
                    <Link href={affiliateLink} target="_blank" rel="noopener noreferrer">
                        Open new {name} account.
                    </Link>
                </Button>
                <Button asChild className="w-full" variant="secondary" size="sm">
                    <Link href={`/dashboard/brokers/${broker.id}?action=existing`}>
                        I already have {name} account.
                    </Link>
                </Button>
            </div>
        </CardContent>
    </Card>
  )
}
