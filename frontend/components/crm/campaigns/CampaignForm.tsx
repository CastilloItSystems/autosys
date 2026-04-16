'use client'

import React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Dropdown } from 'primereact/dropdown'
import { Toast } from 'primereact/toast'

import campaignService from '@/app/api/crm/campaignService'
import { CAMPAIGN_CHANNEL_OPTIONS, CAMPAIGN_STATUS_OPTIONS } from '@/libs/interfaces/crm/campaign.interface'
import { handleFormError } from '@/utils/errorHandlers'

type CampaignFormValues = {
  name: string
  description?: string
  status: string
  channel: string
  budget?: number
}

interface CampaignFormProps {
  formId?: string
  onSave: () => void | Promise<void>
  onSubmittingChange?: (isSubmitting: boolean) => void
  toast: React.RefObject<Toast> | null
}

export default function CampaignForm({ formId, onSave, onSubmittingChange, toast }: CampaignFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CampaignFormValues>({
    mode: 'onBlur',
    defaultValues: {
      name: '',
      description: '',
      status: 'DRAFT',
      channel: 'OTHER',
      budget: undefined,
    },
  })

  const onSubmit = async (data: CampaignFormValues) => {
    if (onSubmittingChange) onSubmittingChange(true)
    try {
      await campaignService.create({
        name: data.name.trim(),
        description: data.description || undefined,
        status: data.status,
        channel: data.channel,
        budget: data.budget,
      })
      await onSave()
    } catch (error) {
      handleFormError(error, toast)
    } finally {
      if (onSubmittingChange) onSubmittingChange(false)
    }
  }

  return (
    <form id={formId || 'campaign-form'} onSubmit={handleSubmit(onSubmit)} className="p-fluid">
      <div className="grid formgrid">
        <div className="col-12 field">
          <label className="font-semibold">Nombre *</label>
          <InputText
            {...register('name', { required: 'Nombre requerido' })}
            className={errors.name ? 'p-invalid' : ''}
          />
          {errors.name && <small className="p-error">{errors.name.message}</small>}
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Estado</label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={CAMPAIGN_STATUS_OPTIONS}
                optionLabel="label"
                optionValue="value"
              />
            )}
          />
        </div>

        <div className="col-12 md:col-6 field">
          <label className="font-semibold">Canal</label>
          <Controller
            name="channel"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={CAMPAIGN_CHANNEL_OPTIONS}
                optionLabel="label"
                optionValue="value"
              />
            )}
          />
        </div>

        <div className="col-12 field">
          <label className="font-semibold">Presupuesto</label>
          <InputText
            {...register('budget', {
              setValueAs: (v) => (v === '' || v == null ? undefined : Number(v)),
            })}
            placeholder="0.00"
          />
        </div>

        <div className="col-12 field mb-0">
          <label className="font-semibold">Descripción</label>
          <InputTextarea {...register('description')} rows={3} />
        </div>
      </div>
    </form>
  )
}
