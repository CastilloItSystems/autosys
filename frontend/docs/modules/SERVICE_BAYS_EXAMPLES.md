# 💼 Ejemplos Prácticos - Puestos de Servicio

Este documento contiene ejemplos del mundo real para implementar funcionalidades con el módulo de Puestos de Servicio.

## 📋 Tabla de Contenidos

1. [Configuración Inicial del Taller](#configuración-inicial-del-taller)
2. [Asignación de Trabajo](#asignación-de-trabajo)
3. [Dashboard en Tiempo Real](#dashboard-en-tiempo-real)
4. [Reportes y Análisis](#reportes-y-análisis)
5. [Gestión de Turnos](#gestión-de-turnos)
6. [Integración con Órdenes de Trabajo](#integración-con-órdenes-de-trabajo)

---

## 🏗️ Configuración Inicial del Taller

### Escenario: Configurar un taller de 8 bahías

```typescript
import { createServiceBay } from "@/app/api/serviceBayService";

async function setupWorkshop() {
  const bays = [
    // Bahías de Mecánica General (3)
    {
      name: "Bahía Mecánica General 1",
      code: "MEC-01",
      area: "mecanica" as const,
      capacity: "mediana" as const,
      maxTechnicians: 2,
      equipment: ["Gato Hidráulico", "Compresor", "Set Herramientas"],
      order: 1,
    },
    {
      name: "Bahía Mecánica General 2",
      code: "MEC-02",
      area: "mecanica" as const,
      capacity: "mediana" as const,
      maxTechnicians: 2,
      equipment: ["Gato Hidráulico", "Compresor", "Set Herramientas"],
      order: 2,
    },
    {
      name: "Bahía Mecánica Pesada",
      code: "MEC-03",
      area: "mecanica" as const,
      capacity: "grande" as const,
      maxTechnicians: 3,
      equipment: ["Gato 5 Ton", "Puente Grúa", "Compresor Industrial"],
      notes: "Para vehículos grandes y trabajos complejos",
      order: 3,
    },

    // Bahía de Electricidad (2)
    {
      name: "Bahía Eléctrica 1",
      code: "ELEC-01",
      area: "electricidad" as const,
      capacity: "pequeña" as const,
      maxTechnicians: 1,
      equipment: ["Multímetro", "Osciloscopio", "Escáner OBD2"],
      order: 4,
    },
    {
      name: "Bahía Eléctrica 2",
      code: "ELEC-02",
      area: "electricidad" as const,
      capacity: "pequeña" as const,
      maxTechnicians: 1,
      equipment: ["Multímetro", "Escáner OBD2", "Kit Diagnóstico"],
      order: 5,
    },

    // Bahía de Pintura (1)
    {
      name: "Cabina de Pintura",
      code: "PINT-01",
      area: "pintura" as const,
      capacity: "mediana" as const,
      maxTechnicians: 2,
      equipment: ["Compresor", "Pistola Pintura", "Cabina Extracción"],
      notes: "Área controlada con extracción de vapores",
      order: 6,
    },

    // Bahía de Cambio de Aceite Rápido (1)
    {
      name: "Express Cambio Aceite",
      code: "OIL-01",
      area: "cambio_aceite" as const,
      capacity: "individual" as const,
      maxTechnicians: 1,
      equipment: ["Fosa", "Bomba Extracción", "Contenedores"],
      notes: "Servicio rápido sin cita previa",
      order: 7,
    },

    // Bahía de Diagnóstico (1)
    {
      name: "Centro de Diagnóstico",
      code: "DIAG-01",
      area: "diagnostico" as const,
      capacity: "pequeña" as const,
      maxTechnicians: 1,
      equipment: ["Escáner Profesional", "Kit Diagnóstico Completo", "Laptop"],
      notes: "Equipada con software de diagnóstico avanzado",
      order: 8,
    },
  ];

  console.log("🏗️ Configurando taller con 8 bahías...");

  for (const bay of bays) {
    try {
      const result = await createServiceBay(bay);
      console.log(`✅ ${bay.name} creada exitosamente`);
    } catch (error: any) {
      console.error(`❌ Error al crear ${bay.name}:`, error.message);
    }
  }

  console.log("🎉 Configuración del taller completada!");
}

// Ejecutar
setupWorkshop();
```

---

## 🔧 Asignación de Trabajo

### Ejemplo 1: Flujo Completo de Asignación

```typescript
import {
  getAvailableServiceBays,
  enterBay,
  exitBay,
} from "@/app/api/serviceBayService";

/**
 * Flujo completo: Desde que llega el vehículo hasta que sale
 */
async function processWorkOrder(
  workOrderId: string,
  requiredArea: string,
  technicianId: string
) {
  // 1. Buscar bahía disponible
  console.log("🔍 Buscando bahía disponible...");
  const response = await getAvailableServiceBays(requiredArea);

  if (!response.bays || response.bays.length === 0) {
    throw new Error(`No hay bahías disponibles en el área ${requiredArea}`);
  }

  const availableBay = response.bays[0];
  console.log(`✅ Bahía encontrada: ${availableBay.name}`);

  // 2. Asignar técnico y registrar entrada
  console.log("📥 Registrando entrada...");
  const entryResult = await enterBay(workOrderId, {
    serviceBay: availableBay._id,
    technician: technicianId,
    role: "principal",
    estimatedHours: 2,
    notes: "Inicio de trabajo",
  });

  console.log("✅ Entrada registrada exitosamente");
  console.log(`⏰ Hora de entrada: ${entryResult.assignment.entryTime}`);
  console.log(
    `🏭 Bahía: ${entryResult.bay.name} - Estado: ${entryResult.bay.status}`
  );

  // 3. Simular trabajo (en la realidad, el técnico trabaja)
  console.log("⚙️ Técnico trabajando...");

  // 4. Registrar salida cuando termina
  console.log("📤 Registrando salida...");
  const exitResult = await exitBay(workOrderId, {
    technician: technicianId,
    notes: "Trabajo completado satisfactoriamente",
  });

  console.log("✅ Salida registrada exitosamente");
  console.log(`⏱️ Horas trabajadas: ${exitResult.assignment.hoursWorked}`);
  console.log(`🏭 Bahía liberada: ${exitResult.bayReleased ? "Sí" : "No"}`);

  return {
    bay: availableBay,
    hoursWorked: exitResult.assignment.hoursWorked,
    completed: true,
  };
}

// Uso
processWorkOrder("orden123", "mecanica", "tech456")
  .then((result) => console.log("🎉 Proceso completado:", result))
  .catch((error) => console.error("❌ Error:", error.message));
```

### Ejemplo 2: Asignación con Múltiples Técnicos

```typescript
/**
 * Trabajo complejo que requiere varios técnicos
 */
async function assignComplexWork(
  workOrderId: string,
  bayId: string,
  leadTechnicianId: string,
  assistantTechnicianIds: string[]
) {
  console.log("👥 Asignando equipo de trabajo...");

  // Crear array de técnicos
  const technicians = [
    {
      technician: leadTechnicianId,
      role: "principal" as const,
      estimatedHours: 4,
    },
    ...assistantTechnicianIds.map((techId) => ({
      technician: techId,
      role: "asistente" as const,
      estimatedHours: 4,
    })),
  ];

  // Registrar entrada de todo el equipo
  const result = await enterBay(workOrderId, {
    serviceBay: bayId,
    technicians: technicians,
    notes: "Trabajo complejo - Equipo completo asignado",
  });

  console.log("✅ Equipo asignado exitosamente:");
  console.log(`   👨‍🔧 Técnico principal: 1`);
  console.log(`   👷 Asistentes: ${assistantTechnicianIds.length}`);
  console.log(`   🏭 Bahía: ${result.bay.name}`);
  console.log(
    `   📊 Ocupación: ${result.bay.currentTechnicians.length}/${result.bay.maxTechnicians}`
  );

  return result;
}

// Uso: Reparación mayor con 1 mecánico principal y 2 asistentes
assignComplexWork("orden789", "bayMEC03", "techPrincipal", [
  "techAsist1",
  "techAsist2",
]);
```

### Ejemplo 3: Verificar Disponibilidad Antes de Asignar

```typescript
import {
  getServiceBay,
  isBayAvailable,
  canAcceptMoreTechnicians,
} from "@/app/api/serviceBayService";

/**
 * Verificar si una bahía puede aceptar una nueva asignación
 */
async function canAssignToBay(bayId: string, numberOfTechnicians: number = 1) {
  const bay = await getServiceBay(bayId);

  // Verificaciones
  const checks = {
    exists: !!bay.bay,
    isAvailable: bay.bay ? isBayAvailable(bay.bay) : false,
    hasCapacity: bay.bay
      ? bay.bay.currentTechnicians.length + numberOfTechnicians <=
        bay.bay.maxTechnicians
      : false,
    isActive: bay.bay?.isActive || false,
  };

  const canAssign = Object.values(checks).every((check) => check === true);

  console.log("🔍 Verificación de bahía:");
  console.log(`   ✓ Existe: ${checks.exists ? "✅" : "❌"}`);
  console.log(`   ✓ Disponible: ${checks.isAvailable ? "✅" : "❌"}`);
  console.log(`   ✓ Capacidad: ${checks.hasCapacity ? "✅" : "❌"}`);
  console.log(`   ✓ Activa: ${checks.isActive ? "✅" : "❌"}`);
  console.log(
    `   Resultado: ${canAssign ? "✅ PUEDE ASIGNAR" : "❌ NO PUEDE ASIGNAR"}`
  );

  return canAssign;
}

// Uso
if (await canAssignToBay("bayMEC01", 2)) {
  // Proceder con asignación
  console.log("Procediendo con asignación...");
} else {
  console.log("Buscar otra bahía o esperar");
}
```

---

## 📊 Dashboard en Tiempo Real

### Ejemplo: Componente de Dashboard

```tsx
"use client";
import React, { useEffect, useState } from "react";
import { Card } from "primereact/card";
import { Badge } from "primereact/badge";
import { ProgressBar } from "primereact/progressbar";
import { getServiceBaysDashboard } from "@/app/api/serviceBayService";
import { BAY_AREA_LABELS } from "@/libs/interfaces/workshop/serviceBay.interface";

export default function ServiceBayDashboard() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const data = await getServiceBaysDashboard();
      setDashboard(data);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    // Actualizar cada 30 segundos
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !dashboard) return <div>Cargando...</div>;

  const occupancyRate =
    (dashboard.summary.occupiedBays / dashboard.summary.totalBays) * 100;

  return (
    <div className="grid">
      {/* Resumen General */}
      <div className="col-12">
        <Card title="Resumen General">
          <div className="grid">
            <div className="col-3">
              <div className="text-center">
                <i className="pi pi-box text-4xl text-primary"></i>
                <h3>{dashboard.summary.totalBays}</h3>
                <p className="text-500">Total Bahías</p>
              </div>
            </div>
            <div className="col-3">
              <div className="text-center">
                <i className="pi pi-check-circle text-4xl text-green-500"></i>
                <h3>{dashboard.summary.availableBays}</h3>
                <p className="text-500">Disponibles</p>
              </div>
            </div>
            <div className="col-3">
              <div className="text-center">
                <i className="pi pi-clock text-4xl text-orange-500"></i>
                <h3>{dashboard.summary.occupiedBays}</h3>
                <p className="text-500">Ocupadas</p>
              </div>
            </div>
            <div className="col-3">
              <div className="text-center">
                <i className="pi pi-wrench text-4xl text-blue-500"></i>
                <h3>{dashboard.summary.maintenanceBays}</h3>
                <p className="text-500">Mantenimiento</p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h5>Ocupación General: {occupancyRate.toFixed(1)}%</h5>
            <ProgressBar value={occupancyRate} />
          </div>
        </Card>
      </div>

      {/* Bahías Activas */}
      <div className="col-12">
        <Card title="Bahías en Operación">
          {dashboard.activeBays.length === 0 ? (
            <p className="text-500">No hay bahías en operación actualmente</p>
          ) : (
            <div className="grid">
              {dashboard.activeBays.map((bay: any) => (
                <div key={bay.bayId} className="col-12 md:col-6 lg:col-4">
                  <Card className="bg-blue-50">
                    <div className="flex justify-content-between align-items-center mb-2">
                      <h4 className="m-0">{bay.bayName}</h4>
                      <Badge value={bay.bayCode} severity="info" />
                    </div>

                    <p className="text-sm mb-2">
                      <strong>OT:</strong> {bay.workOrderNumber}
                    </p>

                    <p className="text-sm mb-2">
                      <strong>Cliente:</strong> {bay.customerName}
                    </p>

                    <div className="flex gap-2 mb-2">
                      {bay.technicians.map((tech: any, idx: number) => (
                        <Badge
                          key={idx}
                          value={`${tech.name} (${tech.role})`}
                          severity={
                            tech.role === "principal" ? "success" : "info"
                          }
                        />
                      ))}
                    </div>

                    <small className="text-500">
                      Desde: {new Date(bay.occupiedSince).toLocaleTimeString()}
                    </small>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Ocupación por Área */}
      <div className="col-12">
        <Card title="Ocupación por Área">
          <div className="grid">
            {Object.entries(dashboard.byArea).map(
              ([area, stats]: [string, any]) => (
                <div key={area} className="col-12 md:col-6 lg:col-3">
                  <h5>
                    {BAY_AREA_LABELS[area as keyof typeof BAY_AREA_LABELS]}
                  </h5>
                  <div className="flex gap-3">
                    <Badge
                      value={`${stats.occupied} Ocupadas`}
                      severity="warning"
                    />
                    <Badge
                      value={`${stats.available} Libres`}
                      severity="success"
                    />
                  </div>
                  <ProgressBar
                    value={(stats.occupied / stats.total) * 100}
                    className="mt-2"
                  />
                </div>
              )
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
```

---

## 📈 Reportes y Análisis

### Ejemplo 1: Reporte de Horas por Técnico

```typescript
import { getTechnicianHoursReport } from "@/app/api/serviceBayService";

async function generateMonthlyTechnicianReport(year: number, month: number) {
  // Calcular fechas
  const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0];
  const endDate = new Date(year, month, 0).toISOString().split("T")[0];

  console.log(`📊 Generando reporte del ${startDate} al ${endDate}`);

  const report = await getTechnicianHoursReport({ startDate, endDate });

  console.log("\n=== REPORTE DE HORAS POR TÉCNICO ===\n");

  // Ordenar por horas trabajadas
  const sorted = report.report.sort(
    (a: any, b: any) => b.totalHours - a.totalHours
  );

  sorted.forEach((tech: any, index: number) => {
    console.log(`${index + 1}. ${tech.technicianName}`);
    console.log(`   📊 Total Horas: ${tech.totalHours.toFixed(2)}`);
    console.log(`   📋 Trabajos Completados: ${tech.completedAssignments}`);
    console.log(
      `   ⏱️ Promedio por Trabajo: ${tech.averageHoursPerAssignment.toFixed(
        2
      )} hrs`
    );
    console.log(
      `   🎯 Eficiencia: ${(
        (tech.totalHours / tech.estimatedTotalHours) *
        100
      ).toFixed(1)}%`
    );
    console.log("");
  });

  console.log("=== RESUMEN ===");
  console.log(`Total Técnicos: ${report.summary.totalTechnicians}`);
  console.log(`Total Horas: ${report.summary.totalHours.toFixed(2)}`);
  console.log(
    `Promedio por Técnico: ${report.summary.averageHoursPerTechnician.toFixed(
      2
    )}`
  );

  return report;
}

// Uso: Reporte de noviembre 2025
generateMonthlyTechnicianReport(2025, 11);
```

### Ejemplo 2: Análisis de Utilización de Bahías

```typescript
import { getBayUtilizationReport } from "@/app/api/serviceBayService";

async function analyzeBayUtilization(startDate: string, endDate: string) {
  const report = await getBayUtilizationReport({ startDate, endDate });

  console.log("\n🏭 === ANÁLISIS DE UTILIZACIÓN DE BAHÍAS ===\n");

  // Identificar bahías más y menos utilizadas
  const sorted = report.report.sort(
    (a: any, b: any) => b.utilizationPercentage - a.utilizationPercentage
  );

  console.log("📈 Bahías más utilizadas:");
  sorted.slice(0, 3).forEach((bay: any, index: number) => {
    console.log(`   ${index + 1}. ${bay.bayName} (${bay.bayCode})`);
    console.log(`      Utilización: ${bay.utilizationPercentage.toFixed(1)}%`);
    console.log(`      Total Usos: ${bay.totalOccupancies}`);
    console.log(`      Horas Totales: ${bay.totalHours.toFixed(2)}`);
    console.log("");
  });

  console.log("📉 Bahías menos utilizadas:");
  sorted.slice(-3).forEach((bay: any, index: number) => {
    console.log(`   ${index + 1}. ${bay.bayName} (${bay.bayCode})`);
    console.log(`      Utilización: ${bay.utilizationPercentage.toFixed(1)}%`);
    console.log(`      Total Usos: ${bay.totalOccupancies}`);
    console.log(`      Horas Totales: ${bay.totalHours.toFixed(2)}`);
    console.log("");
  });

  // Recomendaciones
  console.log("💡 Recomendaciones:");
  sorted.forEach((bay: any) => {
    if (bay.utilizationPercentage > 90) {
      console.log(
        `   ⚠️ ${bay.bayName}: Sobreutilizada, considerar ampliar capacidad`
      );
    } else if (bay.utilizationPercentage < 30) {
      console.log(
        `   💤 ${bay.bayName}: Subutilizada, evaluar necesidad o reasignar`
      );
    }
  });

  return report;
}

// Uso
analyzeBayUtilization("2025-11-01", "2025-11-30");
```

---

## 🔄 Gestión de Turnos

### Ejemplo: Sistema de Turnos por Bahía

```typescript
interface Shift {
  name: string;
  startHour: number;
  endHour: number;
}

const shifts: Shift[] = [
  { name: "Mañana", startHour: 7, endHour: 15 },
  { name: "Tarde", startHour: 15, endHour: 23 },
  { name: "Noche", startHour: 23, endHour: 7 },
];

function getCurrentShift(): Shift {
  const hour = new Date().getHours();
  return (
    shifts.find((shift) => {
      if (shift.startHour < shift.endHour) {
        return hour >= shift.startHour && hour < shift.endHour;
      } else {
        return hour >= shift.startHour || hour < shift.endHour;
      }
    }) || shifts[0]
  );
}

async function assignToShiftBay(
  workOrderId: string,
  area: string,
  technicianId: string
) {
  const currentShift = getCurrentShift();
  console.log(`⏰ Turno actual: ${currentShift.name}`);

  // Buscar bahías disponibles
  const available = await getAvailableServiceBays(area);

  if (available.bays.length === 0) {
    throw new Error(
      `No hay bahías disponibles en ${area} para el turno ${currentShift.name}`
    );
  }

  // Asignar con información del turno
  const result = await enterBay(workOrderId, {
    serviceBay: available.bays[0]._id,
    technician: technicianId,
    role: "principal",
    notes: `Turno: ${currentShift.name} (${currentShift.startHour}:00 - ${currentShift.endHour}:00)`,
  });

  console.log(
    `✅ Asignado a ${available.bays[0].name} - Turno ${currentShift.name}`
  );
  return result;
}
```

---

## 🔗 Integración con Órdenes de Trabajo

### Ejemplo: Hook personalizado para React

```tsx
import { useState, useEffect } from "react";
import {
  getAvailableServiceBays,
  enterBay,
  exitBay,
} from "@/app/api/serviceBayService";
import type { ServiceBay } from "@/libs/interfaces/workshop/serviceBay.interface";

export function useServiceBayAssignment(workOrderId: string) {
  const [availableBays, setAvailableBays] = useState<ServiceBay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAvailableBays = async (area?: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAvailableServiceBays(area);
      setAvailableBays(response.bays || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const assignToBay = async (
    bayId: string,
    technicianId: string,
    estimatedHours: number
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await enterBay(workOrderId, {
        serviceBay: bayId,
        technician: technicianId,
        role: "principal",
        estimatedHours,
      });
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const releaseFromBay = async (technicianId: string, notes?: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await exitBay(workOrderId, {
        technician: technicianId,
        notes,
      });
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    availableBays,
    loading,
    error,
    loadAvailableBays,
    assignToBay,
    releaseFromBay,
  };
}

// Uso en componente
function WorkOrderBaySelector({ workOrderId }: { workOrderId: string }) {
  const { availableBays, loading, error, loadAvailableBays, assignToBay } =
    useServiceBayAssignment(workOrderId);

  useEffect(() => {
    loadAvailableBays("mecanica");
  }, []);

  const handleAssign = async (bayId: string) => {
    try {
      await assignToBay(bayId, "tech123", 2);
      alert("Asignado exitosamente");
    } catch (error) {
      alert("Error al asignar");
    }
  };

  return (
    <div>
      <h3>Seleccionar Bahía</h3>
      {loading && <p>Cargando...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <div className="grid">
        {availableBays.map((bay) => (
          <div key={bay._id} className="col-4">
            <button onClick={() => handleAssign(bay._id)}>
              {bay.name} ({bay.code})
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🎯 Casos de Uso Avanzados

### Ejemplo: Sistema de Prioridades

```typescript
interface WorkOrderWithPriority {
  id: string;
  priority: "urgente" | "alta" | "normal" | "baja";
  area: string;
  estimatedHours: number;
}

async function assignByPriority(
  workOrders: WorkOrderWithPriority[],
  availableTechnicians: string[]
) {
  // Ordenar por prioridad
  const priorityOrder = { urgente: 0, alta: 1, normal: 2, baja: 3 };
  const sorted = workOrders.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  console.log("🎯 Asignando órdenes por prioridad...\n");

  for (const order of sorted) {
    try {
      console.log(
        `📋 Procesando OT ${order.id} - Prioridad: ${order.priority}`
      );

      const available = await getAvailableServiceBays(order.area);

      if (available.bays.length > 0 && availableTechnicians.length > 0) {
        const bay = available.bays[0];
        const technician = availableTechnicians[0];

        await enterBay(order.id, {
          serviceBay: bay._id,
          technician,
          role: "principal",
          estimatedHours: order.estimatedHours,
          notes: `Prioridad: ${order.priority.toUpperCase()}`,
        });

        console.log(`✅ Asignado a ${bay.name} con técnico ${technician}`);

        // Remover técnico de disponibles
        availableTechnicians.shift();
      } else {
        console.log(`⏸️ En espera - No hay recursos disponibles`);
      }

      console.log("");
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}\n`);
    }
  }
}

// Uso
const pendingOrders: WorkOrderWithPriority[] = [
  { id: "ord1", priority: "normal", area: "mecanica", estimatedHours: 2 },
  { id: "ord2", priority: "urgente", area: "electricidad", estimatedHours: 1 },
  { id: "ord3", priority: "alta", area: "mecanica", estimatedHours: 3 },
];

assignByPriority(pendingOrders, ["tech1", "tech2", "tech3"]);
```

---

## 📝 Notas Finales

Estos ejemplos cubren los casos de uso más comunes. Para casos específicos:

1. **Consulta la documentación completa** en `docs/modules/SERVICE_BAYS.md`
2. **Revisa el código fuente** de los componentes para ver implementaciones reales
3. **Adapta los ejemplos** a tus necesidades específicas

**Tip:** Siempre maneja errores adecuadamente y proporciona feedback al usuario sobre el estado de las operaciones.
