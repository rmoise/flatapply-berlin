"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { 
  Check,
  X,
  Zap,
  CreditCard,
  Download,
  AlertCircle,
  TrendingUp,
  Calendar,
  Bell,
  Mail,
  MessageSquare,
  Phone,
  Sparkles,
  Shield,
  ArrowRight,
  Info
} from "lucide-react"

const PLANS = [
  {
    name: "Free",
    price: 0,
    period: "forever",
    description: "Get started with basic features",
    features: [
      { name: "5 alerts per day", included: true },
      { name: "Email notifications", included: true },
      { name: "Basic search filters", included: true },
      { name: "Manual applications only", included: true },
      { name: "WhatsApp notifications", included: false },
      { name: "SMS notifications", included: false },
      { name: "AI message generation", included: false },
      { name: "Auto-apply", included: false },
      { name: "Priority support", included: false }
    ],
    buttonText: "Current Plan",
    disabled: true
  },
  {
    name: "Basic",
    price: 9.99,
    period: "month",
    description: "Perfect for active apartment hunters",
    features: [
      { name: "50 alerts per day", included: true },
      { name: "Email notifications", included: true },
      { name: "Advanced search filters", included: true },
      { name: "AI message generation", included: true, limit: "10/month" },
      { name: "WhatsApp notifications", included: false },
      { name: "SMS notifications", included: false },
      { name: "Auto-apply", included: false },
      { name: "Priority support", included: false },
      { name: "Saved searches", included: true, limit: "5" }
    ],
    buttonText: "Upgrade to Basic",
    recommended: true
  },
  {
    name: "Pro",
    price: 19.99,
    period: "month",
    description: "Maximum advantage in your search",
    features: [
      { name: "Unlimited alerts", included: true },
      { name: "All notification channels", included: true },
      { name: "Advanced search filters", included: true },
      { name: "Unlimited AI messages", included: true },
      { name: "WhatsApp notifications", included: true },
      { name: "SMS notifications", included: true },
      { name: "Auto-apply", included: true },
      { name: "Priority support", included: true },
      { name: "Unlimited saved searches", included: true }
    ],
    buttonText: "Upgrade to Pro"
  }
]

export default function BillingPage() {
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false)
  
  // TODO: Get from Supabase/Stripe
  const currentPlan = {
    name: "Free",
    status: "active",
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false
  }

  const usage = {
    alerts: { used: 4, limit: 5 },
    aiMessages: { used: 0, limit: 0 },
    savedSearches: { used: 2, limit: 3 },
    autoApplies: { used: 0, limit: 0 }
  }

  const billingHistory = [
    { date: "2024-01-01", amount: 9.99, status: "paid", invoice: "#INV-001" },
    { date: "2023-12-01", amount: 9.99, status: "paid", invoice: "#INV-002" }
  ]

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Subscription & Billing</h1>
        <p className="text-muted-foreground mt-1">
          Manage your plan and track your usage
        </p>
      </div>

      {/* Current Plan Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                You are currently on the {currentPlan.name} plan
              </CardDescription>
            </div>
            <Badge variant={currentPlan.status === "active" ? "default" : "secondary"}>
              {currentPlan.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Usage Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Daily Alerts</span>
                <span className="text-muted-foreground">
                  {usage.alerts.used}/{usage.alerts.limit}
                </span>
              </div>
              <Progress value={(usage.alerts.used / usage.alerts.limit) * 100} />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>AI Messages</span>
                <span className="text-muted-foreground">
                  {usage.aiMessages.limit === 0 ? "Not available" : `${usage.aiMessages.used}/${usage.aiMessages.limit}`}
                </span>
              </div>
              <Progress value={0} className="opacity-50" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Saved Searches</span>
                <span className="text-muted-foreground">
                  {usage.savedSearches.used}/{usage.savedSearches.limit}
                </span>
              </div>
              <Progress value={(usage.savedSearches.used / usage.savedSearches.limit) * 100} />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Auto-applies</span>
                <span className="text-muted-foreground">
                  {usage.autoApplies.limit === 0 ? "Not available" : `${usage.autoApplies.used}/${usage.autoApplies.limit}`}
                </span>
              </div>
              <Progress value={0} className="opacity-50" />
            </div>
          </div>

          {currentPlan.name === "Free" && (
            <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-blue-900 dark:text-blue-100">
                You're using 80% of your daily alerts. Upgrade to get more alerts and features!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Plans */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Compare Plans</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <Card 
              key={plan.name} 
              className={plan.recommended ? "border-primary relative" : ""}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary">Recommended</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  {plan.price === 0 ? (
                    <div className="text-3xl font-bold">Free</div>
                  ) : (
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold">€{plan.price}</span>
                      <span className="text-muted-foreground ml-1">/{plan.period}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={!feature.included ? "text-muted-foreground/50" : ""}>
                        {feature.name}
                        {feature.limit && (
                          <span className="text-muted-foreground"> ({feature.limit})</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={plan.recommended ? "default" : "outline"}
                  disabled={plan.disabled}
                >
                  {plan.buttonText}
                  {!plan.disabled && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>
            Manage your payment information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentPlan.name === "Free" ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No payment method required for the Free plan
              </p>
              <Button className="mt-4">
                <CreditCard className="mr-2 h-4 w-4" />
                Add Payment Method
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">•••• •••• •••• 4242</p>
                    <p className="text-sm text-muted-foreground">Expires 12/24</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Update
                </Button>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="cancel-subscription">Cancel at period end</Label>
                  <p className="text-sm text-muted-foreground">
                    Your subscription will remain active until {currentPlan.currentPeriodEnd}
                  </p>
                </div>
                <Switch 
                  id="cancel-subscription"
                  checked={cancelAtPeriodEnd}
                  onCheckedChange={setCancelAtPeriodEnd}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      {currentPlan.name !== "Free" && (
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>
              Download invoices for your records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {billingHistory.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">€{item.amount}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(item.date).toLocaleDateString()} • {item.invoice}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {item.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="font-medium">Can I change plans anytime?</p>
            <p className="text-sm text-muted-foreground">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="font-medium">What happens if I exceed my limits?</p>
            <p className="text-sm text-muted-foreground">
              You'll receive a notification when you're close to your limits. Once exceeded, features will be paused until the next period or you upgrade.
            </p>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="font-medium">Do unused alerts roll over?</p>
            <p className="text-sm text-muted-foreground">
              No, alert limits reset daily at midnight. We recommend setting your preferences to make the most of your daily alerts.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
        <Shield className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm">
          Need help? Contact our support team at{" "}
          <a href="mailto:support@flatapply.berlin" className="underline">
            support@flatapply.berlin
          </a>
        </p>
      </div>
    </div>
  )
}