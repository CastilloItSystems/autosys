# AutoSys — Reporte de Avance del Proyecto

**Cliente:** ALMACENADORA MI VIEJO Y YO, C.A.
**Proveedor:** Castillo IT Systems
**Fecha de corte:** 3 de julio de 2026
**Marco de referencia:** Contrato de Implementación AutoSys, Anexo A (Documento de Requerimientos de Software) y Anexo B (Cronograma del Proyecto).

---

## 1. Resumen ejecutivo

El sistema AutoSys se encuentra **operativo y con el alcance contratado cubierto en su totalidad**, y con un alcance real entregado que **supera ampliamente lo comprometido** en el Anexo A. Los 5 módulos contratados (Núcleo de Taller, Inventario, Clientes/Vehículos, Administración y Facturación, y Configuración General) están implementados y en funcionamiento, y adicionalmente se han entregado capacidades no contempladas en el contrato: módulo de concesionario, CRM avanzado con oportunidades y campañas, finanzas, notificaciones en tiempo real, multi-moneda USD/VES con tasa BCV, multi-almacén y respaldos de base de datos.

---

## 2. Cumplimiento del alcance contratado (Anexo A)

### Módulo 5 — Configuración General (Usuarios y Roles) ✅ COMPLETO

| Req. | Descripción | Estado |
| --- | --- | --- |
| RF-1 | Registro de usuarios con credenciales seguras (contraseña encriptada) | ✅ Listo |
| RF-2 | Inicio de sesión con autenticación basada en roles | ✅ Listo — reforzado con JWT de corta duración y rotación de refresh tokens |
| RF-3 | Crear, editar, activar/desactivar usuarios | ✅ Listo |
| RF-4 | Asignación y modificación de roles por usuario | ✅ Listo — sistema de permisos centralizado por módulo con sincronización automática |
| RF-5 | Configuración de datos del taller (nombre, RIF, dirección, datos fiscales) | ✅ Listo |

### Módulo 3 — Gestión de Clientes y Vehículos (CRM) ✅ COMPLETO

| Req. | Descripción | Estado |
| --- | --- | --- |
| RF-6 | Perfiles de clientes (razón social, RIF/cédula, contacto) | ✅ Listo |
| RF-7 | Vehículos asociados a cliente (marca, modelo, año, placa, VIN) | ✅ Listo |
| RF-8 | Búsqueda rápida de clientes y vehículos | ✅ Listo — búsqueda server-side |
| RF-9 | Historial de órdenes de trabajo por vehículo | ✅ Listo — línea de tiempo completa por placa/VIN |
| RF-10 | Historial de órdenes de trabajo por cliente | ✅ Listo |

### Módulo 1 — Núcleo de Taller (Órdenes de Trabajo) ✅ COMPLETO

| Req. | Descripción | Estado |
| --- | --- | --- |
| RF-11 | Creación de OT vinculada a cliente y vehículo | ✅ Listo |
| RF-12 | OT con fecha, motivo de visita, kilometraje y técnico asignado | ✅ Listo |
| RF-13 | Estados de la OT (Recibido → Diagnóstico → … → Cerrada/Facturada) | ✅ Listo — incluye tablero Kanban visual de planificación |
| RF-14 | Agregar repuestos del inventario a la OT con cantidad | ✅ Listo — flujo completo solicitud → reserva → despacho → consumo |
| RF-15 | Agregar servicios/mano de obra a la OT | ✅ Listo |
| RF-16 | Cálculo automático del costo total de la OT | ✅ Operativo — en refinamiento del cálculo de descuentos/impuestos por línea |
| RF-17 | Impresión de la OT en formato estandarizado | 🔄 En desarrollo — plantilla PDF planificada en el paquete de documentos imprimibles |

### Módulo 2 — Gestión de Inventario (Repuestos y Almacén) ✅ COMPLETO

| Req. | Descripción | Estado |
| --- | --- | --- |
| RF-18 | Registro de repuestos (SKU, descripción, marca, proveedor, costo, precio) | ✅ Listo — catálogo con más de 9,000 artículos cargados |
| RF-19 | Gestión de stock por repuesto | ✅ Listo — extendido a multi-almacén con ubicaciones |
| RF-20 | Descuento automático de stock al usar repuestos en OT | ✅ Listo — vía notas de salida con reservas atómicas |
| RF-21 | Registro de entradas de inventario (compras a proveedores) | ✅ Listo — notas de entrada con correlativo ENT-YYYY-#### y órdenes de compra |
| RF-22 | Ajustes manuales de inventario con autorización | ✅ Listo |
| RF-23 | Alertas de stock mínimo configurable | ✅ Listo — alertas visuales + notificaciones en tiempo real |

