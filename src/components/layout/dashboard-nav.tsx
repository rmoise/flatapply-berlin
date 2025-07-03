"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils/cn"
import { Button } from "@/components/ui/button"
import { updateSidebarPreference } from "@/features/dashboard/actions"
import {
  Home,
  Search,
  FileText,
  User,
  FolderOpen,
  CreditCard,
  Settings,
  Menu,
  X,
  LogOut,
  Heart,
  Send,
  Bell,
  ChevronLeft
} from "lucide-react"

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home
  },
  {
    title: "Listings",
    href: "/dashboard/listings",
    icon: Search
  },
  {
    title: "Applications",
    href: "/dashboard/applications",
    icon: Send
  },
  {
    title: "Documents",
    href: "/dashboard/documents",
    icon: FolderOpen
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: User
  },
  {
    title: "Preferences",
    href: "/dashboard/preferences",
    icon: Settings
  },
  {
    title: "Billing",
    href: "/dashboard/billing",
    icon: CreditCard
  }
]

interface DashboardNavProps {
  initialCollapsed?: boolean
}

export function DashboardNav({ initialCollapsed = false }: DashboardNavProps) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed)
  const [isHovered, setIsHovered] = useState(false)
  const [hoverDisabled, setHoverDisabled] = useState(false)
  const [, startTransition] = useTransition()

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 transform bg-background border-r lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 overflow-hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed && !isHovered ? "w-16" : "w-64",
          "transition-all duration-200 ease-in-out"
        )}
        onMouseEnter={() => !hoverDisabled && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b px-3">
            <Link href="/dashboard" className={cn(
              "flex items-center gap-2 font-semibold transition-all",
              isCollapsed && !isHovered ? "justify-center" : ""
            )}>
              <Home className="h-6 w-6 flex-shrink-0" />
              {(!isCollapsed || isHovered) && <span className="text-xl">FlatApply</span>}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "hidden lg:flex h-8 w-8",
                isCollapsed && "rotate-180"
              )}
              onClick={(e) => {
                e.stopPropagation()
                const newCollapsed = !isCollapsed
                setIsCollapsed(newCollapsed)
                
                // Update server-side preference
                startTransition(async () => {
                  await updateSidebarPreference(newCollapsed)
                })
                
                // Temporarily disable hover to prevent immediate re-expansion
                setHoverDisabled(true)
                setIsHovered(false)
                setTimeout(() => setHoverDisabled(false), 300)
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation - scrollable if needed */}
          <nav className="flex-1 overflow-y-auto space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/dashboard" && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    isCollapsed && !isHovered && "justify-center"
                  )}
                  onClick={() => setIsMobileOpen(false)}
                  title={isCollapsed && !isHovered ? item.title : undefined}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {(!isCollapsed || isHovered) && <span className="whitespace-nowrap">{item.title}</span>}
                </Link>
              )
            })}
          </nav>

          {/* Saved & Notifications - always visible */}
          <div className="border-t px-3 py-4 space-y-1">
            <Link
              href="/dashboard/saved"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === "/dashboard/saved"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                isCollapsed && !isHovered && "justify-center"
              )}
              onClick={() => setIsMobileOpen(false)}
              title={isCollapsed && !isHovered ? "Saved Listings" : undefined}
            >
              <Heart className="h-4 w-4 flex-shrink-0" />
              {(!isCollapsed || isHovered) && <span className="whitespace-nowrap">Saved Listings</span>}
            </Link>
            <Link
              href="/dashboard/notifications"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === "/dashboard/notifications"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                isCollapsed && !isHovered && "justify-center"
              )}
              onClick={() => setIsMobileOpen(false)}
              title={isCollapsed && !isHovered ? "Notifications" : undefined}
            >
              <Bell className="h-4 w-4 flex-shrink-0" />
              {(!isCollapsed || isHovered) && <span className="whitespace-nowrap">Notifications</span>}
            </Link>
          </div>

          {/* Logout - always visible */}
          <div className="border-t p-3">
            <form action="/api/auth/logout" method="POST">
              <Button
                type="submit"
                variant="ghost"
                className={cn(
                  "w-full text-muted-foreground",
                  isCollapsed && !isHovered ? "justify-center px-0" : "justify-start"
                )}
                title={isCollapsed && !isHovered ? "Logout" : undefined}
              >
                <LogOut className={cn("h-4 w-4", (!isCollapsed || isHovered) && "mr-3")} />
                {(!isCollapsed || isHovered) && <span className="whitespace-nowrap">Logout</span>}
              </Button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  )
}