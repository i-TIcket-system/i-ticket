import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import prisma from "@/lib/db"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"]

/**
 * POST /api/upload/company-logo
 * Upload company logo for authenticated company admin
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

    // Only company admins can upload company logos
    if (session.user.role !== "COMPANY_ADMIN") {
      return NextResponse.json(
        { error: "Only company admins can upload company logos" },
        { status: 403 }
      )
    }

    if (!session.user.companyId) {
      return NextResponse.json(
        { error: "No company associated with this user" },
        { status: 400 }
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
        { error: "Invalid file type. Only JPEG, PNG, WebP, and SVG are allowed." },
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
    const uploadDir = path.join(process.cwd(), "public", "uploads", "company-logos")
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const extension = file.name.split(".").pop()
    const filename = `${session.user.companyId}-${Date.now()}.${extension}`
    const filepath = path.join(uploadDir, filename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Update company logo in database
    const logoUrl = `/uploads/company-logos/${filename}`

    await prisma.company.update({
      where: { id: session.user.companyId },
      data: { logo: logoUrl },
    })

    // Log the upload
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        action: "COMPANY_LOGO_UPDATED",
        details: `Company logo updated: ${filename}`,
        companyId: session.user.companyId,
      },
    })

    return NextResponse.json({
      success: true,
      url: logoUrl,
      message: "Company logo uploaded successfully",
    })
  } catch (error) {
    console.error("Company logo upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload company logo" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/upload/company-logo
 * Remove company logo for authenticated company admin
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

    // Only company admins can remove company logos
    if (session.user.role !== "COMPANY_ADMIN") {
      return NextResponse.json(
        { error: "Only company admins can remove company logos" },
        { status: 403 }
      )
    }

    if (!session.user.companyId) {
      return NextResponse.json(
        { error: "No company associated with this user" },
        { status: 400 }
      )
    }

    // Update company logo to null
    await prisma.company.update({
      where: { id: session.user.companyId },
      data: { logo: null },
    })

    // Log the removal
    await prisma.adminLog.create({
      data: {
        userId: session.user.id,
        action: "COMPANY_LOGO_REMOVED",
        details: "Company logo removed",
        companyId: session.user.companyId,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Company logo removed successfully",
    })
  } catch (error) {
    console.error("Company logo removal error:", error)
    return NextResponse.json(
      { error: "Failed to remove company logo" },
      { status: 500 }
    )
  }
}
