"use client"

import { Lock } from "lucide-react"
import { Card } from "@/components/ui/card"

interface ViewOnlyBannerProps {
  tripStatus: string
}

export function ViewOnlyBanner({ tripStatus }: ViewOnlyBannerProps) {
  const getMessage = () => {
    switch (tripStatus) {
      case "DEPARTED":
        return "Trip has departed. Only status updates to COMPLETED are allowed. All other details are locked.";
      case "COMPLETED":
        return "Trip is completed. All details are read-only for record keeping and audit compliance.";
      case "CANCELLED":
        return "Trip was cancelled. All details are read-only for record keeping.";
      default:
        return "This trip cannot be modified.";
    }
  };

  const getStatusColor = () => {
    switch (tripStatus) {
      case "DEPARTED":
        return "bg-blue-50 border-blue-400";
      case "COMPLETED":
        return "bg-green-50 border-green-400";
      case "CANCELLED":
        return "bg-gray-50 border-gray-400";
      default:
        return "bg-yellow-50 border-yellow-400";
    }
  };

  return (
    <Card className={`p-4 mb-6 border-2 ${getStatusColor()}`}>
      <div className="flex items-start gap-3">
        <Lock className="h-6 w-6 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold">View-Only Mode</h3>
            <span className="px-2 py-0.5 text-xs rounded bg-white/70 font-medium">
              {tripStatus}
            </span>
          </div>
          <p className="text-sm mb-2">{getMessage()}</p>
          <p className="text-xs text-muted-foreground">
            ✓ You can still view all details and download manifests
          </p>
        </div>
      </div>
    </Card>
  );
}
