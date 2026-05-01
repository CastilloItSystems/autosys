"use client";
import React from "react";
import { Divider } from "primereact/divider";

interface WorkshopFormSectionProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
}

export default function WorkshopFormSection({
  title,
  icon,
  children,
  className,
}: WorkshopFormSectionProps) {
  return (
    <div className={className}>
      <Divider align="left">
        <span className="flex align-items-center gap-2 text-900 font-semibold">
          {icon && <i className={`pi ${icon}`} />}
          {title}
        </span>
      </Divider>
      {children}
    </div>
  );
}
