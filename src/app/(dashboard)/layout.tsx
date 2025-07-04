import { redirect } from "next/navigation"
import { getUser } from "@/lib/auth/utils"
import { MainNav } from "@/components/layout/main-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Navigation */}
      <MainNav user={user} />
      
      {/* Main content */}
      <main className="flex-1 bg-background">
        {children}
      </main>
    </div>
  )
}