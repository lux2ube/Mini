
import { AuthProvider } from "@/hooks/useAuthContext";
import { AdminGuard } from "@/components/shared/AdminGuard";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AuthProvider>
            <AdminGuard>
                {children}
            </AdminGuard>
        </AuthProvider>
    )
}
