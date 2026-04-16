'use client'

import React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Calendar } from 'primereact/calendar'
import { Dropdown } from 'primereact/dropdown'
import { Toast } from 'primereact/toast'

import opportunityService from '@/app/api/crm/opportunityService'
import { handleFormError } from '@/utils/errorHandlers'

type OpportunityFormValues = {
  title: string
  channel: 'REPUESTOS' | 'TALLER' | 'VEHICULOS'
  amount?: number
  description?: string
  nextActivityAt: Date | null
  expectedCloseAt: Date | null
  ownerId?: string
}

interface OpportunityFormProps {
  formId?: string
  onSave: () => void | Promise<void>
  onSubmittingChange?: (isSubmitting: boolean) => void
  toast: React.RefObject<Toast> | null
}

const channelOptions = [
  { label: 'Repuestos', value: 'REPUESTOS' },
  { label: 'Taller', value: 'TALLER' },
  { label: 'Vehículos', value: 'VEHICULOS' },
]

export default function OpportunityForm({
  formId,
  onSave,
  onSubmittingChange,
  toast,
}: OpportunityFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OpportunityFormValues>({
    mode: 'onBlur',
    defaultValues: {
      title: '',
      channel: 'REPUESTOS',
      amount: undefined,
      description: '',
      nextActivityAt: null,
      expectedCloseAt: null,
      ownerId: '',
    },
  })

  const onSubmit = async (data: OpportunityFormValues) => {
    if (onSubmittingChange) onSubmittingChange(true)
    try {
      if (!data.nextActivityAt) {
        throw new Error('La próxima actividad es obligatoria')
      }

      await opportunityService.create({
        title: data.title.trim(),
        channel: data.channel,
        amount: data.amount,
        description: data.description || undefined,
        nextActivityAt: data.nextActivityAt.toISOString(),
        expectedCloseAt: data.expectedCloseAt ? data.expectedCloseAt.toISOString() : undefined,
        ownerId: data.ownerId || undefined,
      })

      await onSave()
    } catch (error) {
      handleFormError(error, toast)
    } finally {
      if (onSubmittingChange) onSubmittingChange(false)
    }
  }

  return (
    <form id={formId || 'opportunity-form'} onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="grid formgrid">
        <div className="col-12 field">
          <label className="font-semibold">Título *</label>
          <InputText
            {...register('title', { required: 'Título requerido' })}
            className={errors.title ? 'p-invalid' : ''}
            placeholder="Ej: Oportunidad de mantenimiento preventivo"
          />
          {errors.title && <small className="p-error">{errors.title.message}</small>}
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Canal *</label>
          <Controller
            name="channel"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={channelOptions}
                optionLabel="label"
                optionValue="value"
              />
            )}
          />
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Monto</label>
          <InputText
            {...register('amount', {
              setValueAs: (v) => (v === '' || v == null ? undefined : Number(v)),
            })}
            placeholder="0.00"
          />
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Próxima actividad *</label>
          <Controller
            name="nextActivityAt"
            control={control}
            rules={{ required: 'Próxima actividad requerida' }}
            render={({ field }) => (
              <Calendar
                value={field.value}
                onChange={(e) => field.onChange((e.value as Date) || null)}
                showIcon
                showTime
                hourFormat="24"
                className={errors.nextActivityAt ? 'p-invalid w-full' : 'w-full'}
              />
            )}
          />
          {errors.nextActivityAt && <small className="p-error">{errors.nextActivityAt.message}</small>}
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Cierre esperado</label>
          <Controller
            name="expectedCloseAt"
            control={control}
            render={({ field }) => (
              <Calendar
                value={field.value}
                onChange={(e) => field.onChange((e.value as Date) || null)}
                showIcon
                className="w-full"
              />
            )}
          />
        </div>

        <div className="col-12 field">
          <label className="font-semibold">Owner ID (opcional)</label>
          <InputText {...register('ownerId')} placeholder="UUID del responsable" />
        </div>

        <div className="col-12 field mb-0">
          <label className="font-semibold">Descripción</label>
          <InputTextarea {...register('description')} rows={3} />
        </div>
      </div>
    </form>
  )
}
