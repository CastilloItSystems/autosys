// backend/src/shared/utils/pagination.ts

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginationResult {
  skip: number
  take: number
  page: number
  limit: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export class PaginationHelper {
  static readonly DEFAULT_PAGE = 1
  static readonly DEFAULT_LIMIT = 10
  static readonly MAX_LIMIT = 100

  static validateAndParse(params: PaginationParams): PaginationResult {
    let page = parseInt(String(params.page || this.DEFAULT_PAGE))
    let limit = parseInt(String(params.limit || this.DEFAULT_LIMIT))

    // Validar página
    if (isNaN(page) || page < 1) {
      page = this.DEFAULT_PAGE
    }

    // Validar límite
    if (isNaN(limit) || limit < 1) {
      limit = this.DEFAULT_LIMIT
    }

    if (limit > this.MAX_LIMIT) {
      limit = this.MAX_LIMIT
    }

    const skip = (page - 1) * limit

    return {
      skip,
      take: limit,
      page,
      limit,
    }
  }

  static getMeta(page: number, limit: number, total: number): PaginationMeta {
    const totalPages = Math.ceil(total / limit)

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    }
  }

  static getOffset(page: number, limit: number): number {
    return (page - 1) * limit
  }
}
