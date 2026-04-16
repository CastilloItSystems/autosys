import { PrismaClient, Prisma } from '../../../generated/prisma/client.js'
import { PaginationHelper } from '../../../shared/utils/pagination.js'
import { CreateCampaignDTO } from './campaigns.dto.js'
import { ICampaign, ICampaignFilters } from './campaigns.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

class CampaignsService {
  async create(db: PrismaClientType, empresaId: string, userId: string, dto: CreateCampaignDTO): Promise<ICampaign> {
    const row = await (db as PrismaClient).campaign.create({
      data: {
        empresaId,
        name: dto.name,
        description: dto.description ?? null,
        status: (dto.status as any) ?? 'DRAFT',
        channel: dto.channel as any,
        budget: dto.budget ?? null,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        createdBy: userId,
      },
    })

    return row as unknown as ICampaign
  }

  async findAll(
    db: PrismaClientType,
    empresaId: string,
    filters: ICampaignFilters,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): Promise<{ data: ICampaign[]; total: number }> {
    const { skip, take } = PaginationHelper.validateAndParse({ page, limit })
    const where: Prisma.CampaignWhereInput = { empresaId }

    if (filters.status) where.status = filters.status as any
    if (filters.channel) where.channel = filters.channel as any
    if (filters.search) {
      const search = filters.search.trim()
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const validSortFields = new Set(['createdAt', 'updatedAt', 'name', 'startsAt'])
    const safeSortBy = validSortFields.has(sortBy) ? sortBy : 'createdAt'

    const [data, total] = await Promise.all([
      (db as PrismaClient).campaign.findMany({
        where,
        orderBy: { [safeSortBy]: sortOrder },
        skip,
        take,
      }),
      (db as PrismaClient).campaign.count({ where }),
    ])

    return { data: data as unknown as ICampaign[], total }
  }
}

export default new CampaignsService()
