// backend/src/features/workshop/appointments/appointments.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import {
  findAllAppointments, findAppointmentById, createAppointment,
  updateAppointment, updateAppointmentStatus, deleteAppointment,
} from './appointments.service.js'
import { CreateAppointmentDTO, UpdateAppointmentDTO, UpdateAppointmentStatusDTO, AppointmentResponseDTO } from './appointments.dto.js'

export const getAll = async (req: Request, res: Response) => {
  const result = await findAllAppointments(prisma, req.empresaId!, req.validatedQuery as any)
  return ApiResponse.success(res, { ...result, data: result.data.map(i => new AppointmentResponseDTO(i)) })
}

export const getOne = async (req: Request, res: Response) => {
  const item = await findAppointmentById(prisma, req.params.id, req.empresaId!)
  return ApiResponse.success(res, new AppointmentResponseDTO(item))
}

export const create = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string
  const item = await createAppointment(prisma, req.empresaId!, userId, new CreateAppointmentDTO(req.body))
  return ApiResponse.created(res, new AppointmentResponseDTO(item), 'Cita creada')
}

export const update = async (req: Request, res: Response) => {
  const item = await updateAppointment(prisma, req.params.id, req.empresaId!, new UpdateAppointmentDTO(req.body))
  return ApiResponse.success(res, new AppointmentResponseDTO(item), 'Cita actualizada')
}

export const updateStatus = async (req: Request, res: Response) => {
  const dto = new UpdateAppointmentStatusDTO(req.body)
  const item = await updateAppointmentStatus(prisma, req.params.id, req.empresaId!, dto.status)
  return ApiResponse.success(res, new AppointmentResponseDTO(item), 'Estado de cita actualizado')
}

export const remove = async (req: Request, res: Response) => {
  await deleteAppointment(prisma, req.params.id, req.empresaId!)
  return ApiResponse.success(res, null, 'Cita eliminada')
}
