// backend/src/features/workshop/vehicleHistory/vehicleHistory.controller.ts
import type { Request, Response } from 'express'
import prisma from '../../../services/prisma.service.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import { getVehicleHistory } from './vehicleHistory.service.js'

export const getHistory = async (req: Request, res: Response) => {
  const result = await getVehicleHistory(prisma, req.params.vehicleId as string, req.empresaId!)
  return ApiResponse.success(res, result)
}
