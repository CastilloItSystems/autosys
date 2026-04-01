// backend/src/features/workshop/appointments/appointments.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import {
  findAllAppointments,
  findAppointmentById,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  // FASE 3.1: Import scheduling helpers
  getSchedulingConflicts,
  getAdvisorBusyTimes,
} from './appointments.service.js'
import {
  CreateAppointmentDTO,
  UpdateAppointmentDTO,
  UpdateAppointmentStatusDTO,
  AppointmentResponseDTO,
} from './appointments.dto.js'

export const getAll = async (req: Request, res: Response) => {
  const result = await findAllAppointments(
    prisma,
    req.empresaId!,
    req.validatedQuery as any
  )
  const items = result.data.map((i) => new AppointmentResponseDTO(i))
  return ApiResponse.paginated(res, items, result.page, result.limit, result.total)
}

export const getOne = async (req: Request, res: Response) => {
  const item = await findAppointmentById(
    prisma,
    req.params.id as string,
    req.empresaId!
  )
  return ApiResponse.success(res, new AppointmentResponseDTO(item))
}

export const create = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string
  const item = await createAppointment(
    prisma,
    req.empresaId!,
    userId,
    new CreateAppointmentDTO(req.body)
  )
  return ApiResponse.created(
    res,
    new AppointmentResponseDTO(item),
    'Cita creada'
  )
}

export const update = async (req: Request, res: Response) => {
  const item = await updateAppointment(
    prisma,
    req.params.id as string,
    req.empresaId!,
    new UpdateAppointmentDTO(req.body)
  )
  return ApiResponse.success(
    res,
    new AppointmentResponseDTO(item),
    'Cita actualizada'
  )
}

export const updateStatus = async (req: Request, res: Response) => {
  const dto = new UpdateAppointmentStatusDTO(req.body)
  const item = await updateAppointmentStatus(
    prisma,
    req.params.id as string,
    req.empresaId!,
    dto.status
  )
  return ApiResponse.success(
    res,
    new AppointmentResponseDTO(item),
    'Estado de cita actualizado'
  )
}

export const remove = async (req: Request, res: Response) => {
  await deleteAppointment(prisma, req.params.id as string, req.empresaId!)
  return ApiResponse.success(res, null, 'Cita eliminada')
}

// FASE 3.1: Check for scheduling conflicts without creating appointment
export const checkConflicts = async (req: Request, res: Response) => {
  try {
    const { advisorId, technicianId, bayId, startTime, durationMinutes } =
      req.body

    if (!startTime || !durationMinutes) {
      return ApiResponse.error(
        res,
        'startTime and durationMinutes are required',
        400
      )
    }

    const result = await getSchedulingConflicts(prisma, req.empresaId!, {
      advisorId,
      technicianId,
      bayId,
      startTime: new Date(startTime),
      durationMinutes,
    })

    return ApiResponse.success(res, result, 'Scheduling check completed')
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error checking scheduling'
    return ApiResponse.error(res, message, 400)
  }
}

// FASE 3.1: Get advisor busy times and availability
export const getAdvisorAvailability = async (req: Request, res: Response) => {
  try {
    const { advisorId, startDate, endDate } = req.query

    if (!advisorId || !startDate || !endDate) {
      return ApiResponse.error(
        res,
        'advisorId, startDate and endDate query parameters are required',
        400
      )
    }

    const busyTimes = await getAdvisorBusyTimes(
      prisma,
      req.empresaId!,
      advisorId as string,
      new Date(startDate as string),
      new Date(endDate as string)
    )

    return ApiResponse.success(
      res,
      { busyTimes },
      'Advisor availability retrieved'
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error retrieving availability'
    return ApiResponse.error(res, message, 400)
  }
}
