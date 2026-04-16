'use client'

import React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Toast } from 'primereact/toast'

import loyaltyService from '@/app/api/crm/loyaltyService'
import { handleFormError } from '@/utils/errorHandlers'

type LoyaltyFormValues = {
  type: 'EVENT' | 'SURVEY'
  customerId: string
  eventType: string
  title?: string
  description?: string
  suggestedAction?: string
  score?: number
  feedback?: string
}

interface LoyaltyFormProps {
  formId?: string
  onSave: () => void | Promise<void>
  onSubmittingChange?: (isSubmitting: boolean) => void
  toast: React.RefObject<Toast> | null
}

const typeOptions = [
  { label: 'Evento', value: 'EVENT' },
  { label: 'Encuesta', value: 'SURVEY' },
]

const eventTypeOptions = [
  { label: 'NPS enviado', value: 'NPS_SENT' },
  { label: 'NPS recibido', value: 'NPS_RECEIVED' },
  { label: 'Recordatorio mantenimiento', value: 'MAINTENANCE_REMINDER' },
  { label: 'Reactivación', value: 'REACTIVATION_CONTACT' },
  { label: 'Seguimiento', value: 'FOLLOW_UP' },
]

export default function LoyaltyForm({ formId, onSave, onSubmittingChange, toast }: LoyaltyFormProps) {
  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<LoyaltyFormValues>({
    mode: 'onBlur',
    defaultValues: {
      type: 'EVENT',
      customerId: '',
      eventType: 'FOLLOW_UP',
      title: '',
      description: '',
      suggestedAction: '',
      score: undefined,
      feedback: '',
    },
  })

  const type = watch('type')

  const onSubmit = async (data: LoyaltyFormValues) => {
    if (onSubmittingChange) onSubmittingChange(true)
    try {
      if (data.type === 'EVENT') {
        await loyaltyService.create({
          type: 'EVENT',
          customerId: data.customerId,
          eventType: data.eventType,
          title: data.title || 'Evento de fidelización',
          description: data.description || undefined,
          suggestedAction: data.suggestedAction || undefined,
        })
      } else {
        await loyaltyService.create({
          type: 'SURVEY',
          customerId: data.customerId,
          source: 'NPS',
          score: data.score,
          feedback: data.feedback || undefined,
        })
      }

      await onSave()
    } catch (error) {
      handleFormError(error, toast)
    } finally {
      if (onSubmittingChange) onSubmittingChange(false)
    }
  }

  return (
    <form id={formId || 'loyalty-form'} onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="grid formgrid">
        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Tipo *</label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={typeOptions}
                optionLabel="label"
                optionValue="value"
              />
            )}
          />
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Customer ID *</label>
          <InputText
            {...register('customerId', { required: 'customerId requerido' })}
            className={errors.customerId ? 'p-invalid' : ''}
          />
          {errors.customerId && <small className="p-error">{errors.customerId.message}</small>}
        </div>

        {type === 'EVENT' ? (
          <>
            <div className="col-12 md:col-6 field">
              <label className="font-semibold">Tipo de evento</label>
              <Controller
                name="eventType"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={eventTypeOptions}
                    optionLabel="label"
                    optionValue="value"
                  />
                )}
              />
            </div>
            <div className="col-12 md:col-6 field">
              <label className="font-semibold">Título</label>
              <InputText {...register('title')} />
            </div>
            <div className="col-12 field">
              <label className="font-semibold">Descripción</label>
              <InputTextarea {...register('description')} rows={3} />
            </div>
            <div className="col-12 field mb-0">
              <label className="font-semibold">Acción sugerida</label>
              <InputText {...register('suggestedAction')} />
            </div>
          </>
        ) : (
          <>
            <div className="col-12 md:col-4 field">
              <label className="font-semibold">Puntaje NPS</label>
              <InputText
                {...register('score', {
                  setValueAs: (v) => (v === '' || v == null ? undefined : Number(v)),
                })}
              />
            </div>
            <div className="col-12 field mb-0">
              <label className="font-semibold">Feedback</label>
              <InputTextarea {...register('feedback')} rows={3} />
            </div>
          </>
        )}
      </div>
    </form>
  )
}
