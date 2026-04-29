"use client";
import React from "react";
import { Card } from "primereact/card";

type KPIColor =
  | "blue"
  | "green"
  | "orange"
  | "red"
  | "purple"
  | "teal"
  | "yellow";

interface KPICardProps {
  title: string;
  value: number | string;
  icon: string;
  color: KPIColor;
  trend?: "up" | "down" | null;
  trendLabel?: string;
  onClick?: () => void;
}

export default function KPICard({
  title,
  value,
  icon,
  color,
  trend,
  trendLabel,
  onClick,
}: KPICardProps) {
  const trendIcon =
    trend === "up"
      ? "pi-arrow-up"
      : trend === "down"
        ? "pi-arrow-down"
        : null;

  const trendColor =
    trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "";

  return (
    <Card
      className={`border-round-lg shadow-1${onClick ? " cursor-pointer transition-shadow transition-duration-200 hover:shadow-3" : ""}`}
      style={{ borderLeft: `4px solid var(--${color}-500)` }}
      onClick={onClick}
    >
      <div className="flex align-items-center justify-content-between">
        <div className="flex flex-column gap-2">
          <span className="text-600 text-sm font-medium">{title}</span>
          <span className="text-900 font-bold text-3xl">{value}</span>
          {trendIcon && trendLabel && (
            <span className={`flex align-items-center gap-1 text-sm ${trendColor}`}>
              <i className={`pi ${trendIcon} text-xs`} />
              {trendLabel}
            </span>
          )}
        </div>
        <div
          className={`flex align-items-center justify-content-center border-circle bg-${color}-100`}
          style={{ width: 56, height: 56 }}
        >
          <i className={`pi ${icon} text-2xl text-${color}-600`} />
        </div>
      </div>
    </Card>
  );
}
