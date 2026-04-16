import { Request, Response } from 'express'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.middleware.js'
import { ApiResponse } from '../../../shared/utils/apiResponse.js'
import itemService from '../../inventory/items/items.service.js'
import { findAllWorkshopOperations } from '../workshopOperations/workshopOperations.service.js'

export const searchUnifiedCatalog = asyncHandler(
  async (req: Request, res: Response) => {
    const { empresaId, prisma } = req
    const q = (req.query.q as string) || ''
    const limit = parseInt(req.query.limit as string) || 10

    // 1. Search in Inventory Items (PARTS)
    const itemsResult = await itemService.search(empresaId, q, limit, prisma)

    // 2. Search in Workshop Operations (LABOR)
    const operationsResult = await findAllWorkshopOperations(
      prisma,
      empresaId,
      {
        search: q,
        isActive: true,
        limit,
        page: 1,
        sortBy: 'name',
        sortOrder: 'asc',
      }
    )

    // 3. Map to unified interface
    const unifiedList: any[] = []

    for (const item of itemsResult) {
      unifiedList.push({
        id: item.id,
        code: item.code,
        name: item.name,
        type: 'PART',
        price: Number(item.salePrice || 0),
        cost: Number(item.costPrice || 0),
        taxType: (item as any).taxType || 'IVA',
        taxRate: Number((item as any).taxRate || 0.16),
        suggestedItems: [],
      })
    }

    for (const op of operationsResult.data) {
      const suggestedItems =
        op.suggestedMaterials?.map((sm: any) => ({
          itemId: sm.itemId,
          code: sm.item?.code || null,
          sku: sm.item?.sku || null,
          name: sm.item?.name || sm.description || null,
          description: sm.description,
          quantity: Number(sm.quantity),
          isRequired: sm.isRequired,
          notes: sm.notes,
          unitPrice: sm.item ? Number(sm.item.salePrice || 0) : 0,
          unitCost: sm.item ? Number(sm.item.costPrice || 0) : 0,
          taxType: sm.item?.taxType || 'IVA',
          taxRate: sm.item ? Number(sm.item.taxRate || 0.16) : 0.16,
        })) || []

      unifiedList.push({
        id: op.id,
        code: op.code,
        name: op.name,
        type: 'LABOR',
        price: Number(op.listPrice || 0),
        cost: Number(op.costPrice || 0),
        taxType: (op as any).taxType || 'IVA',
        taxRate: Number((op as any).taxRate || 0.16),
        suggestedItems,
      })
    }

    // 4. Sort consolidated list by name
    unifiedList.sort((a, b) => a.name.localeCompare(b.name))

    res.json(
      ApiResponse.success(res, unifiedList, 'Resultados del catálogo unificado')
    )
  }
)
