
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";

const teamMembers = [
  { name: "Alice Johnson", role: "CEO & Founder", avatar: "https://placehold.co/100x100.png", hint: "woman portrait" },
  { name: "Bob Williams", role: "CTO", avatar: "https://placehold.co/100x100.png", hint: "man portrait" },
  { name: "Charlie Brown", role: "Lead Developer", avatar: "https://placehold.co/100x100.png", hint: "person portrait" },
];

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">
      <PageHeader
        title="About Cashback Companion"
        description="We're dedicated to helping traders maximize their earnings with zero extra effort."
      />
      
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
            <h2 className="text-2xl font-bold font-headline text-primary">Our Mission</h2>
            <p className="text-muted-foreground">
                Our mission is simple: to put money back in the pockets of forex traders. We believe that every trader deserves to get more from their broker. By leveraging our partnerships, we provide a seamless way to earn cashback on trades you're already making, enhancing your profitability without changing your strategy.
            </p>
            <p className="text-muted-foreground">
                We are committed to transparency, reliability, and excellent customer support. Our platform is built on cutting-edge technology to ensure your cashback is tracked accurately and paid out promptly.
            </p>
        </div>
        <div>
            <Image 
                src="https://placehold.co/600x400.png" 
                alt="Office team working" 
                width={600} 
                height={400}
                className="rounded-lg shadow-md"
                data-ai-hint="office team"
            />
        </div>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl">Meet the Team</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-8">
          {teamMembers.map((member) => (
            <div key={member.name} className="flex flex-col items-center text-center">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={member.avatar} data-ai-hint={member.hint}/>
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <h3 className="font-semibold">{member.name}</h3>
              <p className="text-sm text-primary">{member.role}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
