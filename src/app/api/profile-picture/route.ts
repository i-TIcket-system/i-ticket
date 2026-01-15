import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { writeFile } from "fs/promises"
import { join } from "path"
import crypto from "crypto"

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Allowed image types
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]

// POST /api/profile-picture - Upload profile picture
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed" },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      )
    }

    // Generate unique filename
    const extension = file.name.split(".").pop() || "jpg"
    const randomId = crypto.randomBytes(16).toString("hex")
    const filename = `${session.user.id}_${randomId}.${extension}`

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = join(process.cwd(), "public", "uploads", "profile-pictures")
    const filePath = join(uploadDir, filename)

    await writeFile(filePath, buffer)

    // Update database based on user type
    const profilePicturePath = `/uploads/profile-pictures/${filename}`

    if (session.user.role === "SALES_PERSON") {
      // Update SalesPerson record
      await prisma.salesPerson.update({
        where: { id: session.user.id },
        data: { profilePicture: profilePicturePath }
      })
    } else {
      // Update User record (covers all other roles)
      await prisma.user.update({
        where: { id: session.user.id },
        data: { profilePicture: profilePicturePath }
      })
    }

    return NextResponse.json({
      success: true,
      profilePicture: profilePicturePath
    })
  } catch (error) {
    console.error("Profile picture upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload profile picture" },
      { status: 500 }
    )
  }
}

// DELETE /api/profile-picture - Remove profile picture
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update database to remove profile picture
    if (session.user.role === "SALES_PERSON") {
      await prisma.salesPerson.update({
        where: { id: session.user.id },
        data: { profilePicture: null }
      })
    } else {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { profilePicture: null }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Profile picture deletion error:", error)
    return NextResponse.json(
      { error: "Failed to delete profile picture" },
      { status: 500 }
    )
  }
}
