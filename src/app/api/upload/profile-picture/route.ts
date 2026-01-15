import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import prisma from "@/lib/db"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

/**
 * POST /api/upload/profile-picture
 * Upload profile picture for authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles")
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const extension = file.name.split(".").pop()
    const filename = `${session.user.id}-${Date.now()}.${extension}`
    const filepath = path.join(uploadDir, filename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Update user profile picture in database
    const profilePictureUrl = `/uploads/profiles/${filename}`

    await prisma.user.update({
      where: { id: session.user.id },
      data: { profilePicture: profilePictureUrl },
    })

    // Log the upload
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        action: "PROFILE_PICTURE_UPDATED",
        details: `Profile picture updated: ${filename}`,
      },
    })

    return NextResponse.json({
      success: true,
      url: profilePictureUrl,
      message: "Profile picture uploaded successfully",
    })
  } catch (error) {
    console.error("Profile picture upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload profile picture" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/upload/profile-picture
 * Remove profile picture for authenticated user
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Update user profile picture to null
    await prisma.user.update({
      where: { id: session.user.id },
      data: { profilePicture: null },
    })

    // Log the removal
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        action: "PROFILE_PICTURE_REMOVED",
        details: "Profile picture removed",
      },
    })

    return NextResponse.json({
      success: true,
      message: "Profile picture removed successfully",
    })
  } catch (error) {
    console.error("Profile picture removal error:", error)
    return NextResponse.json(
      { error: "Failed to remove profile picture" },
      { status: 500 }
    )
  }
}