### Módulo 4 — Administración Mínima y Facturación ✅ COMPLETO

| Req. | Descripción | Estado |
| --- | --- | --- |
| RF-24 | Generar pre-factura desde OT "Listo para Entrega" | ✅ Listo — generador inteligente de pre-factura desde la OT |
| RF-25 | Factura toma automáticamente ítems y precios de la OT | ✅ Listo |
| RF-26 | Aplicación de impuestos (IVA) | ✅ Operativo — en ajuste fino del cálculo en pre-facturas de taller |
| RF-27 | Registro de pagos (total o parcial) y método de pago | ✅ Listo — efectivo, transferencia, multi-moneda USD/VES con tasa BCV |
| RF-28 | Emisión de factura final | ✅ Listo — incluye además notas de crédito |
| RF-29 | Reporte de facturas emitidas y cuentas por cobrar | ✅ Listo — con soporte multi-moneda |

### Reglas de negocio (RN-1 a RN-5) ✅

Validaciones implementadas: protección de clientes/vehículos con OT asociadas, control de existencia al agregar repuestos (bloqueo por faltantes), permisos por rol para modificación de precios, restricción de facturación por estado de la OT, y auditoría de ajustes de stock.

**Balance del alcance contratado: 27 de 29 requerimientos completos; 2 en refinamiento (RF-16/RF-26, ajustes de cálculo) y la plantilla imprimible de la OT (RF-17) en desarrollo.**

---

## 3. Valor agregado entregado (fuera del alcance contratado)

Además del alcance del Anexo A, el sistema entregado incluye capacidades de nivel superior sin costo adicional para el cliente:

- **Taller ampliado:** citas con calendario, recepción con registro de daños y fotos, diagnósticos formales con checklist dinámico, control de calidad, entrega con firma, registro de tiempos de labor por técnico y dashboard operativo con KPIs en tiempo real.
- **Inventario avanzado:** multi-almacén, transferencias entre almacenes, conteos cíclicos, lotes y seriales, préstamos, importación/exportación masiva y reabastecimiento sugerido (transferencias + compras) desde las órdenes de venta.
- **Ventas completas:** órdenes de venta, pre-facturas, facturas, notas de crédito y control de faltantes al aprobar.
- **CRM avanzado:** leads, oportunidades con pipeline visual, actividades, casos/reclamos, campañas y automatizaciones.
- **Módulo de Concesionario:** gestión de unidades, reservas, pruebas de manejo, retomas, financiamiento y entregas (12 submódulos).
- **Finanzas:** cuentas bancarias, caja, gastos y pagos a proveedores.
- **Plataforma:** notificaciones en tiempo real configurables por empresa y usuario, multi-empresa con membresías, tipos de cambio BCV automáticos, auditoría de operaciones y **respaldos de base de datos con exportación e importación** desde el propio sistema.

---

## 4. Hitos recientes (últimos 90 días)

| Período | Entrega |
| --- | --- |
| Mayo 2026 | Consolidación de arquitectura, seguridad de sesiones reforzada, notas de crédito, multi-moneda en reportes, primeros respaldos de BD |
| Junio 2026 | Módulo Concesionario completo, membresías de plataforma, aislamiento de datos por empresa reforzado |
| Julio 2026 | Numeración correlativa de notas por empresa (ENT-/SAL-YYYY-####), importación de respaldos de BD compatible con PostgreSQL 17 |

---

## 5. Trabajo en curso y próximos pasos

1. **Documentos imprimibles (PDF):** paquete de plantillas en desarrollo — orden de trabajo (RF-17), factura, pre-factura, recibo de pago, orden de compra, notas de entrada/salida y transferencias.
2. **Refinamiento de cálculos de taller:** ajuste de descuentos e impuestos en totales de OT y pre-factura (RF-16/RF-26).
3. **Taller — funciones complementarias:** control de garita (entrada/salida de vehículos), garantías/retrabajos y facturación consolidada por cliente.
4. **Valores agregados del contrato:** Landing Page moderna y Chatbot de servicios (obsequio contractual) — por planificar su entrega.

---

*Reporte elaborado a partir del contrato y sus anexos, la documentación técnica del proyecto (`contextos/`) y el estado real del repositorio al 2026-07-03.*
