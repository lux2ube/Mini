
"use client";

import { useAuthContext } from "@/hooks/useAuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    // Don't do anything until the authentication state is fully loaded
    if (isLoading) {
      return;
    }

    // If not logged in, redirect to the login page
    if (!user) {
      router.push("/login");
      return;
    }

    // If the user is logged in but is not an admin, redirect to the user dashboard
    if (!user.isAdmin) {
      router.push("/dashboard");
    }
  }, [isLoading, user, router]);

  // While loading, or if the user is not a verified admin yet, show a loading spinner.
  // This prevents rendering the admin content for non-admin users before the redirect kicks in.
  if (isLoading || !user?.isAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If loading is complete and the user is an admin, render the protected admin content.
  return <>{children}</>;
}
