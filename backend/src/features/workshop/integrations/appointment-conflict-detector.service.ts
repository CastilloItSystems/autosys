// backend/src/features/workshop/integrations/appointment-conflict-detector.service.ts
// FASE 3.1: Scheduling Conflict Detection
// Validates appointment scheduling to prevent double-booking of advisors, technicians, and bays

import type { PrismaClient } from '../../../generated/prisma/client.js'
import { BadRequestError } from '../../../shared/utils/apiError.js'

/**
 * Represents a time slot conflict
 */
export interface SchedulingConflict {
  type: 'advisor' | 'technician' | 'bay'
  conflictingEntityId: string
  conflictingEntityName: string
  conflictingItemId: string // appointment or service order ID
  conflictingItemNumber: string // folio of conflicting item
  conflictStart: Date
  conflictEnd: Date
  durationMinutes: number
}

/**
 * Represents an available time slot
 */
export interface AvailableTimeSlot {
  startTime: Date
  endTime: Date
  durationMinutes: number
  advisorId?: string
  technicianId?: string
  bayId?: string
}

/**
 * Conflict detection result
 */
export interface ConflictDetectionResult {
  hasConflicts: boolean
  conflicts: SchedulingConflict[]
  availableSlots: AvailableTimeSlot[]
}

/**
 * Validates if an appointment time slot conflicts with existing appointments or service orders
 * Checks for overlaps with:
 * - Other appointments assigned to the same advisor
 * - Service orders assigned to the same technician (if specified)
 * - Service orders assigned to the same bay (if specified)
 *
 * @param prisma Prisma client
 * @param dto Booking details: {advisorId?, technicianId?, bayId?, startTime, durationMinutes, excludeAppointmentId?}
 * @param empresaId Tenant ID
 * @returns ConflictDetectionResult with conflicts and available alternatives
 */
