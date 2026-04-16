'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Toast } from 'primereact/toast'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { Tag } from 'primereact/tag'
import { Dialog } from 'primereact/dialog'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'

import opportunityService from '@/app/api/crm/opportunityService'
import { Opportunity, OPPORTUNITY_CHANNEL_CONFIG, OPPORTUNITY_STATUS_CONFIG } from '@/libs/interfaces/crm/opportunity.interface'
import CreateButton from '@/components/common/CreateButton'
import FormActionButtons from '@/components/common/FormActionButtons'
import OpportunityForm from './OpportunityForm'

type View = 'kanban' | 'list'

const CHANNEL_OPTIONS = [
  { label: 'Todos', value: '' },
  { label: 'Repuestos', value: 'REPUESTOS' },
  { label: 'Taller', value: 'TALLER' },
  { label: 'Vehículos', value: 'VEHICULOS' },
]

const STATUS_OPTIONS = [
  { label: 'Todos', value: '' },
  { label: 'Abiertas', value: 'OPEN' },
  { label: 'Ganadas', value: 'WON' },
  { label: 'Perdidas', value: 'LOST' },
]

const STAGE_FLOW: Record<string, string[]> = {
  REPUESTOS: ['DISCOVERY', 'QUOTED', 'NEGOTIATION', 'COMMITTED'],
  TALLER: ['DIAGNOSIS', 'VALUATION', 'QUOTE_SENT', 'APPROVAL_PENDING'],
  VEHICULOS: ['CONTACT', 'TEST_DRIVE', 'PROPOSAL', 'NEGOTIATION'],
}

function getFlow(channel: string): string[] {
  return STAGE_FLOW[channel] ?? ['DISCOVERY', 'QUALIFIED', 'NEGOTIATION']
}

