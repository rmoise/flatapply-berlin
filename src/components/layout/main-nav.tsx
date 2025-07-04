'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Search,
  Bell,
  Heart,
  FileText,
  Settings,
  User,
  LogOut,
  Home,
  ChevronDown,
  Filter,
  MessageCircle,
  BookOpen,
  Mail
} from 'lucide-react'
import { type User as SupabaseUser } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'

interface MainNavProps {
  user?: SupabaseUser | null
}

export function MainNav({ user }: MainNavProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Error signing out')
      return
    }
    
    // Force navigation to clean home URL without parameters
    // Using window.location for a hard refresh to ensure parameters are cleared
    window.location.href = '/'
  }
  
  const getInitials = (email: string) => {
    return email
      .split('@')[0]
      .split('.')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container px-4 sm:px-6 lg:px-8 flex h-16 items-center">
        {/* Left side - Logo and main nav */}
        <div className="flex flex-1 items-center gap-4 lg:gap-6">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="font-bold text-lg sm:text-xl">FlatApply</span>
          </Link>
          
          
          {/* Search Bar (Desktop) */}
          <div className="hidden lg:flex flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search in Berlin - district, station, or keyword..."
                className="pl-9 w-full"
              />
            </div>
          </div>
        </div>
        
        {/* Right side - User menu */}
        <div className="flex items-center gap-2">
          {/* Mobile Search */}
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Search className="h-5 w-5" />
          </Button>
          
          {user ? (
            <>
              {/* Free Trial Button */}
              <Button size="sm" className="mr-2 hidden sm:flex">
                Start 7 Day Free Trial
              </Button>
              
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                      3
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    <Link href="/notifications" className="text-xs text-muted-foreground hover:text-foreground">
                      View all
                    </Link>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Notification items */}
                  <div className="max-h-[400px] overflow-y-auto">
                    <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                      <div className="flex items-start gap-3 w-full">
                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">New match found!</p>
                          <p className="text-xs text-muted-foreground">
                            Beautiful 2-room apartment in Prenzlauer Berg matches your preferences
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                      <div className="flex items-start gap-3 w-full">
                        <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Application viewed</p>
                          <p className="text-xs text-muted-foreground">
                            Your application for Friedrichshain apartment was viewed by the landlord
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">5 hours ago</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                      <div className="flex items-start gap-3 w-full">
                        <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Price drop alert</p>
                          <p className="text-xs text-muted-foreground">
                            Apartment in Kreuzberg reduced rent from €1,200 to €1,050
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">1 day ago</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  </div>
                  
                  <DropdownMenuSeparator />
                  <Link href="/notifications">
                    <DropdownMenuItem className="cursor-pointer">
                      <Bell className="mr-2 h-4 w-4" />
                      View all notifications
                    </DropdownMenuItem>
                  </Link>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Mailbox */}
              <Link href="/mailbox">
                <Button variant="ghost" size="icon">
                  <Mail className="h-5 w-5" />
                </Button>
              </Link>
              
              {/* Saved */}
              <Link href="/saved">
                <Button variant="ghost" size="icon">
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs">
                        {getInitials(user.email || '')}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">My Account</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/dashboard/applications">
                    <DropdownMenuItem>
                      <FileText className="mr-2 h-4 w-4" />
                      Applications
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/dashboard/documents">
                    <DropdownMenuItem>
                      <FileText className="mr-2 h-4 w-4" />
                      Documents
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <Link href="/dashboard/profile">
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/notifications">
                    <DropdownMenuItem>
                      <Bell className="mr-2 h-4 w-4" />
                      Notifications
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/dashboard/billing">
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      Billing & Settings
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <Link href="/how-it-works">
                    <DropdownMenuItem>
                      <BookOpen className="mr-2 h-4 w-4" />
                      How it Works
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/help">
                    <DropdownMenuItem>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Help & Support
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/how-it-works">How it Works</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {!user && (
        <div className="md:hidden border-t">
          <nav className="container px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto py-2">
            <Link href="/how-it-works">
              <Button variant="ghost" size="sm" className={cn(
                "whitespace-nowrap",
                pathname === '/how-it-works' && "bg-muted"
              )}>
                How it Works
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}