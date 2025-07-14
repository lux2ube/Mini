import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const transactions = [
  { id: "1", date: "2024-05-01", merchant: "Amazon", amount: 75.50, cashback: 7.55, status: "Approved" },
  { id: "2", date: "2024-05-03", merchant: "Starbucks", amount: 12.30, cashback: 1.23, status: "Approved" },
  { id: "3", date: "2024-05-04", merchant: "Walmart", amount: 120.00, cashback: 0, status: "Rejected" },
  { id: "4", date: "2024-05-05", merchant: "Target", amount: 45.25, cashback: 4.53, status: "Pending" },
];

export default function DashboardPage() {
  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">User Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Cashback</CardTitle>
            <CardDescription>Lifetime cashback earned.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">$13.31</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Cashback</CardTitle>
            <CardDescription>Cashback waiting for approval.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">$4.53</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Approved Transactions</CardTitle>
            <CardDescription>Total transactions with approved cashback.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">2</div>
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Cashback History</CardTitle>
            <CardDescription>A record of your cashback transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Cashback</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.date}</TableCell>
                    <TableCell>{tx.merchant}</TableCell>
                    <TableCell>${tx.amount.toFixed(2)}</TableCell>
                    <TableCell>${tx.cashback.toFixed(2)}</TableCell>
                    <TableCell>{tx.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

    