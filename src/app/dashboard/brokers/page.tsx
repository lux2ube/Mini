
import { PageHeader } from "@/components/shared/PageHeader";
import { BrokerCard } from "@/components/user/BrokerCard";
import { brokers } from "@/lib/data";

export default function BrokersPage() {
  return (
    <div className="max-w-[400px] mx-auto w-full px-4 py-4 space-y-4">
      <PageHeader
        title="Our Partner Brokers"
        description="Choose a broker to link your account."
      />
      <div className="flex flex-col space-y-4">
        {brokers.map((broker) => (
          <BrokerCard key={broker.id} broker={broker} />
        ))}
      </div>
    </div>
  );
}

    