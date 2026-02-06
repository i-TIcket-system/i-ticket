"use client"

interface FleetHealthGaugeProps {
  score: number // 0-100 (100 = perfect health)
  totalVehicles: number
}

export function FleetHealthGauge({ score, totalVehicles }: FleetHealthGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score))

  // Color based on health score
  const getColor = (s: number) => {
    if (s >= 80) return "#22c55e" // green
    if (s >= 60) return "#14B8A6" // teal
    if (s >= 40) return "#f59e0b" // amber
    return "#ef4444" // red
  }

  const getLabel = (s: number) => {
    if (s >= 80) return "Excellent"
    if (s >= 60) return "Good"
    if (s >= 40) return "Fair"
    return "Poor"
  }

  const color = getColor(clampedScore)
  const radius = 80
  const strokeWidth = 12
  const circumference = Math.PI * radius // half circle
  const progress = (clampedScore / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="120" viewBox="0 0 200 120">
        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          className="transition-all duration-1000 ease-out"
        />
        {/* Score text */}
        <text x="100" y="85" textAnchor="middle" className="text-3xl font-bold" fill={color}>
          {clampedScore}
        </text>
        <text x="100" y="105" textAnchor="middle" className="text-xs" fill="#6b7280">
          {getLabel(clampedScore)}
        </text>
      </svg>
      <p className="text-sm text-muted-foreground mt-1">
        Fleet Health Score ({totalVehicles} vehicles)
      </p>
    </div>
  )
}
