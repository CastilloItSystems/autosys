"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Checkbox } from "primereact/checkbox";
import { ProgressSpinner } from "primereact/progressspinner";
import { useRouter } from "next/navigation";
import PreInvoiceStepper from "@/components/sales/preInvoice/PreInvoiceStepper";
import billingBridgeService from "@/app/api/workshop/billingBridgeService";
import { handleFormError } from "@/utils/errorHandlers";
import type { ServiceOrder } from "@/libs/interfaces/workshop";

const BILLABLE_STATUSES = ["READY", "DELIVERED", "INVOICED", "CLOSED"];

const fmt = (v?: number | string | null) => {
  const n = Number(v ?? 0);
  return n.toLocaleString("es-VE", { style: "currency", currency: "USD" });
};

interface BillingTabProps {
  serviceOrder: ServiceOrder;
  onRefresh: () => void;
}

export default function BillingTab({ serviceOrder, onRefresh }: BillingTabProps) {
  const toast = useRef<Toast>(null);
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showConsolidated, setShowConsolidated] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([serviceOrder.id]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [consolidating, setConsolidating] = useState(false);

  const preInvoice = (serviceOrder as any).preInvoice;
  const invoice = (serviceOrder as any).invoice;
  const isBillable = BILLABLE_STATUSES.includes(serviceOrder.status);
  const canGenerateNew = isBillable && !preInvoice && !["INVOICED", "CLOSED"].includes(serviceOrder.status);

  const [variance, setVariance] = useState<any>(null);
  const [loadingVariance, setLoadingVariance] = useState(false);
  const [showVariance, setShowVariance] = useState(false);

  const loadVariance = useCallback(async () => {
    setLoadingVariance(true);
    try {
      const res = await billingBridgeService.getBudgetVariance(serviceOrder.id);
      setVariance(res.data);
    } catch {
      setVariance(null);
    } finally {
      setLoadingVariance(false);
    }
  }, [serviceOrder.id]);

  const loadPendingOrders = useCallback(async () => {
    if (!serviceOrder.customerId) return;
    setLoadingPending(true);
    try {
      const res = await billingBridgeService.getPendingBillingByCustomer(serviceOrder.customerId);
      setPendingOrders(res.data?.pendingOrders ?? []);
    } catch {
      setPendingOrders([]);
    } finally {
      setLoadingPending(false);
    }
  }, [serviceOrder.customerId]);

  const handleGeneratePreInvoice = async () => {
    setGenerating(true);
    try {
      await billingBridgeService.generatePreInvoice(serviceOrder.id);
      toast.current?.show({ severity: "success", summary: "Pre-factura generada", detail: "Gestiona desde Facturación", life: 4000 });
      onRefresh();
    } catch (err) {
      handleFormError(err, toast.current!);
    } finally {
      setGenerating(false);
    }
  };

  const handleSyncMaterials = async () => {
    setSyncing(true);
    try {
      const res = await billingBridgeService.syncMaterials(serviceOrder.id);
      const synced = res.data?.synced ?? 0;
      toast.current?.show({
        severity: synced > 0 ? "success" : "info",
        summary: synced > 0 ? `${synced} material(es) sincronizados` : "Sin cambios",
        detail: res.data?.message ?? "",
        life: 3000,
      });
      if (synced > 0) onRefresh();
    } catch (err) {
      handleFormError(err, toast.current!);
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenConsolidated = () => {
    setSelectedIds([serviceOrder.id]);
    loadPendingOrders();
    setShowConsolidated(true);
  };

  const handleGenerateConsolidated = async () => {
    if (selectedIds.length < 2) {
      toast.current?.show({ severity: "warn", summary: "Selecciona al menos 2 órdenes", life: 3000 });
      return;
    }
    setConsolidating(true);
    try {
      await billingBridgeService.generateConsolidatedPreInvoice(selectedIds);
      toast.current?.show({ severity: "success", summary: "Pre-factura consolidada generada", life: 4000 });
      setShowConsolidated(false);
      onRefresh();
    } catch (err) {
      handleFormError(err, toast.current!);
    } finally {
      setConsolidating(false);
    }
  };

  const toggleOrder = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <>
      <Toast ref={toast} />

      {/* Dialog facturación consolidada */}
      <Dialog
        header="Facturación consolidada"
        visible={showConsolidated}
        style={{ width: "520px" }}
        onHide={() => setShowConsolidated(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" outlined onClick={() => setShowConsolidated(false)} />
            <Button
              label={`Generar pre-factura consolidada (${selectedIds.length} OTs)`}
              icon="pi pi-file-invoice"
              loading={consolidating}
              disabled={selectedIds.length < 2}
              onClick={handleGenerateConsolidated}
            />
          </div>
        }
      >
        <p className="text-600 mb-3">
          Selecciona las órdenes a incluir en una sola pre-factura. Deben ser del mismo cliente.
        </p>
        {loadingPending ? (
          <p className="text-500">Cargando órdenes pendientes...</p>
        ) : (
          <div className="flex flex-column gap-2">
            {[serviceOrder, ...pendingOrders.filter((o) => o.id !== serviceOrder.id)].map((o) => (
              <div key={o.id} className="flex align-items-center gap-3 p-2 surface-100 border-round">
                <Checkbox
                  checked={selectedIds.includes(o.id)}
                  onChange={() => toggleOrder(o.id)}
                  disabled={o.id === serviceOrder.id}
                />
                <div className="flex flex-column flex-1">
                  <span className="font-semibold">{o.folio}</span>
                  <span className="text-500 text-sm">{o.vehiclePlate ?? o.vehicleDesc ?? "—"} · {o.status}</span>
                </div>
                <span className="font-bold">{fmt(o.total)}</span>
              </div>
            ))}
            {pendingOrders.filter((o) => o.id !== serviceOrder.id).length === 0 && (
              <p className="text-500 text-sm mt-1">No hay otras OTs pendientes de facturar para este cliente.</p>
            )}
          </div>
        )}
        {selectedIds.length >= 2 && (
          <div className="mt-3 p-2 surface-200 border-round flex justify-content-between">
            <span className="font-semibold text-sm">Total consolidado</span>
            <span className="font-bold">
              {fmt([serviceOrder, ...pendingOrders]
                .filter((o) => selectedIds.includes(o.id))
                .reduce((s, o) => s + Number(o.total ?? 0), 0))}
            </span>
          </div>
        )}
      </Dialog>

      {!isBillable && (
        <div className="flex flex-column align-items-center py-5 text-500">
          <i className="pi pi-info-circle text-3xl mb-2" />
          <p className="text-center m-0">
            La OT debe estar en estado <strong>Lista</strong> o{" "}
            <strong>Entregada</strong> para generar la pre-factura.
          </p>
        </div>
      )}

      {canGenerateNew && (
        <div className="flex flex-column align-items-center py-5 gap-3">
          <i className="pi pi-file-invoice text-4xl text-400" />
          <p className="text-500 m-0">Sin pre-factura generada</p>
          <div className="flex gap-2">
            <Button
              label="Generar Pre-Factura"
              icon="pi pi-plus"
              loading={generating}
              onClick={handleGeneratePreInvoice}
            />
            <Button
              label="Facturar con otras OTs"
              icon="pi pi-objects-column"
              outlined
              onClick={handleOpenConsolidated}
            />
          </div>
          <Button
            label="Sincronizar materiales consumidos"
            icon="pi pi-sync"
            text
            severity="secondary"
            size="small"
            loading={syncing}
            onClick={handleSyncMaterials}
            tooltip="Agrega los materiales CONSUMED como ítems facturables de la OT"
          />
        </div>
      )}

      {preInvoice && (
        <div className="flex flex-column gap-3">
          {/* Stepper */}
          <PreInvoiceStepper currentStatus={preInvoice.status} />

          {/* Pre-invoice summary */}
          <Card>
            <div className="grid">
              <div className="col-12 md:col-6">
                <div className="flex flex-column gap-2">
                  <div className="flex justify-content-between">
                    <span className="text-600">Número</span>
                    <span className="font-semibold">{preInvoice.preInvoiceNumber}</span>
                  </div>
                  <div className="flex justify-content-between">
                    <span className="text-600">Estado</span>
                    <Tag
                      value={preInvoice.status}
                      severity={
                        preInvoice.status === "PAID"
                          ? "success"
                          : preInvoice.status === "CANCELLED"
                          ? "danger"
                          : "info"
                      }
                    />
                  </div>
                  <div className="flex justify-content-between">
                    <span className="text-600">Total</span>
                    <span className="font-bold text-lg">{fmt(preInvoice.total)}</span>
                  </div>
                </div>
              </div>

              <div className="col-12 md:col-6">
                <div className="flex flex-column gap-2">
                  <div className="flex justify-content-between">
                    <span className="text-600">Base imponible</span>
                    <span>{fmt(preInvoice.baseImponible)}</span>
                  </div>
                  <div className="flex justify-content-between">
                    <span className="text-600">IVA ({preInvoice.taxRate}%)</span>
                    <span>{fmt(preInvoice.taxAmount)}</span>
                  </div>
                  {preInvoice.igtfApplies && (
                    <div className="flex justify-content-between">
                      <span className="text-600">IGTF ({preInvoice.igtfRate}%)</span>
                      <span>{fmt(preInvoice.igtfAmount)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Divider />

            <div className="flex justify-content-end">
              <Button
                label="Ver en Facturación"
                icon="pi pi-external-link"
                outlined
                size="small"
                onClick={() => router.push("/empresa/workshop/billing")}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Invoice info */}
      {invoice && (
        <Card className="mt-3" style={{ borderLeft: "4px solid var(--green-500)" }}>
          <div className="flex align-items-center gap-2 mb-2">
            <i className="pi pi-check-circle text-green-500 text-xl" />
            <span className="font-bold text-green-700">Factura generada</span>
          </div>
          <div className="flex flex-column gap-1 text-sm">
            <div className="flex justify-content-between">
              <span className="text-600">N° Factura</span>
              <span className="font-semibold">{invoice.invoiceNumber}</span>
            </div>
            {invoice.fiscalNumber && (
              <div className="flex justify-content-between">
                <span className="text-600">N° Fiscal</span>
                <span>{invoice.fiscalNumber}</span>
              </div>
            )}
            <div className="flex justify-content-between">
              <span className="text-600">Total</span>
              <span className="font-bold">{fmt(invoice.total)}</span>
            </div>
          </div>
        </Card>
      )}

      {/* ── F3-12: Conciliación presupuesto vs factura ── */}
      {isBillable && (
        <div className="mt-3">
          <Divider />
          <div className="flex justify-content-between align-items-center mb-2">
            <span className="font-semibold text-700">
              <i className="pi pi-chart-bar mr-2 text-primary" />
              Conciliación Presupuesto vs Factura
            </span>
            <Button
              label={showVariance ? "Ocultar" : "Ver conciliación"}
              icon={showVariance ? "pi pi-chevron-up" : "pi pi-chevron-down"}
              text
              size="small"
              onClick={() => {
                if (!showVariance && !variance) loadVariance();
                setShowVariance((v) => !v);
              }}
            />
          </div>

          {showVariance && (
            loadingVariance ? (
              <div className="flex justify-content-center py-3">
                <ProgressSpinner style={{ width: 32, height: 32 }} />
              </div>
            ) : variance ? (
              <ReconciliationPanel data={variance} fmt={fmt} />
            ) : (
              <p className="text-500 text-sm">No se pudo cargar la conciliación.</p>
            )
          )}
        </div>
      )}
    </>
  );
}

// ── Subcomponente de conciliación ─────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; severity: any; icon: string; color: string }> = {
  IN_BUDGET:     { label: "Dentro del presupuesto", severity: "success", icon: "pi-check-circle",   color: "var(--green-600)" },
  OVER_BUDGET:   { label: "Sobre presupuesto",       severity: "danger",  icon: "pi-exclamation-circle", color: "var(--red-600)" },
  UNDER_BUDGET:  { label: "Bajo presupuesto",        severity: "info",    icon: "pi-info-circle",   color: "var(--blue-600)" },
  NO_QUOTATION:  { label: "Sin cotización",          severity: "warning", icon: "pi-file-o",        color: "var(--orange-600)" },
  NO_BILLING:    { label: "Sin facturación",         severity: "warning", icon: "pi-clock",         color: "var(--orange-600)" },
};

function ReconciliationPanel({ data, fmt }: { data: any; fmt: (v: any) => string }) {
  const { quotation, billing, reconciliation } = data;
  const cfg = STATUS_CONFIG[reconciliation.status] ?? STATUS_CONFIG.NO_QUOTATION;

  const VarianceRow = ({ label, quoted, billed }: { label: string; quoted: number; billed: number }) => {
    const diff = billed - quoted;
    const color = diff > 0.01 ? "var(--red-600)" : diff < -0.01 ? "var(--blue-600)" : "var(--green-600)";
    return (
      <div className="grid text-sm py-1 border-bottom-1 surface-border">
        <div className="col-4 text-600">{label}</div>
        <div className="col-3 text-right">{fmt(quoted)}</div>
        <div className="col-3 text-right">{fmt(billed)}</div>
        <div className="col-2 text-right font-semibold" style={{ color }}>
          {diff > 0.01 ? "+" : ""}{fmt(diff)}
        </div>
      </div>
    );
  };

  return (
    <div className="surface-50 border-round p-3">
      {/* Status badge */}
      <div className="flex align-items-center gap-2 mb-3">
        <i className={`pi ${cfg.icon} text-xl`} style={{ color: cfg.color }} />
        <span className="font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
        {reconciliation.variancePct != null && (
          <Tag
            value={`${reconciliation.variance >= 0 ? "+" : ""}${reconciliation.variancePct.toFixed(1)}%`}
            severity={cfg.severity}
            className="ml-auto"
          />
        )}
      </div>

      {/* Summary cards */}
      <div className="grid mb-3">
        <div className="col-12 md:col-4">
          <div className="surface-card border-round p-3 text-center">
            <div className="text-500 text-xs mb-1">COTIZACIÓN APROBADA</div>
            <div className="text-xl font-bold text-900">
              {quotation ? fmt(quotation.approvedTotal) : "—"}
            </div>
            {quotation && (
              <div className="text-xs text-400 mt-1">{quotation.quotationNumber} · v{quotation.version}</div>
            )}
          </div>
        </div>
        <div className="col-12 md:col-4">
          <div className="surface-card border-round p-3 text-center">
            <div className="text-500 text-xs mb-1">
              {billing?.source === "INVOICE" ? "FACTURA" : "PRE-FACTURA"}
            </div>
            <div className="text-xl font-bold text-900">
              {billing ? fmt(billing.total) : "—"}
            </div>
            {billing && (
              <div className="text-xs text-400 mt-1">{billing.number}</div>
            )}
          </div>
        </div>
        <div className="col-12 md:col-4">
          <div className="surface-card border-round p-3 text-center">
            <div className="text-500 text-xs mb-1">DIFERENCIA</div>
            <div
              className="text-xl font-bold"
              style={{ color: reconciliation.variance > 0.01 ? "var(--red-600)" : reconciliation.variance < -0.01 ? "var(--blue-600)" : "var(--green-600)" }}
            >
              {reconciliation.variance >= 0 ? "+" : ""}{fmt(reconciliation.variance)}
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown table */}
      {quotation && billing && (
        <>
          <div className="grid text-xs text-500 pb-1 border-bottom-1 surface-border font-semibold">
            <div className="col-4">Categoría</div>
            <div className="col-3 text-right">Cotizado</div>
            <div className="col-3 text-right">Facturado</div>
            <div className="col-2 text-right">Diferencia</div>
          </div>
          <VarianceRow label="Mano de obra"   quoted={reconciliation.breakdown.labor.quoted}  billed={reconciliation.breakdown.labor.billed} />
          <VarianceRow label="Refacciones"    quoted={reconciliation.breakdown.parts.quoted}  billed={reconciliation.breakdown.parts.billed} />
          <VarianceRow label="Otros"          quoted={reconciliation.breakdown.other.quoted}  billed={reconciliation.breakdown.other.billed} />
        </>
      )}

      {/* Quotation approval info */}
      {quotation?.approvalType && (
        <div className="text-xs text-500 mt-2">
          <i className="pi pi-check mr-1" />
          Aprobada {quotation.approvalType === "TOTAL" ? "en su totalidad" : "parcialmente"}
          {quotation.approvalChannel && ` · vía ${quotation.approvalChannel.toLowerCase()}`}
          {quotation.approvedAt && ` · ${new Date(quotation.approvedAt).toLocaleDateString("es-MX")}`}
        </div>
      )}

      {!quotation && (
        <p className="text-500 text-sm m-0">
          <i className="pi pi-info-circle mr-1" />
          Esta OT no tiene cotización taller aprobada. Ve a la pestaña <strong>Cotización</strong> para generar una.
        </p>
      )}
    </div>
  );
}
