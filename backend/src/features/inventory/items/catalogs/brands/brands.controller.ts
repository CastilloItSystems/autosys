// backend/src/features/inventory/items/catalogs/brands/brands.controller.ts

import { Request, Response, NextFunction } from 'express'
import { BrandService } from './brands.service'
import {
  CreateBrandDTO,
  UpdateBrandDTO,
  BrandResponseDTO,
  BrandListResponseDTO,
  BrandGroupedResponseDTO,
  BrandSimpleDTO,
} from './brands.dto'
import { IBrandFilters, BrandType } from './brands.interface'

export class BrandController {
  private service: BrandService

  constructor() {
    this.service = new BrandService()
  }

  // ============================================
  // CREATE
  // ============================================
  createBrand = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = new CreateBrandDTO(req.body)
      const brand = await this.service.createBrand(dto)
      const response = new BrandResponseDTO(brand)

      res.status(201).json({
        success: true,
        message: 'Marca creada exitosamente',
        data: response,
      })
    } catch (error) {
      next(error)
    }
  }

  // ============================================
  // GET BY ID
  // ============================================
  getBrandById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as { id: string }
      const brand = await this.service.getBrandById(id)
      const response = new BrandResponseDTO(brand)

      res.json({
        success: true,
        data: response,
      })
    } catch (error) {
      next(error)
    }
  }

  // ============================================
  // GET ALL CON FILTROS
  // ============================================
  getBrands = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters: IBrandFilters = {}

      if (req.query.search) filters.search = req.query.search as string
      if (req.query.type) filters.type = req.query.type as BrandType
      if (req.query.isActive === 'true') filters.isActive = true
      if (req.query.isActive === 'false') filters.isActive = false

      filters.page = parseInt(req.query.page as string) || 1
      filters.limit = parseInt(req.query.limit as string) || 10

      const result = await this.service.getBrands(filters)
      const response = new BrandListResponseDTO(result)

      res.json({
        success: true,
        data: response,
      })
    } catch (error) {
      next(error)
    }
  }

  // ============================================
  // GET AGRUPADO POR TIPO
  // ============================================
  getBrandsGrouped = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const filters: { search?: string; isActive?: boolean } = {}
      if (req.query.search) filters.search = req.query.search as string
      if (req.query.isActive === 'true') filters.isActive = true
      if (req.query.isActive === 'false') filters.isActive = false

      const groups = await this.service.getBrandsGroupedByType(filters)
      const response = new BrandGroupedResponseDTO({ groups })

      res.json({
        success: true,
        data: response,
      })
    } catch (error) {
      next(error)
    }
  }

  // ============================================
  // GET ACTIVAS (PARA SELECTS)
  // ============================================
  getActiveBrands = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = req.query.type as BrandType | undefined
      const brands = await this.service.getActiveBrands(type)
      const response = brands.map((brand) => new BrandSimpleDTO(brand))

      res.json({
        success: true,
        data: response,
      })
    } catch (error) {
      next(error)
    }
  }

  // ============================================
  // SEARCH
  // ============================================
  searchBrands = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query.q as string
      const type = req.query.type as BrandType | undefined

      if (!query || query.length < 2) {
        return res.json({
          success: true,
          data: [],
        })
      }

      const brands = await this.service.searchBrands(query, type)
      const response = brands.map((brand) => new BrandResponseDTO(brand))

      res.json({
        success: true,
        data: response,
      })
    } catch (error) {
      next(error)
    }
  }

  // ============================================
  // UPDATE
  // ============================================
  updateBrand = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as { id: string }
      const dto = new UpdateBrandDTO(req.body)
      const brand = await this.service.updateBrand(id, dto)
      const response = new BrandResponseDTO(brand)

      res.json({
        success: true,
        message: 'Marca actualizada exitosamente',
        data: response,
      })
    } catch (error) {
      next(error)
    }
  }

  // ============================================
  // DELETE (SOFT)
  // ============================================
  deleteBrand = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as { id: string }
      await this.service.deleteBrand(id)

      res.json({
        success: true,
        message: 'Marca desactivada exitosamente',
      })
    } catch (error) {
      next(error)
    }
  }

  // ============================================
  // DELETE (HARD)
  // ============================================
  deleteBrandPermanently = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params as { id: string }
      await this.service.deleteBrandPermanently(id)

      res.json({
        success: true,
        message: 'Marca eliminada permanentemente',
      })
    } catch (error) {
      next(error)
    }
  }

  // ============================================
  // REACTIVAR
  // ============================================
  reactivateBrand = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as { id: string }
      const brand = await this.service.reactivateBrand(id)
      const response = new BrandResponseDTO(brand)

      res.json({
        success: true,
        message: 'Marca reactivada exitosamente',
        data: response,
      })
    } catch (error) {
      next(error)
    }
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================
  getBrandStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.service.getBrandStats()

      res.json({
        success: true,
        data: stats,
      })
    } catch (error) {
      next(error)
    }
  }
}
