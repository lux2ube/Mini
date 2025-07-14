"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { TradingAccount } from "@/types"

interface AccountCardProps {
    account: TradingAccount;
}

export function AccountCard({ account }: AccountCardProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'default';
      case 'Pending':
        return 'secondary';
      case 'Rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account: {account.accountNumber}</CardTitle>
        <CardDescription>{account.broker}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge variant={getStatusVariant(account.status)}>{account.status}</Badge>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full">
          View Details
        </Button>
      </CardFooter>
    </Card>
  )
}
