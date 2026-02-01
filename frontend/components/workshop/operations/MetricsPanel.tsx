"use client";

import React from "react";
import { Card } from "primereact/card";
import { Skeleton } from "primereact/skeleton";
import { BayDashboardMetrics } from "@/libs/interfaces/workshop/serviceBayDashboard.interface";

interface MetricsPanelProps {
  metrics: BayDashboardMetrics;
  loading?: boolean;
}

interface MetricCardData {
  label: string;
  value: number;
  total?: number;
  icon: string;
  color: string;
  bgColor: string;
  textColor: string;
}

export default function MetricsPanel({ metrics, loading }: MetricsPanelProps) {
  const metricCards: MetricCardData[] = [
    {
      label: "Disponibles",
      value: metrics.availableBays,
      total: metrics.totalBays,
      icon: "pi-check-circle",
      color: "#22c55e",
      bgColor: "#f0fdf4",
      textColor: "#15803d",
    },
    {
      label: "Ocupadas",
      value: metrics.occupiedBays,
      total: metrics.totalBays,
      icon: "pi-car",
      color: "#f59e0b",
      bgColor: "#fffbeb",
      textColor: "#b45309",
    },
    {
      label: "Técnicos Activos",
      value: metrics.activeTechnicians,
      icon: "pi-users",
      color: "#3b82f6",
      bgColor: "#eff6ff",
      textColor: "#1e40af",
    },
    {
      label: "OTs en Proceso",
      value: metrics.activeWorkOrders,
      icon: "pi-file-edit",
      color: "#8b5cf6",
      bgColor: "#f5f3ff",
      textColor: "#6d28d9",
    },
  ];

  // Loading state con skeleton
  if (loading) {
    return (
      <div className="grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="col-12 md:col-6 lg:col-3">
            <Card className="border-1 surface-border">
              <div className="flex align-items-center gap-3">
                <Skeleton shape="circle" size="4rem" />
                <div className="flex-1">
                  <Skeleton width="8rem" height="1rem" className="mb-2" />
                  <Skeleton width="4rem" height="2rem" />
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid">
      {metricCards.map((metric, index) => (
        <div key={index} className="col-12 md:col-6 lg:col-3">
          <Card className="border-none shadow-2 metric-card">
            <div className="flex align-items-center gap-3">
              {/* Icono con fondo de color */}
              <div
                className="flex align-items-center justify-content-center border-round flex-shrink-0 metric-icon"
                style={{
                  width: "4rem",
                  height: "4rem",
                  backgroundColor: metric.bgColor,
                }}
              >
                <i
                  className={`pi ${metric.icon} text-3xl`}
                  style={{ color: metric.color }}
                />
              </div>

              {/* Contenido */}
              <div className="flex-1">
                {/* Label */}
                <div
                  className="text-500 font-medium mb-1"
                  style={{ fontSize: "0.875rem" }}
                >
                  {metric.label}
                </div>

                {/* Valor */}
                <div className="flex align-items-baseline gap-2">
                  <span
                    className="font-bold"
                    style={{
                      fontSize: "2rem",
                      lineHeight: "1",
                      color: metric.textColor,
                    }}
                  >
                    {metric.value}
                  </span>
                  {metric.total !== undefined && (
                    <span
                      className="text-500 font-medium"
                      style={{ fontSize: "1.125rem" }}
                    >
                      / {metric.total}
                    </span>
                  )}
                </div>

                {/* Porcentaje (opcional) */}
                {metric.total !== undefined && metric.total > 0 && (
                  <div className="mt-1">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: metric.textColor }}
                    >
                      {Math.round((metric.value / metric.total) * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      ))}

      <style jsx>{`
        :global(.metric-card) {
          transition: all 0.3s ease;
          cursor: default;
        }

        :global(.metric-card:hover) {
          transform: translateY(-4px);
        }

        :global(.metric-icon) {
          transition: transform 0.3s ease;
        }

        :global(.metric-card:hover .metric-icon) {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}
