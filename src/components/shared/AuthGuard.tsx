
"use client";

import { useAuthContext } from "@/hooks/useAuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    // Wait until the loading is complete before checking for a user
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [isLoading, user, router]);

  // If we are still loading, or if there's no user yet, show the loader.
  // This prevents rendering the page content prematurely.
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If loading is complete and we have a user, render the protected content.
  return <>{children}</>;
}
