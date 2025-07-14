"use client";

import { useState, useTransition } from "react";
import { Loader2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { handleCalculateCashback } from "@/app/actions";
import { Skeleton } from "./ui/skeleton";
import type { CalculateCashbackOutput } from "@/ai/flows/calculate-cashback";

export function CashbackCalculator() {
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState<CalculateCashbackOutput | null>(null);
  const { toast } = useToast();

  const onSubmit = () => {
    const transactionAmount = parseFloat(amount);
    if (isNaN(transactionAmount) || transactionAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid transaction amount.",
      });
      return;
    }

    startTransition(async () => {
      const { result: apiResult, error } = await handleCalculateCashback({ amount: transactionAmount });
      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error,
        });
        setResult(null);
      } else {
        setResult(apiResult);
      }
    });
  };

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
                <CardTitle className="font-headline">Cashback Calculator</CardTitle>
                <CardDescription>
                Enter a transaction amount to calculate the cashback award.
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
           <Input
            type="number"
            placeholder="Enter transaction amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isPending}
            className="max-w-xs"
            />
             <Button onClick={onSubmit} disabled={isPending} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Calculate
                </>
              )}
            </Button>
        </div>
        
        {isPending && (
          <div className="space-y-2 pt-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}
        {result && !isPending && (
          <div className="pt-4 space-y-2">
            <h3 className="text-lg font-bold text-primary">${result.cashbackAmount.toFixed(2)}</h3>
            <p className="text-sm text-muted-foreground">{result.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
