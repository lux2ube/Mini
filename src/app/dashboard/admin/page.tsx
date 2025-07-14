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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const users = [
  { id: "1", name: "Alice Johnson", email: "alice@example.com", totalCashback: 150.75, status: "Active" },
  { id: "2", name: "Bob Smith", email: "bob@example.com", totalCashback: 88.20, status: "Active" },
  { id: "3", name: "Charlie Brown", email: "charlie@example.com", totalCashback: 25.00, status: "Suspended" },
  { id: "4", name: "Diana Prince", email: "diana@example.com", totalCashback: 320.50, status: "Active" },
];

const cashbackRequests = [
    { id: "cr1", userId: "4", amount: 45.25, cashback: 4.53, status: "Pending"},
    { id: "cr2", userId: "1", amount: 12.00, cashback: 1.20, status: "Pending"},
]

export default function AdminPage() {
  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Admin Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
            <CardDescription>Number of registered users.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">4</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
            <CardDescription>Cashback requests needing approval.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">2</div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Cashback Approval Queue</CardTitle>
            <CardDescription>Review and approve/reject pending cashback requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Email</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Cashback</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashbackRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>{users.find(u => u.id === req.userId)?.email}</TableCell>
                    <TableCell>${req.amount.toFixed(2)}</TableCell>
                    <TableCell>${req.cashback.toFixed(2)}</TableCell>
                    <TableCell>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline">Approve</Button>
                            <Button size="sm" variant="destructive">Reject</Button>
                        </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
       <div className="grid gap-4 md:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>View and manage all system users.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Total Cashback</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>${user.totalCashback.toFixed(2)}</TableCell>
                    <TableCell>
                        <Badge variant={user.status === "Active" ? "default" : "destructive"}>{user.status}</Badge>
                    </TableCell>
                     <TableCell>
                        <Button size="sm" variant="outline">Manage</Button>
                    </TableCell>
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
