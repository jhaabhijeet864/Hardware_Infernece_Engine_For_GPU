import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CurrencyDollar, Clock } from "@phosphor-icons/react"
import type { GPUOption } from "@/lib/llm-calculations"
import { Separator } from "@/components/ui/separator"

interface CloudPricingCardProps {
  gpu: GPUOption
  utilizationPercent: number
}

export function CloudPricingCard({ gpu, utilizationPercent }: CloudPricingCardProps) {
  if (!gpu.cloudPricing || gpu.cloudPricing.length === 0) {
    return null
  }

  const sortedPricing = [...gpu.cloudPricing].sort((a, b) => a.pricePerHour - b.pricePerHour)
  const cheapest = sortedPricing[0]

  const getCostEstimates = (pricePerHour: number) => {
    return {
      hour: pricePerHour,
      day: pricePerHour * 24,
      week: pricePerHour * 24 * 7,
      month: pricePerHour * 24 * 30,
    }
  }

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case "High":
        return "bg-green-500/10 text-green-500 border-green-500/30"
      case "Medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
      case "Low":
        return "bg-red-500/10 text-red-500 border-red-500/30"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <Card className="border-accent/30 bg-card/50 backdrop-blur-sm mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <CurrencyDollar size={20} className="text-accent" weight="duotone" />
          Cloud GPU Pricing
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Estimated rental costs for {gpu.name} ({utilizationPercent.toFixed(1)}% utilized)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sortedPricing.map((pricing, index) => {
            const costs = getCostEstimates(pricing.pricePerHour)
            const isCheapest = index === 0

            return (
              <div
                key={pricing.provider}
                className={`p-3 rounded-lg border ${
                  isCheapest
                    ? "border-accent/50 bg-accent/5"
                    : "border-border bg-secondary/20"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{pricing.provider}</span>
                    {isCheapest && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        Cheapest
                      </Badge>
                    )}
                  </div>
                  <Badge className={getAvailabilityColor(pricing.availability)}>
                    {pricing.availability}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Per Hour:</span>
                    <span className="font-mono font-bold text-accent">
                      ${costs.hour.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Per Day:</span>
                    <span className="font-mono font-medium">${costs.day.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Per Week:</span>
                    <span className="font-mono font-medium">${costs.week.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Per Month:</span>
                    <span className="font-mono font-medium">${costs.month.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <Separator />

        <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
          <div className="flex items-start gap-2 mb-2">
            <Clock size={16} className="text-primary mt-0.5 shrink-0" weight="duotone" />
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">Cost Savings Tip</h4>
              <p className="text-xs text-muted-foreground">
                With {cheapest.provider} at ${cheapest.pricePerHour.toFixed(2)}/hr, running 8 hours per
                day costs ${(cheapest.pricePerHour * 8 * 30).toFixed(0)}/month vs. $
                {(cheapest.pricePerHour * 24 * 30).toFixed(0)}/month for 24/7 operation.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
