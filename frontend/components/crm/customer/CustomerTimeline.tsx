"use client";
import React, { useEffect, useState } from "react";
import { ProgressSpinner } from "primereact/progressspinner";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { motion } from "framer-motion";
import customerCrmService from "@/app/api/crm/customerCrmService";
import { CustomerTimeline as ICustomerTimeline } from "@/libs/interfaces/crm/customer.crm.interface";
import {
  LEAD_STATUS_CONFIG,
  LEAD_CHANNEL_CONFIG,
} from "@/libs/interfaces/crm/lead.interface";
import {
  INTERACTION_TYPE_CONFIG,
} from "@/libs/interfaces/crm/interaction.interface";
import {
  ACTIVITY_STATUS_CONFIG,
  ACTIVITY_TYPE_CONFIG,
} from "@/libs/interfaces/crm/activity.interface";

interface Props {
  customerId: string;
}

export default function CustomerTimeline({ customerId }: Props) {
  const [data, setData] = useState<ICustomerTimeline | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await customerCrmService.getTimeline(customerId);
        setData(res.data as unknown as ICustomerTimeline);
      } catch (err) {
        console.error("Error al cargar timeline:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [customerId]);

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center py-6">
        <ProgressSpinner style={{ width: "50px", height: "50px" }} />
      </div>
    );
  }

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid"
    >
      {/* ── Resumen del cliente ── */}
      <div className="col-12">
        <div className="flex flex-wrap gap-3 align-items-center">
          <div className="flex flex-column">
            <span className="text-2xl font-bold text-900">{data.customer.name}</span>
            <span className="text-500 text-sm">{data.customer.code} · {data.customer.taxId}</span>
          </div>
          <Tag value={data.customer.segment} severity="info" className="ml-auto" />
        </div>
        <Divider />
      </div>

      {/* ── KPIs ── */}
      <div className="col-12">
        <div className="grid">
          {[
            { label: "Órdenes", count: data.orders.length, icon: "pi-shopping-cart", color: "blue" },
            { label: "Leads", count: data.leads.length, icon: "pi-chart-line", color: "orange" },
            { label: "Interacciones", count: data.interactions.length, icon: "pi-comments", color: "green" },
            { label: "Actividades", count: data.activities.length, icon: "pi-check-square", color: "purple" },
            { label: "Vehículos", count: data.vehicles.length, icon: "pi-car", color: "teal" },
            { label: "Taller", count: data.serviceOrders?.length ?? 0, icon: "pi-wrench", color: "cyan" },
          ].map((kpi) => (
            <div key={kpi.label} className="col-6 md:col-4 lg:col-2">
              <div className={`surface-card border-round-xl p-3 text-center shadow-1 border-left-3 border-${kpi.color}-400`}>
                <i className={`pi ${kpi.icon} text-${kpi.color}-500 text-2xl mb-2 block`} />
                <div className="text-3xl font-bold text-900">{kpi.count}</div>
                <div className="text-500 text-xs mt-1">{kpi.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Vehículos ── */}
      {data.vehicles.length > 0 && (
        <div className="col-12 md:col-6">
          <h5 className="text-primary mb-2"><i className="pi pi-car mr-2" />Vehículos</h5>
          <div className="flex flex-column gap-2">
            {data.vehicles.map((v) => (
              <div key={v.id} className="surface-50 border-round p-3 flex align-items-center gap-3">
                <i className="pi pi-car text-2xl text-blue-400" />
                <div>
                  <div className="font-semibold">{v.brand?.name} {v.vehicleModel?.name}</div>
                  <div className="text-xs text-500">
                    {v.plate} {v.year && `· ${v.year}`} {v.color && `· ${v.color}`}
                    {v.mileage && ` · ${v.mileage.toLocaleString()} km`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Leads ── */}
      {data.leads.length > 0 && (
        <div className="col-12 md:col-6">
          <h5 className="text-primary mb-2"><i className="pi pi-chart-line mr-2" />Leads / Oportunidades</h5>
          <div className="flex flex-column gap-2">
            {data.leads.map((lead) => {
              const statusCfg = LEAD_STATUS_CONFIG[lead.status as keyof typeof LEAD_STATUS_CONFIG];
              const channelCfg = LEAD_CHANNEL_CONFIG[lead.channel as keyof typeof LEAD_CHANNEL_CONFIG];
              return (
                <div key={lead.id} className="surface-50 border-round p-3">
                  <div className="flex justify-content-between align-items-start">
                    <span className="font-semibold text-sm">{lead.title}</span>
                    <div className="flex gap-1">
                      {channelCfg && <Tag value={channelCfg.label} severity={channelCfg.severity} className="text-xs" />}
                      {statusCfg && <Tag value={statusCfg.label} severity={statusCfg.severity} className="text-xs" />}
                    </div>
                  </div>
                  {lead.estimatedValue && (
                    <div className="text-xs text-500 mt-1">
                      Valor: ${Number(lead.estimatedValue).toFixed(2)}
                    </div>
                  )}
                  <div className="text-xs text-400 mt-1">
                    {new Date(lead.createdAt).toLocaleDateString("es-VE")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Órdenes recientes ── */}
      {data.orders.length > 0 && (
        <div className="col-12 md:col-6">
          <h5 className="text-primary mb-2"><i className="pi pi-shopping-cart mr-2" />Órdenes Recientes</h5>
          <div className="flex flex-column gap-2">
            {data.orders.slice(0, 5).map((order) => (
              <div key={order.id} className="surface-50 border-round p-3 flex justify-content-between align-items-center">
                <div>
                  <div className="font-semibold text-sm">{order.orderNumber}</div>
                  <div className="text-xs text-400">{new Date(order.createdAt).toLocaleDateString("es-VE")}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm">${Number(order.total).toFixed(2)}</div>
                  <Tag value={order.status} severity="info" className="text-xs" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Órdenes de Taller ── */}
      {(data.serviceOrders?.length ?? 0) > 0 && (
        <div className="col-12 md:col-6">
          <h5 className="text-primary mb-2"><i className="pi pi-wrench mr-2" />Órdenes de Taller</h5>
          <div className="flex flex-column gap-2">
            {data.serviceOrders!.slice(0, 5).map((so) => (
              <div key={so.id} className="surface-50 border-round p-3 flex justify-content-between align-items-center">
                <div>
                  <div className="font-semibold text-sm">{so.folio}</div>
                  <div className="text-xs text-500">{so.vehiclePlate ?? ""} {so.vehicleDesc ? `· ${so.vehicleDesc}` : ""}</div>
                  <div className="text-xs text-400">{new Date(so.receivedAt).toLocaleDateString("es-VE")}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm">${Number(so.total).toFixed(2)}</div>
                  <Tag
                    value={so.status}
                    severity={so.status === "DELIVERED" ? "success" : so.status === "CANCELLED" ? "danger" : "info"}
                    className="text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Interacciones recientes ── */}
      {data.interactions.length > 0 && (
        <div className="col-12 md:col-6">
          <h5 className="text-primary mb-2"><i className="pi pi-comments mr-2" />Interacciones Recientes</h5>
          <div className="flex flex-column gap-2">
            {data.interactions.slice(0, 6).map((interaction) => {
              const cfg = INTERACTION_TYPE_CONFIG[interaction.type as keyof typeof INTERACTION_TYPE_CONFIG];
              return (
                <div key={interaction.id} className="surface-50 border-round p-3">
                  <div className="flex justify-content-between align-items-center mb-1">
                    {cfg && <Tag value={cfg.label} severity={cfg.severity} icon={cfg.icon} className="text-xs" />}
                    <span className="text-xs text-400">{new Date(interaction.createdAt).toLocaleDateString("es-VE")}</span>
                  </div>
                  {interaction.subject && <div className="font-semibold text-sm">{interaction.subject}</div>}
                  <div className="text-xs text-600 mt-1 line-clamp-2">{interaction.notes}</div>
                  {interaction.outcome && (
                    <div className="text-xs text-500 mt-1"><i className="pi pi-check mr-1 text-green-500" />{interaction.outcome}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Actividades pendientes ── */}
      {data.activities.length > 0 && (
        <div className="col-12">
          <h5 className="text-primary mb-2"><i className="pi pi-check-square mr-2" />Actividades</h5>
          <div className="grid">
            {data.activities.map((activity) => {
              const statusCfg = ACTIVITY_STATUS_CONFIG[activity.status as keyof typeof ACTIVITY_STATUS_CONFIG];
              const typeCfg = ACTIVITY_TYPE_CONFIG[activity.type as keyof typeof ACTIVITY_TYPE_CONFIG];
              const isPast = activity.status === "PENDING" && new Date(activity.dueAt) < new Date();
              return (
                <div key={activity.id} className="col-12 md:col-6 lg:col-4">
                  <div className={`surface-50 border-round p-3 border-left-3 ${isPast ? "border-red-400" : "border-blue-300"}`}>
                    <div className="flex justify-content-between align-items-start mb-1">
                      {typeCfg && <Tag value={typeCfg.label} severity={typeCfg.severity} icon={typeCfg.icon} className="text-xs" />}
                      {statusCfg && <Tag value={statusCfg.label} severity={statusCfg.severity} className="text-xs" />}
                    </div>
                    <div className="font-semibold text-sm mt-1">{activity.title}</div>
                    <div className={`text-xs mt-1 ${isPast ? "text-red-500 font-semibold" : "text-500"}`}>
                      <i className="pi pi-calendar mr-1" />
                      {new Date(activity.dueAt).toLocaleDateString("es-VE")}
                      {isPast && " · Vencida"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {data.orders.length === 0 &&
        data.leads.length === 0 &&
        data.interactions.length === 0 &&
        data.activities.length === 0 &&
        data.vehicles.length === 0 &&
        (data.serviceOrders?.length ?? 0) === 0 && (
          <div className="col-12 text-center py-5">
            <i className="pi pi-inbox text-4xl text-300 mb-3 block" />
            <p className="text-500">No hay actividad registrada para este cliente.</p>
          </div>
        )}
    </motion.div>
  );
}
