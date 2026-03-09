# Resumen de Cambios - Módulo de Inventario
*Fecha: 06 de Marzo de 2026*

Este documento resume las mejoras, correcciones y estandarizaciones realizadas en el módulo de inventario (Transferencias y Ajustes) para servir como contexto en futuros desarrollos.

## 1. Frontend (React/Next.js + PrimeReact)

### Estandarización de UI
Se unificó el diseño de las vistas de detalle para **Transferencias** y **Ajustes**, adoptando un diseño basado en tarjetas ("cards") para mejorar la legibilidad y la experiencia de usuario.

*   **Componentes:** `TransferDetail.tsx` y `AdjustmentDetail.tsx`.
*   **Patrón Visual:**
    *   Encabezado con ID, Estado (Tags localizados) y Fecha.
    *   Bloques de información (Origen/Destino/Motivo) con iconos y bordes de color semántico.
    *   Tablas de artículos claras con formateo de moneda y cantidades.
    *   Sección de notas y flujo de aprobación.

### Transferencias (`/transfers`)
*   **TransferDetail.tsx:**
    *   Corrección de error crítico en formateo de moneda (`toFixed` en valores nulos).
    *   Rediseño completo de la interfaz (ver Estandarización).
    *   Mejora en la visualización del estado de tránsito y documentos asociados (Notas de Entrada/Salida).
*   **TransferList.tsx:**
    *   Corrección en la columna de almacén para soportar tanto objetos poblados como strings simples.

### Ajustes (`/adjustments`)
*   **AdjustmentForm.tsx (Creación):**
    *   **Filtrado por Almacén:** Se implementó la lógica para cargar artículos dinámicamente según el almacén seleccionado (usando `getStockByWarehouse`), replicando el comportamiento de Transferencias.
    *   **UX:** Estados de carga (`loadingStocks`) y deshabilitación de campos dependientes.
    *   **Validación:** Corrección en la visualización de errores de validación (Zod) para el array de items.
*   **AdjustmentList.tsx (Listado):**
    *   Implementación del botón **"Ver Detalles"** (icono ojo).
    *   Integración de modal (`Dialog`) con el componente `AdjustmentDetail`.
*   **AdjustmentDetail.tsx:**
    *   Nuevo componente creado siguiendo el estándar visual de `TransferDetail`.
    *   Muestra el "snapshot" de cambios de inventario (Cantidad Actual vs Nueva).

## 2. Backend (Node.js + Prisma)

### Correcciones de Estabilidad y Lógica
*   **Servicios (`adjustments.service.ts`):**
    *   **Fix 500 Error:** Reemplazo de variable indefinida `db` por `prisma`.
    *   **Lógica de "Aplicar":** Se corrigió el método `apply` para que, al momento de impactar el inventario, guarde una "foto" de las cantidades (`currentQuantity`, `newQuantity`) en la tabla `AdjustmentItem`. Esto garantiza la integridad histórica de los datos.
*   **Controladores (`adjustments.controller.ts`):**
    *   **Query Params:** Corrección en la lectura del parámetro `includeItems`. Se asegura que los items se devuelvan por defecto (manejo robusto de `true`/`"true"`/`undefined`).
*   **Validación (`adjustments.validation.ts`):**
    *   **Joi Schemas:** Se flexibilizó la validación para permitir notas vacías o nulas (`allow(null, '')`), evitando errores 422 innecesarios desde el frontend.

## 3. Patrones Establecidos

Para futuros desarrollos en este módulo, mantener estos estándares:

1.  **Vistas de Detalle:** Usar componentes dedicados (`*Detail.tsx`) dentro de Modales para ver registros individuales, reutilizando el diseño de Grid + Cards de PrimeReact.
2.  **Selección de Artículos:** Siempre filtrar los artículos disponibles basándose en el stock del almacén seleccionado (`getStockByWarehouse`), nunca mostrar la lista global de productos en transacciones de inventario.
3.  **Snapshots de Inventario:** En operaciones que modifican stock (Ajustes, Transferencias), guardar siempre los valores previos y posteriores en el registro de detalle para auditoría.
