
"use client";

import { useAuthContext } from "@/hooks/useAuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return; // Wait until auth state is loaded
    }

    if (!user) {
      router.push("/login"); // Not logged in, redirect to login
      return;
    }

    // Check the admin claim from the ID token.
    if (!user.isAdmin) {
      router.push("/dashboard"); // Logged in but not an admin
    }

  }, [isLoading, user, router]);

  // While loading or if user is not an admin yet, show a spinner
  if (isLoading || !user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If verification is complete and user is an admin, render children
  return <>{children}</>;
}
