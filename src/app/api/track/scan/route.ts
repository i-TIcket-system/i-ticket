import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/db"
import { parseDeviceInfo } from "@/lib/sales/referral-utils"

const scanSchema = z.object({
  referralCode: z.string().min(1),
  visitorHash: z.string().min(1),
  deviceInfo: z.object({
    type: z.string().optional(),
    browser: z.string().optional(),
    os: z.string().optional(),
  }).optional(),
  landingPage: z.string().default("/"),
  referrerUrl: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = scanSchema.parse(body)

    // Find the sales person by referral code
    const salesPerson = await prisma.salesPerson.findUnique({
      where: {
        referralCode: data.referralCode,
        status: 'ACTIVE'
      }
    })

    if (!salesPerson) {
      return NextResponse.json(
        { error: "Invalid referral code" },
        { status: 404 }
      )
    }

    // FRAUD PREVENTION 1: Check if this visitor already scanned ANY sales person's code
    // First-come attribution - once a visitor is attributed, they can't be re-attributed
    const existingVisitorScan = await prisma.salesQrScan.findFirst({
      where: {
        visitorHash: data.visitorHash
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    if (existingVisitorScan) {
      // Visitor already tracked - return success but don't create new record
      // This prevents: 1) duplicate counts, 2) re-attribution to different sales person
      return NextResponse.json({
        success: true,
        alreadyTracked: true,
        message: "Visitor already attributed"
      })
    }

    // Get device info from user agent if not provided
    const userAgent = request.headers.get('user-agent') || ''
    const parsedDevice = parseDeviceInfo(userAgent)

    const deviceType = data.deviceInfo?.type || parsedDevice.deviceType
    const browser = data.deviceInfo?.browser || parsedDevice.browser
    const os = data.deviceInfo?.os || parsedDevice.os

    // Create the scan record - this is a new unique visitor
    await prisma.salesQrScan.create({
      data: {
        salesPersonId: salesPerson.id,
        visitorHash: data.visitorHash,
        deviceType,
        browser,
        os,
        landingPage: data.landingPage,
        referrerUrl: data.referrerUrl,
      }
    })

    return NextResponse.json({ success: true, alreadyTracked: false })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error tracking QR scan:", error)
    return NextResponse.json(
      { error: "Failed to track scan" },
      { status: 500 }
    )
  }
}
