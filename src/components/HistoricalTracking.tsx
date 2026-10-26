import { useKV } from "@/hooks/useKV"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ClockCounterClockwise, Trash, TrendUp } from "@phosphor-icons/react"
import { formatMemory } from "@/lib/llm-calculations"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"

export interface CalculationEntry {
  id: string
  timestamp: number
  type: "inference" | "training" | "quantization"
  params: Record<string, unknown>
  totalMemory: number
  gpuRecommendation?: string
}

export function HistoricalTracking() {
  const [history, setHistory] = useKV<CalculationEntry[]>("calculation-history", [])
  const [selectedType, setSelectedType] = useState<string>("all")

  if (!history) return null

  const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp)
  
  const filteredHistory =
    selectedType === "all"
      ? sortedHistory
      : sortedHistory.filter((entry) => entry.type === selectedType)

  const handleClearHistory = () => {
    setHistory([])
  }

  const handleDeleteEntry = (id: string) => {
    setHistory((current) => (current ? current.filter((entry) => entry.id !== id) : []))
  }

  const stats = {
    total: history.length,
    inference: history.filter((e) => e.type === "inference").length,
    training: history.filter((e) => e.type === "training").length,
    quantization: history.filter((e) => e.type === "quantization").length,
    avgMemory:
      history.length > 0
        ? history.reduce((sum, e) => sum + e.totalMemory, 0) / history.length
        : 0,
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "inference":
        return "bg-primary/10 text-primary border-primary/30"
      case "training":
        return "bg-accent/10 text-accent border-accent/30"
      case "quantization":
        return "bg-secondary/10 text-secondary-foreground border-secondary/30"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="border-accent/30 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClockCounterClockwise size={24} className="text-accent" weight="duotone" />
                Calculation History
              </CardTitle>
              <CardDescription>Track and analyze your past calculations</CardDescription>
            </div>
            {history.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearHistory}
                className="gap-2 text-destructive hover:bg-destructive/10"
              >
                <Trash size={18} weight="duotone" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-lg bg-muted/30 border border-border">
              <div className="text-xs sm:text-sm text-muted-foreground mb-1">Total Calculations</div>
              <div className="font-mono text-xl sm:text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="p-3 sm:p-4 rounded-lg bg-primary/10 border border-primary/30">
              <div className="text-xs sm:text-sm text-muted-foreground mb-1">Inference</div>
              <div className="font-mono text-xl sm:text-2xl font-bold text-primary">
                {stats.inference}
              </div>
            </div>
            <div className="p-3 sm:p-4 rounded-lg bg-accent/10 border border-accent/30">
              <div className="text-xs sm:text-sm text-muted-foreground mb-1">Training</div>
              <div className="font-mono text-xl sm:text-2xl font-bold text-accent">
                {stats.training}
              </div>
            </div>
            <div className="p-3 sm:p-4 rounded-lg bg-secondary/10 border border-secondary/30">
              <div className="text-xs sm:text-sm text-muted-foreground mb-1">Avg Memory</div>
              <div className="font-mono text-xl sm:text-2xl font-bold text-secondary-foreground">
                {formatMemory(stats.avgMemory)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-start sm:items-center justify-between gap-2 flex-col sm:flex-row">
            <CardTitle className="text-base sm:text-lg">Recent Calculations</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("all")}
                className="text-xs"
              >
                All
              </Button>
              <Button
                variant={selectedType === "inference" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("inference")}
                className="text-xs"
              >
                Inference
              </Button>
              <Button
                variant={selectedType === "training" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("training")}
                className="text-xs"
              >
                Training
              </Button>
              <Button
                variant={selectedType === "quantization" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("quantization")}
                className="text-xs"
              >
                Quantization
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <ClockCounterClockwise
                size={48}
                className="text-muted-foreground mx-auto mb-4"
                weight="duotone"
              />
              <p className="text-muted-foreground text-sm sm:text-base">
                {selectedType === "all"
                  ? "No calculations yet. Start using the calculators to build your history."
                  : `No ${selectedType} calculations found.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredHistory.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="p-3 sm:p-4 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={getTypeColor(entry.type)}>
                            {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(entry.timestamp)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm">
                          {entry.type === "inference" && "parameters" in entry.params && (
                            <>
                              <div>
                                <span className="text-muted-foreground">Model: </span>
                                <span className="font-mono font-medium">
                                  {entry.params.parameters}B
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Precision: </span>
                                <span className="font-mono font-medium">
                                  {entry.params.precision?.toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Context: </span>
                                <span className="font-mono font-medium">
                                  {entry.params.contextLength?.toLocaleString()}
                                </span>
                              </div>
                            </>
                          )}

                          {entry.type === "training" && "batchSize" in entry.params && (
                            <>
                              <div>
                                <span className="text-muted-foreground">Model: </span>
                                <span className="font-mono font-medium">
                                  {entry.params.parameters}B
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Method: </span>
                                <span className="font-mono font-medium">
                                  {entry.params.method?.toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Batch: </span>
                                <span className="font-mono font-medium">{entry.params.batchSize}</span>
                              </div>
                            </>
                          )}

                          {entry.type === "quantization" && "modelSize" in entry.params && (
                            <div>
                              <span className="text-muted-foreground">Model: </span>
                              <span className="font-mono font-medium">
                                {entry.params.modelSize}B
                              </span>
                            </div>
                          )}

                          <div className="sm:col-span-1">
                            <span className="text-muted-foreground">VRAM: </span>
                            <span className="font-mono font-bold text-accent">
                              {formatMemory(entry.totalMemory)}
                            </span>
                          </div>
                        </div>

                        {entry.gpuRecommendation && (
                          <div className="text-xs text-muted-foreground">
                            <TrendUp size={14} className="inline mr-1" weight="duotone" />
                            Recommended: {entry.gpuRecommendation}
                          </div>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <Trash size={16} weight="duotone" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function saveCalculationToHistory(entry: Omit<CalculationEntry, "id" | "timestamp">) {
  const newEntry: CalculationEntry = {
    ...entry,
    id: `calc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  }

  return newEntry
}