export default function OpportunityList() {
  const toast = useRef<Toast>(null)

  const [view, setView] = useState<View>('kanban')
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [list, setList] = useState<Opportunity[]>([])
  const [total, setTotal] = useState(0)

  const [page, setPage] = useState(0)
  const [rows, setRows] = useState(20)
  const [channel, setChannel] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailData, setDetailData] = useState<any>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await opportunityService.getAll({
        page: page + 1,
        limit: rows,
        channel: channel || undefined,
        status: status || undefined,
        search: search || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      const raw = (res as any)?.data ?? res
      setList(raw.data ?? raw)
      setTotal(raw.meta?.total ?? raw.length ?? 0)
    } catch {
      toast.current?.show({ severity: 'error', summary: 'No se pudieron cargar oportunidades' })
    } finally {
      setLoading(false)
    }
  }, [page, rows, channel, status, search])

  useEffect(() => {
    load()
  }, [load])

  const flowForCurrentChannel = useMemo(() => getFlow(channel || 'REPUESTOS'), [channel])

  const groupedByStage = useMemo(() => {
    const flow = flowForCurrentChannel
    const base: Record<string, Opportunity[]> = {}
    for (const stage of flow) base[stage] = []
    for (const row of list.filter((x) => x.status === 'OPEN')) {
      if (!base[row.stageCode]) base[row.stageCode] = []
      base[row.stageCode].push(row)
    }
    return base
  }, [list, flowForCurrentChannel])

  const handleSave = async () => {
    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Oportunidad creada correctamente',
      life: 3000,
    })
    setFormOpen(false)
    await load()
  }

  const moveStage = async (row: Opportunity, stageCode: string) => {
    try {
      await opportunityService.updateStage(row.id, stageCode)
      load()
    } catch (e: any) {
      toast.current?.show({ severity: 'error', summary: e?.response?.data?.message ?? 'No se pudo mover la etapa' })
    }
  }

  const closeOpportunity = async (row: Opportunity, result: 'WON' | 'LOST') => {
    if (result === 'LOST') {
      confirmDialog({
        message: `¿Marcar "${row.title}" como perdida?`,
        header: 'Cerrar oportunidad',
        icon: 'pi pi-exclamation-triangle',
        acceptClassName: 'p-button-danger',
        accept: async () => {
          try {
            await opportunityService.close(row.id, { result: 'LOST', lostReasonText: 'Cierre manual desde tablero' })
            load()
          } catch {
            toast.current?.show({ severity: 'error', summary: 'No se pudo cerrar la oportunidad' })
          }
        },
      })
      return
    }

    try {
      await opportunityService.close(row.id, { result: 'WON' })
      load()
    } catch {
      toast.current?.show({ severity: 'error', summary: 'No se pudo cerrar la oportunidad' })
    }
  }

  const openDetail = async (row: Opportunity) => {
    try {
      const res = await opportunityService.getById(row.id)
      setDetailData((res as any).data ?? res)
      setDetailOpen(true)
    } catch {
      toast.current?.show({ severity: 'error', summary: 'No se pudo abrir el detalle' })
    }
  }

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Oportunidades</h4>
        <span className="text-600 text-sm">({total} total)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Dropdown
          value={status}
          onChange={(e) => {
            setStatus(e.value)
            setPage(0)
          }}
          options={STATUS_OPTIONS}
          optionLabel="label"
          optionValue="value"
          placeholder="Estado"
          style={{ minWidth: '160px' }}
        />
        <Dropdown
          value={channel}
          onChange={(e) => {
            setChannel(e.value)
            setPage(0)
          }}
          options={CHANNEL_OPTIONS}
          optionLabel="label"
          optionValue="value"
          placeholder="Canal"
          style={{ minWidth: '160px' }}
        />
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            placeholder="Buscar..."
          />
        </span>
        <Button
          icon="pi pi-th-large"
          outlined={view !== 'kanban'}
          onClick={() => setView('kanban')}
          tooltip="Vista kanban"
        />
        <Button
          icon="pi pi-list"
          outlined={view !== 'list'}
          onClick={() => setView('list')}
          tooltip="Vista lista"
        />
        <CreateButton label="Nueva oportunidad" onClick={() => setFormOpen(true)} tooltip="Crear oportunidad" />
      </div>
    </div>
  )

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />

      {view === 'kanban' ? (
        <>
          <div className="mb-3">{header}</div>
          <div className="flex gap-3" style={{ overflowX: 'auto', paddingBottom: 8 }}>
            {flowForCurrentChannel.map((stage) => (
              <div key={stage} className="card" style={{ minWidth: 280, maxWidth: 280 }}>
                <div className="flex justify-content-between align-items-center mb-2">
                  <strong>{stage}</strong>
                  <Tag value={String(groupedByStage[stage]?.length ?? 0)} />
                </div>
                <div className="flex flex-column gap-2">
                  {(groupedByStage[stage] || []).map((row) => (
                    <div key={row.id} className="p-2 border-1 border-round border-200">
                      <div className="font-semibold text-sm mb-1">{row.title}</div>
                      <div className="flex justify-content-between align-items-center mb-2">
                        <Tag value={OPPORTUNITY_CHANNEL_CONFIG[row.channel as keyof typeof OPPORTUNITY_CHANNEL_CONFIG]?.label ?? row.channel} />
                        <span className="text-sm">{row.currency} {Number(row.amount ?? 0).toFixed(2)}</span>
                      </div>
                      <Dropdown
                        value={row.stageCode}
                        onChange={(e) => moveStage(row, e.value)}
                        options={flowForCurrentChannel.map((s) => ({ label: s, value: s }))}
                        optionLabel="label"
                        optionValue="value"
                        className="w-full"
                      />
                      <div className="flex gap-1 mt-2">
                        <Button icon="pi pi-check" text severity="success" tooltip="Ganada" onClick={() => closeOpportunity(row, 'WON')} />
                        <Button icon="pi pi-times" text severity="danger" tooltip="Perdida" onClick={() => closeOpportunity(row, 'LOST')} />
                        <Button icon="pi pi-eye" text tooltip="Detalle" onClick={() => openDetail(row)} />
                      </div>
                    </div>
                  ))}
                  {(groupedByStage[stage] || []).length === 0 && <small className="text-400">Sin oportunidades</small>}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <DataTable
          value={list}
          loading={loading}
          paginator
          lazy
          scrollable
          sortMode="multiple"
          rows={rows}
          first={page * rows}
          totalRecords={total}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPage={(e) => {
            setPage(e.page ?? 0)
            setRows(e.rows ?? 20)
          }}
          header={header}
          emptyMessage="No se encontraron oportunidades"
        >
          <Column field="title" header="Oportunidad" />
          <Column
            field="channel"
            header="Canal"
            body={(row: Opportunity) => (
              <Tag value={OPPORTUNITY_CHANNEL_CONFIG[row.channel as keyof typeof OPPORTUNITY_CHANNEL_CONFIG]?.label ?? row.channel} />
            )}
          />
          <Column
            field="status"
            header="Estado"
            body={(row: Opportunity) => (
              <Tag value={OPPORTUNITY_STATUS_CONFIG[row.status as keyof typeof OPPORTUNITY_STATUS_CONFIG]?.label ?? row.status} />
            )}
          />
          <Column field="stageCode" header="Etapa" />
          <Column field="amount" header="Monto" body={(row: Opportunity) => `${row.currency} ${Number(row.amount ?? 0).toFixed(2)}`} />
          <Column field="nextActivityAt" header="Próx. actividad" body={(row: Opportunity) => new Date(row.nextActivityAt).toLocaleString('es-VE')} />
          <Column
            header="Acciones"
            body={(row: Opportunity) => (
              <div className="flex gap-1 justify-content-center">
                <Button icon="pi pi-eye" text onClick={() => openDetail(row)} />
                <Button icon="pi pi-check" text severity="success" onClick={() => closeOpportunity(row, 'WON')} disabled={row.status !== 'OPEN'} />
                <Button icon="pi pi-times" text severity="danger" onClick={() => closeOpportunity(row, 'LOST')} disabled={row.status !== 'OPEN'} />
              </div>
            )}
            exportable={false}
            frozen
            alignFrozen="right"
            style={{ width: '7rem', textAlign: 'center' }}
            headerStyle={{ textAlign: 'center' }}
          />
        </DataTable>
      )}

      <Dialog
        visible={formOpen}
        onHide={() => setFormOpen(false)}
        modal
        maximizable
        style={{ width: '75vw' }}
        breakpoints={{ '1400px': '75vw', '900px': '85vw', '600px': '95vw' }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-sitemap mr-3 text-primary text-3xl"></i>
                Nueva Oportunidad
              </h2>
            </div>
          </div>
        }
        footer={
          <FormActionButtons
            formId="opportunity-form"
            onCancel={() => setFormOpen(false)}
            isSubmitting={isSubmitting}
            isUpdate={false}
          />
        }
      >
        <OpportunityForm
          formId="opportunity-form"
          onSave={handleSave}
          onSubmittingChange={setIsSubmitting}
          toast={toast}
        />
      </Dialog>

      <Dialog visible={detailOpen} onHide={() => setDetailOpen(false)} header="Detalle oportunidad" style={{ width: 720 }}>
        {!detailData ? (
          <small className="text-500">Cargando...</small>
        ) : (
          <div className="grid">
            <div className="col-12 md:col-6"><strong>Título:</strong> {detailData.title}</div>
            <div className="col-12 md:col-6"><strong>Estado:</strong> {detailData.status}</div>
            <div className="col-12 md:col-6"><strong>Etapa:</strong> {detailData.stageCode}</div>
            <div className="col-12 md:col-6"><strong>Owner:</strong> {detailData.ownerId}</div>
            <div className="col-12"><strong>Descripción:</strong> {detailData.description || '—'}</div>
            <div className="col-12">
              <strong>Timeline:</strong>
              <ul className="mt-2">
                {(detailData.stageHistory || []).map((h: any) => (
                  <li key={h.id}>{new Date(h.changedAt).toLocaleString('es-VE')} - {h.fromStage || '∅'} → {h.toStage}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Dialog>
    </>
  )
}