export async function detectSchedulingConflicts(
  prisma: PrismaClient,
  dto: {
    advisorId?: string
    technicianId?: string
    bayId?: string
    startTime: Date
    durationMinutes: number
    excludeAppointmentId?: string // For updates, exclude current appointment
  },
  empresaId: string
): Promise<ConflictDetectionResult> {
  const conflicts: SchedulingConflict[] = []

  const scheduledStart = new Date(dto.startTime)
  const scheduledEnd = new Date(
    scheduledStart.getTime() + dto.durationMinutes * 60000
  )

  // ──────────────────────────────────────────────────────────────────────
  // 1. CHECK ADVISOR CONFLICTS (Appointment level)
  // ──────────────────────────────────────────────────────────────────────
  if (dto.advisorId) {
    const advisorConflictingAppointments = await (
      prisma as any
    ).serviceAppointment.findMany({
      where: {
        empresaId,
        assignedAdvisorId: dto.advisorId,
        status: { in: ['SCHEDULED', 'CONFIRMED', 'ARRIVED'] }, // Ignore COMPLETED/NO_SHOW/CANCELLED
        id: dto.excludeAppointmentId
          ? { not: dto.excludeAppointmentId }
          : undefined,
      },
      include: {
        customer: { select: { id: true, name: true } },
      },
    })

    for (const apt of advisorConflictingAppointments) {
      const aptStart = new Date(apt.scheduledDate)
      const aptEnd = new Date(
        aptStart.getTime() + (apt.estimatedMinutes ?? 60) * 60000
      )

      // Check if time ranges overlap
      if (!(scheduledEnd <= aptStart || scheduledStart >= aptEnd)) {
        conflicts.push({
          type: 'advisor',
          conflictingEntityId: dto.advisorId,
          conflictingEntityName: `Advisor occupied`,
          conflictingItemId: apt.id,
          conflictingItemNumber: apt.folio,
          conflictStart: aptStart,
          conflictEnd: aptEnd,
          durationMinutes: apt.estimatedMinutes ?? 60,
        })
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // 2. CHECK TECHNICIAN CONFLICTS (Service Order level)
  // ──────────────────────────────────────────────────────────────────────
  if (dto.technicianId) {
    // Check for overlapping service orders assigned to same technician
    const technicianConflictingSOs = await (
      prisma as any
    ).serviceOrder.findMany({
      where: {
        empresaId,
        assignedTechnicianId: dto.technicianId,
        status: {
          in: [
            'OPEN',
            'DIAGNOSING',
            'IN_PROGRESS',
            'WAITING_PARTS',
            'WAITING_AUTH',
            'QUALITY_CHECK',
          ],
        }, // Active states only
      },
      include: {
        customer: { select: { id: true, name: true } },
        serviceAppointment: {
          select: { scheduledDate: true, estimatedMinutes: true },
        },
      },
    })

    for (const so of technicianConflictingSOs) {
      // Estimate SO timing based on appointment or standard estimate
      if (so.serviceAppointment) {
        const soStart = new Date(so.serviceAppointment.scheduledDate)
        const soEnd = new Date(
          soStart.getTime() +
            (so.serviceAppointment.estimatedMinutes ?? 120) * 60000
        )

        if (!(scheduledEnd <= soStart || scheduledStart >= soEnd)) {
          conflicts.push({
            type: 'technician',
            conflictingEntityId: dto.technicianId,
            conflictingEntityName: `Technician occupied`,
            conflictingItemId: so.id,
            conflictingItemNumber: so.folio,
            conflictStart: soStart,
            conflictEnd: soEnd,
            durationMinutes: so.serviceAppointment.estimatedMinutes ?? 120,
          })
        }
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // 3. CHECK BAY CONFLICTS (Service Order level)
  // ──────────────────────────────────────────────────────────────────────
  if (dto.bayId) {
    const bayConflictingSOs = await (prisma as any).serviceOrder.findMany({
      where: {
        empresaId,
        bayId: dto.bayId,
        status: {
          in: [
            'OPEN',
            'DIAGNOSING',
            'IN_PROGRESS',
            'WAITING_PARTS',
            'WAITING_AUTH',
            'QUALITY_CHECK',
          ],
        }, // Active states
      },
      include: {
        customer: { select: { id: true, name: true } },
        serviceAppointment: {
          select: { scheduledDate: true, estimatedMinutes: true },
        },
        bay: { select: { id: true, name: true } },
      },
    })

    for (const so of bayConflictingSOs) {
      if (so.serviceAppointment) {
        const soStart = new Date(so.serviceAppointment.scheduledDate)
        const soEnd = new Date(
          soStart.getTime() +
            (so.serviceAppointment.estimatedMinutes ?? 120) * 60000
        )

        if (!(scheduledEnd <= soStart || scheduledStart >= soEnd)) {
          conflicts.push({
            type: 'bay',
            conflictingEntityId: dto.bayId,
            conflictingEntityName: so.bay?.name ?? 'Bay occupied',
            conflictingItemId: so.id,
            conflictingItemNumber: so.folio,
            conflictStart: soStart,
            conflictEnd: soEnd,
            durationMinutes: so.serviceAppointment.estimatedMinutes ?? 120,
          })
        }
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // 4. CALCULATE AVAILABLE TIME SLOTS (if conflicts found, suggest alternatives)
  // ──────────────────────────────────────────────────────────────────────
  const availableSlots: AvailableTimeSlot[] = []

  if (conflicts.length > 0) {
    // Find next 3 available slots within next 7 days
    availableSlots.push(
      ...(await findAvailableTimeSlots(prisma, dto, empresaId, dto.startTime))
    )
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    availableSlots,
  }
}

/**
 * Finds next available time slots for a appointment request
 * Searches forward from startTime + 1 hour increments
 * Returns up to 5 available slots within next 7 days
 */
async function findAvailableTimeSlots(
  prisma: PrismaClient,
  dto: {
    advisorId?: string
    technicianId?: string
    bayId?: string
    durationMinutes: number
  },
  empresaId: string,
  fromDate: Date,
  maxResults: number = 5
): Promise<AvailableTimeSlot[]> {
  const availableSlots: AvailableTimeSlot[] = []
  let currentTime = new Date(fromDate)
  currentTime.setHours(currentTime.getHours() + 1) // Start 1 hour later
  const maxDate = new Date(fromDate.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days limit

  // Business hours: 8 AM to 6 PM
  const BUSINESS_HOURS_START = 8
  const BUSINESS_HOURS_END = 18

  while (currentTime < maxDate && availableSlots.length < maxResults) {
    // Skip if outside business hours
    if (currentTime.getHours() < BUSINESS_HOURS_START) {
      currentTime.setHours(BUSINESS_HOURS_START, 0, 0, 0)
    } else if (currentTime.getHours() >= BUSINESS_HOURS_END) {
      // Move to next day
      currentTime.setDate(currentTime.getDate() + 1)
      currentTime.setHours(BUSINESS_HOURS_START, 0, 0, 0)
      continue
    }

    // Check if this slot is available
    const testConflicts = await detectSchedulingConflicts(
      prisma,
      {
        advisorId: dto.advisorId,
        technicianId: dto.technicianId,
        bayId: dto.bayId,
        startTime: currentTime,
        durationMinutes: dto.durationMinutes,
      },
      empresaId
    )

    if (!testConflicts.hasConflicts) {
      const slotEnd = new Date(
        currentTime.getTime() + dto.durationMinutes * 60000
      )
      availableSlots.push({
        startTime: new Date(currentTime),
        endTime: slotEnd,
        durationMinutes: dto.durationMinutes,
        advisorId: dto.advisorId,
        technicianId: dto.technicianId,
        bayId: dto.bayId,
      })
    }

    // Move to next 30-minute slot
    currentTime.setMinutes(currentTime.getMinutes() + 30)
  }

  return availableSlots
}

/**
 * Validates if a specific time slot is safe for appointment creation/update
 * Throws error if conflicts exist
 *
 * @param prisma Prisma client
 * @param dto Appointment details
 * @param empresaId Tenant ID
 * @throws BadRequestError if conflicts detected
 */
export async function validateAppointmentScheduling(
  prisma: PrismaClient,
  dto: {
    advisorId?: string
    technicianId?: string
    bayId?: string
    startTime: Date
    durationMinutes: number
    excludeAppointmentId?: string
  },
  empresaId: string
): Promise<void> {
  const result = await detectSchedulingConflicts(prisma, dto, empresaId)

  if (result.hasConflicts) {
    const conflictDetails = result.conflicts
      .map(
        (c) =>
          `${c.type.toUpperCase()}: ${c.conflictingItemNumber} (${c.conflictStart.toLocaleTimeString()} - ${c.conflictEnd.toLocaleTimeString()})`
      )
      .join('; ')

    const suggestions =
      result.availableSlots.length > 0
        ? `\nAvailable slots: ${result.availableSlots.map((s) => s.startTime.toLocaleString()).join(', ')}`
        : ''

    throw new BadRequestError(
      `Scheduling conflict detected: ${conflictDetails}${suggestions}`
    )
  }
}

/**
 * Get busy times for an advisor, technician, or bay within a date range
 * Useful for UI calendar/availability views
 */
export async function getBusyTimes(
  prisma: PrismaClient,
  query: {
    advisorId?: string
    technicianId?: string
    bayId?: string
    startDate: Date
    endDate: Date
  },
  empresaId: string
): Promise<
  Array<{ start: Date; end: Date; title: string; entityType: string }>
> {
  const busyTimes: Array<{
    start: Date
    end: Date
    title: string
    entityType: string
  }> = []

  // Get advisor appointments
  if (query.advisorId) {
    const appointments = await (prisma as any).serviceAppointment.findMany({
      where: {
        empresaId,
        assignedAdvisorId: query.advisorId,
        scheduledDate: {
          gte: query.startDate,
          lte: query.endDate,
        },
        status: { in: ['SCHEDULED', 'CONFIRMED', 'ARRIVED'] },
      },
      select: {
        folio: true,
        scheduledDate: true,
        estimatedMinutes: true,
        customer: { select: { name: true } },
      },
    })

    for (const apt of appointments) {
      const start = new Date(apt.scheduledDate)
      const end = new Date(
        start.getTime() + (apt.estimatedMinutes ?? 60) * 60000
      )
      busyTimes.push({
        start,
        end,
        title: `APT ${apt.folio} - ${apt.customer.name}`,
        entityType: 'appointment',
      })
    }
  }

  // Get technician service orders
  if (query.technicianId) {
    const serviceOrders = await (prisma as any).serviceOrder.findMany({
      where: {
        empresaId,
        assignedTechnicianId: query.technicianId,
        status: {
          in: [
            'OPEN',
            'DIAGNOSING',
            'IN_PROGRESS',
            'WAITING_PARTS',
            'WAITING_AUTH',
            'QUALITY_CHECK',
          ],
        },
      },
      include: {
        serviceAppointment: {
          select: { scheduledDate: true, estimatedMinutes: true },
        },
        customer: { select: { name: true } },
      },
    })

    for (const so of serviceOrders) {
      if (so.serviceAppointment) {
        const start = new Date(so.serviceAppointment.scheduledDate)
        const end = new Date(
          start.getTime() +
            (so.serviceAppointment.estimatedMinutes ?? 120) * 60000
        )

        if (start >= query.startDate && end <= query.endDate) {
          busyTimes.push({
            start,
            end,
            title: `SO ${so.folio} - ${so.customer.name}`,
            entityType: 'serviceOrder',
          })
        }
      }
    }
  }

  // Get bay service orders
  if (query.bayId) {
    const serviceOrders = await (prisma as any).serviceOrder.findMany({
      where: {
        empresaId,
        bayId: query.bayId,
        status: {
          in: [
            'OPEN',
            'DIAGNOSING',
            'IN_PROGRESS',
            'WAITING_PARTS',
            'WAITING_AUTH',
            'QUALITY_CHECK',
          ],
        },
      },
      include: {
        serviceAppointment: {
          select: { scheduledDate: true, estimatedMinutes: true },
        },
        customer: { select: { name: true } },
      },
    })

    for (const so of serviceOrders) {
      if (so.serviceAppointment) {
        const start = new Date(so.serviceAppointment.scheduledDate)
        const end = new Date(
          start.getTime() +
            (so.serviceAppointment.estimatedMinutes ?? 120) * 60000
        )

        if (start >= query.startDate && end <= query.endDate) {
          busyTimes.push({
            start,
            end,
            title: `SO ${so.folio} - ${so.customer.name}`,
            entityType: 'serviceOrder',
          })
        }
      }
    }
  }

  return busyTimes.sort((a, b) => a.start.getTime() - b.start.getTime())
}
