import { redirect } from "next/navigation"
import { DashboardNav } from "@/components/layout/dashboard-nav"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { getUser } from "@/lib/auth/utils"
import { getSidebarPreference } from "@/features/dashboard/actions"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  const isCollapsed = await getSidebarPreference()

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <DashboardNav initialCollapsed={isCollapsed} />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <DashboardHeader user={user} />
        <main className="flex-1 overflow-y-auto bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  )
}