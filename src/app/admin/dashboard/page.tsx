
import { PageHeader } from "@/components/shared/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Admin Dashboard"
        description="Welcome to the admin area."
      />
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is a protected admin page. More admin features can be added here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
