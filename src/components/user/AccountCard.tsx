
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

interface AccountCardProps {
    account: TradingAccount;
}

export function AccountCard({ account }: AccountCardProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Approved': return 'default';
      case 'Pending': return 'secondary';
      case 'Rejected': return 'destructive';
      default: return 'outline';
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle>Acc: {account.accountNumber}</CardTitle>
            <Badge variant={getStatusVariant(account.status)}>{account.status}</Badge>
        </div>
        <CardDescription>{account.broker}</CardDescription>
      </CardHeader>
    </Card>
  )
}

    