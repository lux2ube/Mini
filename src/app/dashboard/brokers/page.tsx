import { PageHeader } from "@/components/shared/PageHeader";
import { BrokerCard } from "@/components/user/BrokerCard";
import { brokers } from "@/lib/data";

export default function BrokersPage() {
  return (
    <>
      <PageHeader
        title="Our Partner Brokers"
        description="Choose a broker to link your account and start earning cashback."
      />
      <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {brokers.map((broker) => (
          <BrokerCard key={broker.id} broker={broker} />
        ))}
      </div>
    </>
  );
}
