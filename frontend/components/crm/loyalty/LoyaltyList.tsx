'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Toast } from 'primereact/toast'
import { Dialog } from 'primereact/dialog'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Tag } from 'primereact/tag'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'

import loyaltyService from '@/app/api/crm/loyaltyService'
import CreateButton from '@/components/common/CreateButton'
import FormActionButtons from '@/components/common/FormActionButtons'
import LoyaltyForm from './LoyaltyForm'

export default function LoyaltyList() {
  const toast = useRef<Toast>(null)

  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [data, setData] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState(20)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const typeOptions = [
    { label: 'Todos los tipos', value: '' },
    { label: 'Eventos', value: 'EVENT' },
    { label: 'Encuestas', value: 'SURVEY' },
  ]

  const statusOptions = [
    { label: 'Todos los estados', value: '' },
    { label: 'Pendiente', value: 'PENDING' },
    { label: 'Completado', value: 'COMPLETED' },
    { label: 'Cancelado', value: 'CANCELLED' },
  ]

  const load = async () => {
    setLoading(true)
    try {
      const res = await loyaltyService.getAll({
        page: page + 1,
        limit: rows,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
      })
      setData((res as any).data ?? res)
    } catch {
      toast.current?.show({ severity: 'error', summary: 'No se pudo cargar fidelización' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [page, rows, typeFilter, statusFilter])

  const filteredEvents = (data?.events || []).filter((row: any) => {
    const bySearch =
      !searchQuery ||
      String(row.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(row.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    return bySearch
  })

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Fidelización</h4>
        <span className="text-600 text-sm">({data?.meta?.total ?? 0} total)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Dropdown
          value={typeFilter}
          options={typeOptions}
          onChange={(e) => {
            setTypeFilter(e.value)
            setPage(0)
          }}
          placeholder="Tipo"
          style={{ minWidth: '160px' }}
        />
        <Dropdown
          value={statusFilter}
          options={statusOptions}
          onChange={(e) => {
            setStatusFilter(e.value)
            setPage(0)
          }}
          placeholder="Estado"
          style={{ minWidth: '160px' }}
        />
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(0)
            }}
          />
        </span>
        <CreateButton label="Nuevo registro" onClick={() => setOpen(true)} tooltip="Crear registro" />
      </div>
    </div>
  )

  const handleSave = async () => {
    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Registro de fidelización creado correctamente',
      life: 3000,
    })
    setOpen(false)
    await load()
  }

  return (
    <>
      <Toast ref={toast} />

      <div className="grid mb-3">
        <div className="col-12 md:col-4">
          <div className="card mb-0">
            <small className="text-500">Eventos pendientes</small>
            <h3 className="m-0 mt-1">{data?.metrics?.pendingEvents ?? 0}</h3>
          </div>
        </div>
        <div className="col-12 md:col-8">
          <div className="card mb-0">
            <strong>Tareas sugeridas</strong>
            <ul className="mt-2 mb-0">
              {(data?.suggestedTasks || []).map((t: any) => (
                <li key={t.id}>{t.label}</li>
              ))}
              {(data?.suggestedTasks || []).length === 0 && <li>Sin tareas sugeridas</li>}
            </ul>
          </div>
        </div>
      </div>

      <DataTable
        value={filteredEvents}
        header={header}
        loading={loading}
        paginator
        lazy
        scrollable
        sortMode="multiple"
        first={page * rows}
        rows={rows}
        totalRecords={data?.meta?.total ?? 0}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onPage={(e) => {
          setPage(e.page ?? 0)
          setRows(e.rows ?? 20)
        }}
        emptyMessage="No se encontraron eventos de fidelización"
      >
        <Column field="title" header="Evento" />
        <Column field="type" header="Tipo" />
        <Column field="status" header="Estado" body={(r: any) => <Tag value={r.status} />} />
        <Column field="customer.name" header="Cliente" />
        <Column field="createdAt" header="Fecha" body={(r: any) => new Date(r.createdAt).toLocaleString('es-VE')} />
      </DataTable>

      <Dialog
        visible={open}
        onHide={() => setOpen(false)}
        modal
        maximizable
        style={{ width: '75vw' }}
        breakpoints={{ '1400px': '75vw', '900px': '85vw', '600px': '95vw' }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-heart mr-3 text-primary text-3xl"></i>
                Nuevo Registro de Fidelización
              </h2>
            </div>
          </div>
        }
        footer={
          <FormActionButtons
            formId="loyalty-form"
            onCancel={() => setOpen(false)}
            isSubmitting={isSubmitting}
            isUpdate={false}
          />
        }
      >
        <LoyaltyForm
          formId="loyalty-form"
          onSave={handleSave}
          onSubmittingChange={setIsSubmitting}
          toast={toast}
        />
      </Dialog>
    </>
  )
}
