import { Prisma, PrismaClient } from '../../../generated/prisma/client.js'
import { logger } from '../../../shared/utils/logger.js'
import { UpsertDealerPolicyDTO } from './config.dto.js'
import { IDealerPolicy, IResolvedDealerPolicy } from './config.interface.js'

type PrismaClientType = PrismaClient | Prisma.TransactionClient

/** Valores por defecto (deben coincidir con dealerPolicy.prisma). */
const DEFAULTS: IResolvedDealerPolicy = {
  quoteValidityDays: 15,
  reservationValidityDays: 7,
  minDepositAmount: null,
  minDepositPct: null,
  maxDiscountPctAdvisor: 0,
  maxDiscountPctSupervisor: 5,
  maxDiscountPctManager: 10,
  requireTestDrive: false,
  requireAppraisalForTradeIn: true,
  requireDepositForReservation: true,
  leadFollowUpSlaHours: 48,
  commissionPctDefault: 0,
  alertWindowHours: 48,
}

class DealerConfigService {
  /** Política persistida o null si la empresa aún no configuró. */
  async findRaw(empresaId: string, db: PrismaClientType): Promise<IDealerPolicy | null> {
    const policy = await (db as PrismaClient).dealerPolicy.findUnique({ where: { empresaId } })
    return policy as unknown as IDealerPolicy | null
  }

  /** Para el endpoint GET: devuelve la política o una con defaults (no persiste). */
  async get(empresaId: string, db: PrismaClientType): Promise<IDealerPolicy> {
    const policy = await this.findRaw(empresaId, db)
    if (policy) return policy
    const now = new Date()
    return {
      id: 'default',
      empresaId,
      ...DEFAULTS,
      notes: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    } as unknown as IDealerPolicy
  }

  /** Política resuelta a números planos con defaults — usada por reglas de negocio. */
  async resolve(empresaId: string, db: PrismaClientType): Promise<IResolvedDealerPolicy> {
    const policy = await this.findRaw(empresaId, db)
    if (!policy) return { ...DEFAULTS }
    const num = (v: unknown, fallback: number | null): number | null =>
      v === null || v === undefined ? fallback : Number(v)
    return {
      quoteValidityDays: Number(policy.quoteValidityDays ?? DEFAULTS.quoteValidityDays),
      reservationValidityDays: Number(policy.reservationValidityDays ?? DEFAULTS.reservationValidityDays),
      minDepositAmount: num(policy.minDepositAmount, DEFAULTS.minDepositAmount),
      minDepositPct: num(policy.minDepositPct, DEFAULTS.minDepositPct),
      maxDiscountPctAdvisor: Number(num(policy.maxDiscountPctAdvisor, DEFAULTS.maxDiscountPctAdvisor)),
      maxDiscountPctSupervisor: Number(num(policy.maxDiscountPctSupervisor, DEFAULTS.maxDiscountPctSupervisor)),
      maxDiscountPctManager: Number(num(policy.maxDiscountPctManager, DEFAULTS.maxDiscountPctManager)),
      requireTestDrive: Boolean(policy.requireTestDrive),
      requireAppraisalForTradeIn: Boolean(policy.requireAppraisalForTradeIn),
      requireDepositForReservation: Boolean(policy.requireDepositForReservation),
      leadFollowUpSlaHours: Number(policy.leadFollowUpSlaHours ?? DEFAULTS.leadFollowUpSlaHours),
      commissionPctDefault: Number(num(policy.commissionPctDefault, DEFAULTS.commissionPctDefault)),
      alertWindowHours: Number(policy.alertWindowHours ?? DEFAULTS.alertWindowHours),
    }
  }

  async upsert(data: UpsertDealerPolicyDTO, empresaId: string, userId: string, db: PrismaClientType): Promise<IDealerPolicy> {
    const writable = {
      ...(data.quoteValidityDays !== undefined ? { quoteValidityDays: data.quoteValidityDays } : {}),
      ...(data.reservationValidityDays !== undefined ? { reservationValidityDays: data.reservationValidityDays } : {}),
      ...(data.minDepositAmount !== undefined ? { minDepositAmount: data.minDepositAmount } : {}),
      ...(data.minDepositPct !== undefined ? { minDepositPct: data.minDepositPct } : {}),
      ...(data.maxDiscountPctAdvisor !== undefined ? { maxDiscountPctAdvisor: data.maxDiscountPctAdvisor } : {}),
      ...(data.maxDiscountPctSupervisor !== undefined ? { maxDiscountPctSupervisor: data.maxDiscountPctSupervisor } : {}),
      ...(data.maxDiscountPctManager !== undefined ? { maxDiscountPctManager: data.maxDiscountPctManager } : {}),
      ...(data.requireTestDrive !== undefined ? { requireTestDrive: data.requireTestDrive } : {}),
      ...(data.requireAppraisalForTradeIn !== undefined ? { requireAppraisalForTradeIn: data.requireAppraisalForTradeIn } : {}),
      ...(data.requireDepositForReservation !== undefined ? { requireDepositForReservation: data.requireDepositForReservation } : {}),
      ...(data.leadFollowUpSlaHours !== undefined ? { leadFollowUpSlaHours: data.leadFollowUpSlaHours } : {}),
      ...(data.commissionPctDefault !== undefined ? { commissionPctDefault: data.commissionPctDefault } : {}),
      ...(data.alertWindowHours !== undefined ? { alertWindowHours: data.alertWindowHours } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    }

    const policy = await (db as PrismaClient).dealerPolicy.upsert({
      where: { empresaId },
      create: { empresaId, ...writable },
      update: writable,
    })

    logger.info('Dealer policy actualizada', { empresaId, userId })
    return policy as unknown as IDealerPolicy
  }
}

export default new DealerConfigService()
