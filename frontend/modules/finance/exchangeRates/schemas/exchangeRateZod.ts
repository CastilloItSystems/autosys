// libs/zods/finance/exchangeRateZod.ts
import { z } from 'zod'

export const createExchangeRateSchema = z.object({
  fromCurrency: z.enum(['USD', 'VES', 'EUR'], {
    required_error: 'La moneda de origen es requerida',
  }),
  toCurrency: z.enum(['USD', 'VES', 'EUR'], {
    required_error: 'La moneda de destino es requerida',
  }),
  rate: z
    .number({ required_error: 'La tasa es requerida' })
    .positive({ message: 'La tasa debe ser mayor a 0' }),
  rateDate: z.string().min(1, 'La fecha de la tasa es requerida'),
  notes: z.string().max(500).optional(),
}).refine((d) => d.fromCurrency !== d.toCurrency, {
  message: 'La moneda de origen y destino deben ser distintas',
  path: ['toCurrency'],
})

export type CreateExchangeRateFormValues = z.infer<typeof createExchangeRateSchema>
