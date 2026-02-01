import { Request, Response } from 'express'
import prisma from '../services/prisma.service.js'

export const getAllEmpresas = async (req: Request, res: Response) => {
  try {
    const empresas = await prisma.empresa.findMany({
      where: {
        eliminado: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    res.json(empresas)
  } catch (error) {
    console.error('Error obteniendo empresas:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const createEmpresa = async (req: Request, res: Response) => {
  try {
    const empresaData = req.body

    // Si es predeterminada, quitar predeterminado de otras empresas
    if (empresaData.predeter) {
      await prisma.empresa.updateMany({
        where: { predeter: true },
        data: { predeter: false },
      })
    }

    const newEmpresa = await prisma.empresa.create({
      data: empresaData,
    })

    res.status(201).json(newEmpresa)
  } catch (error) {
    console.error('Error creando empresa:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getEmpresaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const empresa = await prisma.empresa.findUnique({
      where: { id_empresa: id },
    })

    if (!empresa || empresa.eliminado) {
      return res.status(404).json({ error: 'Empresa no encontrada' })
    }

    res.json(empresa)
  } catch (error) {
    console.error('Error obteniendo empresa:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const updateEmpresa = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updateData = req.body

    // Verificar que la empresa existe
    const existingEmpresa = await prisma.empresa.findUnique({
      where: { id_empresa: id },
    })

    if (!existingEmpresa || existingEmpresa.eliminado) {
      return res.status(404).json({ error: 'Empresa no encontrada' })
    }

    // Si se está marcando como predeterminada, quitar predeterminado de otras
    if (updateData.predeter) {
      await prisma.empresa.updateMany({
        where: {
          predeter: true,
          id_empresa: { not: id },
        },
        data: { predeter: false },
      })
    }

    const updatedEmpresa = await prisma.empresa.update({
      where: { id_empresa: id },
      data: updateData,
    })

    res.json(updatedEmpresa)
  } catch (error) {
    console.error('Error actualizando empresa:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const deleteEmpresa = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Verificar que la empresa existe
    const existingEmpresa = await prisma.empresa.findUnique({
      where: { id_empresa: id },
    })

    if (!existingEmpresa || existingEmpresa.eliminado) {
      return res.status(404).json({ error: 'Empresa no encontrada' })
    }

    // Soft delete
    const deletedEmpresa = await prisma.empresa.update({
      where: { id_empresa: id },
      data: { eliminado: true },
    })

    res.json({ message: 'Empresa eliminada exitosamente' })
  } catch (error) {
    console.error('Error eliminando empresa:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getEmpresaPredeterminada = async (req: Request, res: Response) => {
  try {
    const empresa = await prisma.empresa.findFirst({
      where: {
        predeter: true,
        eliminado: false,
      },
    })

    if (!empresa) {
      return res.status(404).json({ error: 'No hay empresa predeterminada' })
    }

    res.json(empresa)
  } catch (error) {
    console.error('Error obteniendo empresa predeterminada:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
