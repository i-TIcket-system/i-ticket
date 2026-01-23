import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { requireFullAdmin } from '@/lib/auth-helpers'

/**
 * GET /api/company/audit-logs/download
 * Download company audit logs as CSV with date range filtering
 * RULE-009: Blocked for supervisors - only full admins can download audit logs
 */
export async function GET(request: NextRequest) {
  try {
    // Block supervisors - only full admins can download audit logs
    const { companyId } = await requireFullAdmin()
    const { searchParams } = new URL(request.url)

    const action = searchParams.get('action')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    const where: any = {
      companyId: companyId,
    }

    if (action && action !== 'ALL') {
      where.action = action
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        where.createdAt.gte = start
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    // Fetch all logs (no pagination for download)
    const logs = await prisma.adminLog.findMany({
      where,
      select: {
        id: true,
        userId: true,
        action: true,
        details: true,
        tripId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10000, // Reasonable limit
    })

    // Fetch user names
    const userIds = Array.from(new Set(logs.map(log => log.userId).filter(id => id !== 'SYSTEM')))
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, role: true, staffRole: true },
    })

    const userMap = new Map(users.map(u => [u.id, u]))

    // Get company name
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    })

    // Generate CSV
    const csvRows: string[] = []

    // Header
    csvRows.push([
      'Date & Time',
      'Action',
      'User Name',
      'User Email',
      'User Role',
      'Staff Role',
      'Trip ID',
      'Trip Route',
      'Vehicle Info',
      'Changes Made',
      'Reason',
      'Old Value',
      'New Value',
      'Additional Details',
    ].join(','))

    // Data rows
    for (const log of logs) {
      const user = log.userId === 'SYSTEM'
        ? { name: 'System', email: 'system@i-ticket.et', role: 'SYSTEM', staffRole: null }
        : userMap.get(log.userId) || { name: 'Unknown', email: '', role: '', staffRole: null }

      // Parse details and extract common fields
      let tripRoute = ''
      let vehicleInfo = ''
      let changesMade = ''
      let reason = ''
      let oldValue = ''
      let newValue = ''
      let additionalDetails = ''

      try {
        const detailsObj = log.details ? JSON.parse(log.details) : null
        if (detailsObj) {
          // Extract common fields
          tripRoute = detailsObj.route || detailsObj.tripRoute || ''
          vehicleInfo = detailsObj.vehicle || detailsObj.vehiclePlateNumber || detailsObj.vehicleInfo || ''
          changesMade = detailsObj.changes || detailsObj.changesMade || detailsObj.update || ''
          reason = detailsObj.reason || detailsObj.overrideReason || ''
          oldValue = detailsObj.oldValue || detailsObj.from || detailsObj.previous || ''
          newValue = detailsObj.newValue || detailsObj.to || detailsObj.current || ''

          // Collect remaining details
          const processedKeys = ['route', 'tripRoute', 'vehicle', 'vehiclePlateNumber', 'vehicleInfo',
                                  'changes', 'changesMade', 'update', 'reason', 'overrideReason',
                                  'oldValue', 'from', 'previous', 'newValue', 'to', 'current']
          const remainingEntries = Object.entries(detailsObj)
            .filter(([key]) => !processedKeys.includes(key))
            .map(([key, value]) => `${key}: ${value}`)

          if (remainingEntries.length > 0) {
            additionalDetails = remainingEntries.join(' | ')
          }
        }
      } catch {
        additionalDetails = log.details || ''
      }

      // Escape CSV values (handle commas, quotes, newlines)
      const escapeCsv = (value: any): string => {
        if (value === null || value === undefined) return ''
        const str = String(value)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }

      csvRows.push([
        escapeCsv(new Date(log.createdAt).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })),
        escapeCsv(log.action),
        escapeCsv(user.name),
        escapeCsv(user.email),
        escapeCsv(user.role),
        escapeCsv(user.staffRole || ''),
        escapeCsv(log.tripId || ''),
        escapeCsv(tripRoute),
        escapeCsv(vehicleInfo),
        escapeCsv(changesMade),
        escapeCsv(reason),
        escapeCsv(oldValue),
        escapeCsv(newValue),
        escapeCsv(additionalDetails),
      ].join(','))
    }

    // Add UTF-8 BOM and separator directive for Excel compatibility
    const csv = '\uFEFF' + 'sep=,\n' + csvRows.join('\n')

    // Generate filename with date range
    const dateStr = startDate && endDate
      ? `${startDate}_to_${endDate}`
      : startDate
      ? `from_${startDate}`
      : endDate
      ? `until_${endDate}`
      : 'all'

    const filename = `${company?.name.replace(/\s+/g, '_')}_audit_logs_${dateStr}.csv`

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating CSV:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSV' },
      { status: 500 }
    )
  }
}
