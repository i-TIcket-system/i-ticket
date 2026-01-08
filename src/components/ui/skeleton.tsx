import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-shimmer rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// P1-UX-003: Matched skeleton layouts for different card types
// Today's Activity Card Skeleton
export function TodayActivityCardSkeleton() {
  return (
    <div className="backdrop-blur-xl bg-gradient-to-br from-teal-50 to-teal-100/80 border-teal-200 shadow-xl p-6 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
      <Skeleton className="h-10 w-20 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

// Business Insights Card Skeleton
export function InsightsCardSkeleton() {
  return (
    <div className="backdrop-blur-xl bg-gradient-to-br from-purple-50 to-purple-100/80 border-purple-200 shadow-xl p-6 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
      <Skeleton className="h-9 w-28 mb-2" />
      <Skeleton className="h-3 w-24" />
    </div>
  )
}

// Fallback: Generic stat card skeleton
export function StatCardSkeleton() {
  return (
    <div className="backdrop-blur-xl bg-gradient-to-br from-gray-50 to-gray-100/80 border-gray-200 shadow-xl p-6 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
      <Skeleton className="h-10 w-32 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

// Table Row Skeleton
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

// Trip Card Skeleton (for search results)
export function TripCardSkeleton() {
  return (
    <div className="bg-card border rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="h-10 w-full rounded" />
    </div>
  )
}

// Dashboard Chart Skeleton
export function ChartSkeleton() {
  return (
    <div className="w-full h-[300px] flex items-end justify-between gap-2 px-4 pb-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton
          key={i}
          className="w-full"
          style={{ height: `${Math.random() * 80 + 20}%` }}
        />
      ))}
    </div>
  )
}

export { Skeleton }
