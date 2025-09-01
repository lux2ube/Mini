
"use client";

import { useAuthContext } from "@/hooks/useAuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthContext();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (isLoading) {
      return; // Wait until auth state is loaded
    }

    if (!user) {
      router.push("/login"); // Not logged in, redirect to login
      return;
    }

    // Check for custom admin claim
    user.getIdTokenResult()
      .then((idTokenResult) => {
        if (idTokenResult.claims.admin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          router.push("/dashboard"); // Logged in but not an admin
        }
      })
      .catch(() => {
        setIsAdmin(false);
        router.push("/dashboard"); // Error getting token, assume not admin
      });

  }, [isLoading, user, router]);

  // While loading or verifying claims, show a spinner
  if (isLoading || isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If verification is complete and user is an admin, render children
  if (isAdmin) {
    return <>{children}</>;
  }

  // Fallback, though the redirect should have already happened
  return null;
}
