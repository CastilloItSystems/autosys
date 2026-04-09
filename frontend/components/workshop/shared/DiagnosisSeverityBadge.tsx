"use client";
import React from "react";
import { Tag } from "primereact/tag";

type TagSeverity = "info" | "success" | "warning" | "danger" | "secondary" | "contrast" | undefined;

const SEVERITY_MAP: Record<string, { label: string; severity: TagSeverity }> = {
  LOW: { label: "Baja", severity: "info" },
  MEDIUM: { label: "Media", severity: "warning" },
  HIGH: { label: "Alta", severity: "danger" },
  CRITICAL: { label: "Crítica", severity: "danger" },
};

interface DiagnosisSeverityBadgeProps {
  severity: string;
}

export default function DiagnosisSeverityBadge({ severity }: DiagnosisSeverityBadgeProps) {
  const config = SEVERITY_MAP[severity] ?? { label: severity, severity: "secondary" as TagSeverity };
  return <Tag value={config.label} severity={config.severity} rounded />;
}
