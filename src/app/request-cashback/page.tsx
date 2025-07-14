import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function RequestCashbackPage() {
  return (
    <>
        <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Request Cashback</h1>
        </div>

        <div className="max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>Submit a Cashback Claim</CardTitle>
                    <CardDescription>
                        Fill out the form below to submit a new cashback request. Please allow 3-5 business days for processing.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="merchant">Merchant Name</Label>
                            <Input id="merchant" placeholder="e.g., Amazon, Starbucks" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Transaction Amount</Label>
                            <Input id="amount" type="number" placeholder="e.g., 49.99" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date">Transaction Date</Label>
                            <Input id="date" type="date" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Textarea id="notes" placeholder="e.g., Purchased a new keyboard" />
                        </div>
                        <Button className="w-full md:w-auto">Submit Request</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    </>
  );
}

    