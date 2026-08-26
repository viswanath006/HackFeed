/**
 * app/admin/layout.tsx
 *
 * Admin panel shell — server-side auth guard + sidebar layout.
 * If the user is not an admin, redirects to /admin/login.
 */

import { redirect } from "next/navigation"
import { getUser } from "@/lib/supabase/getUser"
import AdminSidebar from "@/components/admin/AdminSidebar"

export const metadata = {
  title: { template: "%s | HackFeed Admin", default: "Admin | HackFeed" },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, admin, isAdmin } = await getUser()

  if (!user || !isAdmin || !admin) {
    redirect("/admin/login")
  }

  const displayName =
    (user.raw?.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Admin"

  return (
    <div className="flex h-screen bg-[#080810] text-zinc-100 overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar displayName={displayName} role={admin.role} />

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex-1 p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
