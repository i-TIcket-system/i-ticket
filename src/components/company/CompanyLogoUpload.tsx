"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Building2, Camera, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

interface CompanyLogoUploadProps {
  currentLogo?: string | null
  onUploadSuccess?: (url: string) => void
  size?: "sm" | "md" | "lg"
}

export function CompanyLogoUpload({
  currentLogo,
  onUploadSuccess,
  size = "md"
}: CompanyLogoUploadProps) {
  const router = useRouter()
  const { update: updateSession } = useSession()
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentLogo || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: "w-20 h-20",
    md: "w-32 h-32",
    lg: "w-40 h-40"
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (![
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/svg+xml"
    ].includes(file.type)) {
      toast.error("Invalid file type. Please upload a JPEG, PNG, WebP, or SVG image.")
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 5MB.")
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload/company-logo", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Company logo uploaded successfully!")
        setPreview(data.url)
        onUploadSuccess?.(data.url)

        // Refresh session to update logo across the app
        await updateSession()
        router.refresh()
      } else {
        toast.error(data.error || "Failed to upload logo")
        setPreview(currentLogo || null)
      }
    } catch (error) {
      toast.error("An error occurred while uploading")
      setPreview(currentLogo || null)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemove = async () => {
    setIsUploading(true)
    try {
      const response = await fetch("/api/upload/company-logo", {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Company logo removed successfully!")
        setPreview(null)
        onUploadSuccess?.(null as any)

        // Refresh session
        await updateSession()
        router.refresh()
      } else {
        toast.error(data.error || "Failed to remove logo")
      }
    } catch (error) {
      toast.error("An error occurred while removing logo")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Logo Display */}
      <div className={`relative ${sizeClasses[size]} rounded-lg overflow-hidden bg-muted border-4 border-background shadow-lg`}>
        {preview ? (
          <Image
            src={preview}
            alt="Company Logo"
            fill
            className="object-contain p-2"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10">
            <Building2 className="w-1/2 h-1/2 text-primary/40" />
          </div>
        )}

        {/* Upload Button Overlay */}
        {!isUploading && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            disabled={isUploading}
          >
            <Camera className="w-8 h-8 text-white" />
          </button>
        )}

        {/* Loading Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Camera className="w-4 h-4 mr-2" />
          {preview ? "Change" : "Upload"} Logo
        </Button>

        {preview && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={isUploading}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Remove
          </Button>
        )}
      </div>

      {/* Helper Text */}
      <p className="text-xs text-muted-foreground text-center max-w-xs">
        Upload your company logo. JPG, PNG, WebP, or SVG. Max 5MB.
      </p>
    </div>
  )
}
