import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireSalesPerson, handleAuthError } from "@/lib/auth-helpers"

/**
 * GET /api/sales/my-team
 * Get list of recruited sales persons and their stats
 */
export async function GET() {
  try {
    const session = await requireSalesPerson()
    const salesPersonId = session.user.id

    // Get all recruited sales persons
    const recruits = await prisma.salesPerson.findMany({
      where: {
        recruiterId: salesPersonId,
      },
      include: {
        _count: {
          select: {
            referrals: true, // Customer referrals
            recruits: true,  // Sales persons they recruited
            commissions: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      }
    })

    // Get stats for each recruit
    const teamWithStats = await Promise.all(
      recruits.map(async (recruit) => {
        // Get total commission earned by this recruit
        const commissionStats = await prisma.salesCommission.aggregate({
          where: {
            salesPersonId: recruit.id,
            isRecruiterCommission: false, // Only their direct earnings
          },
          _sum: {
            salesCommission: true,
          }
        })

        // Get recruiter earnings from this recruit (30% split)
        const recruiterEarnings = await prisma.salesCommission.aggregate({
          where: {
            salesPersonId: salesPersonId,
            recruiterId: recruit.id, // Earnings from this specific recruit
            isRecruiterCommission: true,
          },
          _sum: {
            salesCommission: true,
          }
        })

        return {
          id: recruit.id,
          name: recruit.name,
          phone: recruit.phone,
          email: recruit.email,
          referralCode: recruit.referralCode,
          tier: recruit.tier,
          status: recruit.status,
          createdAt: recruit.createdAt,
          stats: {
            referralsCount: recruit._count.referrals,
            recruitsCount: recruit._count.recruits,
            totalCommission: commissionStats._sum.salesCommission || 0,
            recruiterEarnings: recruiterEarnings._sum.salesCommission || 0,
          }
        }
      })
    )

    // Calculate total recruiter earnings
    const totalRecruiterEarnings = teamWithStats.reduce(
      (sum, member) => sum + member.stats.recruiterEarnings,
      0
    )

    return NextResponse.json({
      team: teamWithStats,
      totalRecruiterEarnings,
      teamSize: teamWithStats.length,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
