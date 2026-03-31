// backend/src/features/workshop/integrations/diagnosis-templates-manager.service.ts
// FASE 3.2: Utility service to link diagnostic findings to templates
// Helps technicians populate diagnosis with standardized template questions

import type { PrismaClient } from '../../../generated/prisma/client.js'
import type {
  ChecklistTemplate,
  ChecklistItem,
  ServiceDiagnosis,
} from '../../../generated/prisma/client.js'

/**
 * Get diagnostic template recommendations based on service type
 * Returns checklist items that should be answered during diagnosis
 */
export async function getRecommendedDiagnosticTemplate(
  prisma: PrismaClient,
  serviceTypeCode: string
): Promise<(ChecklistTemplate & { items: ChecklistItem[] }) | null> {
  // Map service types to diagnostic template codes
  const templateCodeMap: Record<string, string> = {
    'MAINT-PREVENTIVO': 'DIAG-MAINT-PREVENTIVO',
    FRENOS: 'DIAG-FRENOS',
    SUSPENSION: 'DIAG-SUSPENSION',
    MOTOR: 'DIAG-MOTOR',
    TRANSMISION: 'DIAG-TRANSMISION',
    ELECTRICO: 'DIAG-ELECTRICO',
    'AIRE-ACONDICIONADO': 'DIAG-AIRE-ACONDICIONADO',
    'ALINEO-BALANCEO': 'DIAG-ALINEO-BALANCEO',
    LLANTAS: 'DIAG-LLANTAS',
  }

  const templateCode = templateCodeMap[serviceTypeCode]
  if (!templateCode) return null

  return prisma.checklistTemplate.findFirst({
    where: { code: templateCode },
    include: { items: { orderBy: { order: 'asc' } } },
  })
}

/**
 * Get all available diagnostic templates
 * Useful for the UI to allow technician to select which checklist to use
 */
export async function getAllDiagnosticTemplates(
  prisma: PrismaClient
): Promise<(ChecklistTemplate & { items: ChecklistItem[] })[]> {
  return prisma.checklistTemplate.findMany({
    where: { category: 'DIAGNOSIS' },
    include: { items: { orderBy: { order: 'asc' } } },
    orderBy: { code: 'asc' },
  })
}

/**
 * Get a specific diagnostic template by code
 */
export async function getDiagnosticTemplateByCode(
  prisma: PrismaClient,
  templateCode: string
): Promise<(ChecklistTemplate & { items: ChecklistItem[] }) | null> {
  return prisma.checklistTemplate.findFirst({
    where: { code: templateCode, category: 'DIAGNOSIS' },
    include: { items: { orderBy: { order: 'asc' } } },
  })
}

/**
 * Helper to batch-create checklist responses from diagnosis findings
 * Used to populate diagnosis findings from a template response
 */
export interface DiagnosisTemplateResponse {
  checklistItemId: string
  responseBool?: boolean
  responseText?: string
  responseNumber?: number
  responseSelection?: string
}

export async function populateDiagnosisFromTemplate(
  prisma: PrismaClient,
  diagnosisId: string,
  templateResponses: DiagnosisTemplateResponse[]
): Promise<void> {
  // Future: When ServiceDiagnosis model supports checklist responses,
  // this function will create records to link template answers to diagnosis
  // For now, this is a placeholder for future integration

  console.log(
    `Diagnosis ${diagnosisId} could be populated with ${templateResponses.length} responses`
  )
}

/**
 * Get template statistics (optional feature for dashboards)
 * Shows how many items per template category
 */
export async function getDiagnosticTemplateStats(prisma: PrismaClient): Promise<
  Array<{
    templateCode: string
    templateName: string
    itemCount: number
    requiredCount: number
  }>
> {
  const templates = await prisma.checklistTemplate.findMany({
    where: { category: 'DIAGNOSIS' },
    include: { items: true },
  })

  return templates.map((t) => ({
    templateCode: t.code,
    templateName: t.name,
    itemCount: t.items.length,
    requiredCount: t.items.filter((i) => i.isRequired).length,
  }))
}
