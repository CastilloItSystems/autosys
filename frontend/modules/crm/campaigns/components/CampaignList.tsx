"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";

import { Campaign } from "../interfaces/campaign.interface";
import {
  CAMPAIGN_STATUS_FILTER_OPTIONS,
  CAMPAIGN_CHANNEL_FILTER_OPTIONS,
} from "../utils/campaign.utils";
import CreateButton from "@/components/common/CreateButton";
import FormActionButtons from "@/shared/components/FormActionButtons";
import CampaignForm from "./CampaignForm";
import { useCampaignsData } from "../hooks/useCampaignsData";

let lastCampaignErrorMessage = "";
let lastCampaignErrorAt = 0;

export default function CampaignList() {
  const toast = useRef<Toast>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(20);
  const [statusFilter, setStatusFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);

  const statusOptions = CAMPAIGN_STATUS_FILTER_OPTIONS;
  const channelOptions = CAMPAIGN_CHANNEL_FILTER_OPTIONS;

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const params = useMemo(
    () => ({
      page: page + 1,
      limit: rows,
      sortBy: "createdAt",
      sortOrder: "desc" as const,
      status: statusFilter || undefined,
      channel: channelFilter || undefined,
      search: searchQuery || undefined,
    }),
    [page, rows, statusFilter, channelFilter, searchQuery],
  );
  const {
    campaigns: rowsData,
    total: totalRecords,
    loading,
    error,
    mutate,
  } = useCampaignsData(params);

  useEffect(() => {
    if (error) {
      const message =
        (error as any)?.response?.data?.message ??
        "No se pudieron cargar campañas";
      const now = Date.now();
      const shouldShowToast =
        message !== lastCampaignErrorMessage ||
        now - lastCampaignErrorAt > 1500;

      if (shouldShowToast) {
        toast.current?.show({ severity: "error", summary: message });
        lastCampaignErrorMessage = message;
        lastCampaignErrorAt = now;
      }
    }
  }, [error]);

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0">Campañas</h4>
        <span className="text-600 text-sm">({totalRecords} total)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Dropdown
          value={statusFilter}
          options={statusOptions}
          onChange={(e) => {
            setStatusFilter(e.value);
            setPage(0);
          }}
          placeholder="Estado"
          style={{ minWidth: "160px" }}
        />
        <Dropdown
          value={channelFilter}
          options={channelOptions}
          onChange={(e) => {
            setChannelFilter(e.value);
            setPage(0);
          }}
          placeholder="Canal"
          style={{ minWidth: "160px" }}
        />
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            placeholder="Buscar..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(0);
            }}
          />
        </span>
        <CreateButton
          label="Nueva campaña"
          onClick={() => setOpen(true)}
          tooltip="Crear campaña"
        />
      </div>
    </div>
  );

  const handleSave = async () => {
    toast.current?.show({
      severity: "success",
      summary: "Éxito",
      detail: "Campaña creada correctamente",
      life: 3000,
    });
    setOpen(false);
    await mutate();
  };

  return (
    <>
      <Toast ref={toast} />

      <DataTable
        value={rowsData}
        header={header}
        loading={loading}
        paginator
        lazy
        scrollable
        sortMode="multiple"
        first={page * rows}
        rows={rows}
        totalRecords={totalRecords}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onPage={(e) => {
          setPage(e.page ?? 0);
          setRows(e.rows ?? 20);
        }}
        emptyMessage="No se encontraron campañas"
      >
        <Column field="name" header="Nombre" />
        <Column field="channel" header="Canal" />
        <Column field="status" header="Estado" />
        <Column
          field="budget"
          header="Presupuesto"
          body={(r: Campaign) =>
            r.budget != null ? Number(r.budget).toFixed(2) : "—"
          }
        />
        <Column field="sentCount" header="Enviados" />
        <Column field="responseCount" header="Respuestas" />
        <Column field="leadsCreatedCount" header="Leads" />
        <Column field="opportunitiesCount" header="Oportunidades" />
        <Column field="opportunitiesWonCount" header="Ganadas" />
      </DataTable>

      <Dialog
        visible={open}
        onHide={() => setOpen(false)}
        modal
        maximizable
        style={{ width: "75vw" }}
        breakpoints={{ "1400px": "75vw", "900px": "85vw", "600px": "95vw" }}
        header={
          <div className="mb-2 text-center md:text-left">
            <div className="border-bottom-2 border-primary pb-2">
              <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
                <i className="pi pi-megaphone mr-3 text-primary text-3xl"></i>
                Nueva Campaña
              </h2>
            </div>
          </div>
        }
        footer={
          <FormActionButtons
            formId="campaign-form"
            onCancel={() => setOpen(false)}
            isSubmitting={isSubmitting}
            isUpdate={false}
          />
        }
      >
        <CampaignForm
          formId="campaign-form"
          onSave={handleSave}
          onSubmittingChange={setIsSubmitting}
          toast={toast}
        />
      </Dialog>
    </>
  );
}
