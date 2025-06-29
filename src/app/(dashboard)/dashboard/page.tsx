import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Home, 
  FileText, 
  Bell, 
  Search, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  ArrowRight,
  Plus,
  Heart,
  Send,
  SlidersHorizontal
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  // TODO: Replace with real data from Supabase
  const stats = {
    newMatches: 12,
    applicationsSent: 5,
    responsesReceived: 2,
    savedListings: 8
  }

  const recentMatches = [
    {
      id: "1",
      title: "Beautiful 2-room apartment in Prenzlauer Berg",
      price: 1200,
      size: 65,
      rooms: 2,
      district: "Prenzlauer Berg",
      matchScore: 95,
      platform: "immoscout24",
      availableFrom: "2024-02-01",
      isNew: true
    },
    {
      id: "2",
      title: "Cozy studio in Friedrichshain",
      price: 850,
      size: 35,
      rooms: 1,
      district: "Friedrichshain",
      matchScore: 88,
      platform: "wg_gesucht",
      availableFrom: "2024-01-15",
      isNew: true
    },
    {
      id: "3",
      title: "Modern 3-room flat with balcony",
      price: 1650,
      size: 85,
      rooms: 3,
      district: "Charlottenburg",
      matchScore: 82,
      platform: "kleinanzeigen",
      availableFrom: "2024-02-15",
      isNew: false
    }
  ]

  const subscription = {
    plan: "pro",
    alertsUsed: 45,
    alertsLimit: -1, // unlimited
    autoAppliesUsed: 8,
    autoAppliesLimit: -1,
    daysRemaining: 22
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your apartment search
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/preferences">
            <Plus className="mr-2 h-4 w-4" />
            New Search
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Matches</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newMatches}</div>
            <p className="text-xs text-muted-foreground">
              +3 since yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications Sent</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.applicationsSent}</div>
            <p className="text-xs text-muted-foreground">
              2 pending response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Responses</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.responsesReceived}</div>
            <p className="text-xs text-muted-foreground">
              From landlords
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saved Listings</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.savedListings}</div>
            <p className="text-xs text-muted-foreground">
              In your favorites
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Matches - 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Matches</CardTitle>
                  <CardDescription>
                    Latest apartments matching your preferences
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/listings">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentMatches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link 
                        href={`/dashboard/listings/${match.id}`}
                        className="font-medium hover:underline"
                      >
                        {match.title}
                      </Link>
                      {match.isNew && (
                        <Badge variant="secondary" className="text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>€{match.price}/month</span>
                      <span>{match.size}m²</span>
                      <span>{match.rooms} room{match.rooms > 1 ? 's' : ''}</span>
                      <span>{match.district}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {match.platform}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Available from {new Date(match.availableFrom).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{match.matchScore}%</span>
                      </div>
                      <span className="text-xs text-muted-foreground">match</span>
                    </div>
                    <Button size="sm" asChild>
                      <Link href={`/dashboard/listings/${match.id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks for your apartment search
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/dashboard/listings">
                  <Home className="mr-2 h-4 w-4" />
                  Browse All Listings
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/dashboard/preferences">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Update Preferences
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/dashboard/documents">
                  <FileText className="mr-2 h-4 w-4" />
                  Upload Documents
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/dashboard/applications">
                  <Send className="mr-2 h-4 w-4" />
                  Track Applications
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-4">
          {/* Subscription Status */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Status</CardTitle>
              <CardDescription>
                Current plan: <Badge className="ml-1">{subscription.plan.toUpperCase()}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Alerts</span>
                  <span className="text-muted-foreground">
                    {subscription.alertsLimit === -1 ? 'Unlimited' : `${subscription.alertsUsed}/${subscription.alertsLimit}`}
                  </span>
                </div>
                {subscription.alertsLimit !== -1 && (
                  <Progress value={(subscription.alertsUsed / subscription.alertsLimit) * 100} />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Auto-applies</span>
                  <span className="text-muted-foreground">
                    {subscription.autoAppliesLimit === -1 ? 'Unlimited' : `${subscription.autoAppliesUsed}/${subscription.autoAppliesLimit}`}
                  </span>
                </div>
                {subscription.autoAppliesLimit !== -1 && (
                  <Progress value={(subscription.autoAppliesUsed / subscription.autoAppliesLimit) * 100} />
                )}
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Renews in {subscription.daysRemaining} days</span>
                  <Zap className="h-4 w-4 text-yellow-500" />
                </div>
              </div>

              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/billing">
                  Manage Subscription
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Recent alerts and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Bell className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <p className="text-sm">New match in Kreuzberg</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <p className="text-sm">Application sent successfully</p>
                    <p className="text-xs text-muted-foreground">5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <p className="text-sm">Document expiring soon</p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}