"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Camera, Loader2, Trash2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

interface ProfilePictureUploadProps {
  currentPicture?: string | null
  onUploadSuccess?: (url: string) => void
  size?: "sm" | "md" | "lg"
}

export function ProfilePictureUpload({
  currentPicture,
  onUploadSuccess,
  size = "md"
}: ProfilePictureUploadProps) {
  const { update: updateSession } = useSession()
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentPicture || null)
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
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Invalid file type. Please upload a JPEG, PNG, or WebP image.")
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

      const response = await fetch("/api/upload/profile-picture", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Profile picture uploaded successfully!")
        setPreview(data.url)
        onUploadSuccess?.(data.url)

        // Refresh session to update profile picture across the app
        await updateSession()
      } else {
        toast.error(data.error || "Failed to upload image")
        setPreview(currentPicture || null)
      }
    } catch (error) {
      toast.error("An error occurred while uploading")
      setPreview(currentPicture || null)
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
      const response = await fetch("/api/upload/profile-picture", {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Profile picture removed successfully!")
        setPreview(null)
        onUploadSuccess?.(null as any)

        // Refresh session
        await updateSession()
      } else {
        toast.error(data.error || "Failed to remove image")
      }
    } catch (error) {
      toast.error("An error occurred while removing image")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Profile Picture Display */}
      <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden bg-muted border-4 border-background shadow-lg`}>
        {preview ? (
          <Image
            src={preview}
            alt="Profile"
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10">
            <User className="w-1/2 h-1/2 text-primary/40" />
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
          accept="image/jpeg,image/jpg,image/png,image/webp"
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
          {preview ? "Change" : "Upload"} Photo
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
        Upload a profile picture. JPG, PNG or WebP. Max 5MB.
      </p>
    </div>
  )
}
