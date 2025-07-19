
"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { TradingAccount } from "@/types"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import { XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccountCardProps {
    account: TradingAccount;
    isSelected?: boolean;
}

export function AccountCard({ account, isSelected }: AccountCardProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Approved': return 'default';
      case 'Pending': return 'secondary';
      case 'Rejected': return 'destructive';
      default: return 'outline';
    }
  }

  return (
    <Card className={cn("w-40 h-28", isSelected && "border-primary ring-2 ring-primary")}>
      <CardHeader className="p-2 pb-0">
        <div className="flex justify-between items-start">
            <CardTitle className="text-sm truncate">Acc: {account.accountNumber}</CardTitle>
            <Badge variant={getStatusVariant(account.status)} className="text-xs">{account.status}</Badge>
        </div>
        <CardDescription className="text-xs truncate">{account.broker}</CardDescription>
      </CardHeader>
       <CardContent className="p-2">
        {account.status === 'Rejected' && account.rejectionReason && (
          <Alert variant="destructive" className="p-1 text-xs mt-1">
              <XCircle className="h-3 w-3" />
              <AlertTitle className="text-xs font-bold">Rejected</AlertTitle>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
