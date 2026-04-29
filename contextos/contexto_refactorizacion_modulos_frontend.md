# Contexto: Refactorización Escalable de Módulos Frontend

**Fecha:** 2026-04-29  
**Scope:** `frontend/modules/*`  
**Objetivo:** Tener una guía única para refactorizar cualquier módulo (usuarios, inventario, ventas, crm, taller, etc.) con estructura consistente, bajo acoplamiento y mantenimiento predecible.

---

## 1. Resultado Esperado

Cada módulo en `frontend/modules` debe quedar:

- Aislado por dominio (UI + lógica de dominio).
- Con responsabilidades separadas (components, hooks, interfaces, schemas, services y store cuando aplique).
- Sin duplicación de patrones entre módulos.
- Integrable con `app/api/*` sin mezclar responsabilidades de red con UI.

---

## 2. Estructura Objetivo por Módulo

Referencia base (ajustar según complejidad):

```text
frontend/modules/<modulo>/
  <submodulo-opcional>/
    components/
      <Entidad>List.tsx
      <Entidad>Form.tsx
      ...
    hooks/
      use<Entidad>Data.ts
    interfaces/
      <entidad>.interface.ts
    schemas/
      <entidad>.schema.ts
    services/
      <entidad>.service.ts
      <auxiliar>.service.ts
    store/
      <entidad>Store.ts
    utils/
      <entidad>.mapper.ts
      <entidad>.constants.ts
    index.ts
```

Ejemplos válidos de organización:

- Módulo plano: `modules/users/*`
- Módulo por subdominios: `modules/nomina/banks/*`, `modules/nomina/departments/*`, etc.

Reglas:

- `components/`: solo presentación + manejo mínimo de eventos.
- `hooks/`: lectura de datos con SWR usando servicios `get*` (fetch + cache + loading/error + mutate).
- `schemas/`: Zod por entidad/caso de uso (crear, editar, filtros).
- `interfaces/`: contratos del dominio del módulo (preferir `interface` sobre `type` en esta refactorización).
- `services/`: fuente de verdad para llamadas HTTP del submódulo (`get*`, `create*`, `update*`, `delete*`, acciones específicas).
- `store/`: opcional; usar cuando el estado debe compartirse entre varias pantallas/componentes del mismo dominio.
- `utils/`: mapeos API ⇄ UI, helpers puros, constantes del módulo.
- `index.ts`: exportaciones públicas del módulo (evitar imports profundos desde afuera).

---

## 3. Frontera de Responsabilidades

### Sí debe vivir en `frontend/modules/<modulo>`

- Componentes de pantalla y subcomponentes del dominio.
- Hooks de lectura de datos del dominio (SWR).
- Esquemas de validación del dominio.
- Servicios HTTP del dominio (`services/*`).
- Store local de dominio cuando haya estado compartido.
- Adaptadores/mappers de datos para UI.

### No debe vivir en `frontend/modules/<modulo>`

- Cliente HTTP genérico, interceptores, configuración de Axios/fetch.
- Tipos globales reutilizables de toda la app (van en `frontend/libs/interfaces/*`).
- Componentes verdaderamente compartidos (van en `frontend/components/common/*` o ubicación global existente).

---

## 4. Flujo de Refactorización (por módulo)

### Paso 1: Auditoría rápida

Checklist mínimo:

- Inventariar archivos actuales del módulo.
- Identificar duplicación con otros módulos.
- Detectar acoplamientos (importaciones cruzadas no deseadas).
- Detectar lógica de negocio metida en componentes UI.
- Detectar llamadas HTTP fuera de `services/`.

### Paso 2: Definir API pública del módulo

En `frontend/modules/<modulo>/index.ts` exportar solo:

- Pantallas/componentes raíz.
- Hooks públicos reutilizables.
- Interfaces estrictamente necesarias.
- Funciones/servicios que deban usarse desde fuera del submódulo (solo si es necesario).

Evitar exportar internals de implementación.

### Paso 3: Extraer lógica a hooks

En esta refactorización, los hooks se usan para GET con SWR y no para mover toda la lógica de UI.

Mover a hooks únicamente:

- Fetch de lectura (`get*`) desde `services/*`.
- Estado derivado de SWR (`loading`, `error`, `mutate`).
- Datos normalizados mínimos para consumo de UI (`items`, `total`).

Mantener en `services/*`:

- Implementación de endpoints (GET/POST/PATCH/DELETE).
- Construcción de query params y payloads.
- Funciones de acción del dominio (ejemplo: `toggle*`, `changeStatus*`, `assign*`).

Mantener en componentes:

- Apertura/cierre de diálogos.
- Eventos de UI y estado local de interacción.
- Flujos de crear/editar/eliminar cuando sean específicos de la pantalla.

Ejemplo base esperado:

```ts
/**
 * <Entidad> Data Hooks - SWR for data fetching
 */

import useSWR from "swr";
import { useCallback } from "react";
import { getEntidades } from "@/modules/<modulo>/<entidad>/services/<entidad>.service";
import {
  Entidad,
  EntidadesListResponse,
} from "@/modules/<modulo>/<entidad>/interfaces/<entidad>.interface";

export const useEntidadesData = (search?: string) => {
  const { data, error, isLoading, mutate } = useSWR<EntidadesListResponse>(
    ["<entidad>-list", search],
    ([, s]) => getEntidades(s),
    { revalidateOnFocus: false },
  );

  return {
    entidades: data?.entidades ?? [],
    total: data?.total ?? 0,
    loading: isLoading,
    error,
    mutate: useCallback(() => mutate(), [mutate]),
  };
};
```

### Paso 4: Consolidar validación

- Unificar validaciones en `schemas/` con Zod.
- Mantener mensajes en español y consistentes.
- Evitar validaciones duplicadas entre form y submit.

### Paso 5: Normalizar contratos de datos

- Crear/ajustar `interfaces/` del módulo.
- Añadir mappers (`utils/*.mapper.ts`) cuando la forma API no coincida con la forma UI.
- Evitar contratos anónimos inline extensos en componentes.

### Paso 5.1: Consolidar servicios

- Centralizar llamadas HTTP en `services/*.service.ts`.
- Evitar llamadas directas de red dentro de `components/*` y `hooks/*` (excepto invocar funciones de service).
- Mantener naming consistente por entidad: `get*`, `create*`, `update*`, `delete*`.

### Paso 5.2: Evaluar store (opcional)

- Crear `store/*` solo cuando el estado necesite persistencia o compartición real entre múltiples componentes.
- Si el estado es local de una pantalla, dejarlo en el componente.

### Paso 6: Homogeneizar UX de listas/formularios

Aplicar patrón ya acordado en repo:

- `DeleteConfirmDialog` con estado explícito (`deleteDialog`, `selectedItem`, `isDeleting`).
- Menú contextual por fila (botón engranaje + `Menu` de PrimeReact).
- Header estándar de `DataTable` con título, total, filtros, búsqueda y `CreateButton`.
- `isActive` enviado como string (`"true" | "false"`) cuando aplique.

### Paso 7: Limpieza de imports y dead code

- Eliminar exports legacy.
- Remover funciones no usadas.
- Evitar barrels cíclicos.

---

## 5. Criterios de Aceptación por Módulo

Un módulo refactorizado se considera completo cuando:

- Compila sin errores de TypeScript en verificación estricta.
- Mantiene comportamiento funcional previo (sin regresiones visibles).
- Sigue estructura objetivo (components/hooks/interfaces/schemas/services y store opcional).
- No contiene llamadas API duplicadas en múltiples componentes.
- Tiene una API pública clara vía `index.ts`.
- No rompe convenciones de UI ya establecidas en el proyecto.

---

## 6. Comandos de Verificación

Desde `frontend/`:

```bash
npm run lint
npm run build
npx tsc --noEmit
```

Notas:

- `npm run build` puede pasar aunque existan errores TS por configuración actual.
- La verificación confiable de tipos es `npx tsc --noEmit`.

---

## 7. Plan Plantilla para Refactorizar un Módulo Nuevo

Usar esta plantilla por cada módulo:

1. Crear estructura base (`components`, `hooks`, `interfaces`, `schemas`, `services`, `utils`, `index.ts` y `store` si aplica).
2. Mover componentes existentes sin cambiar comportamiento.
3. Crear hooks de lectura GET con SWR (`use*Data`) conectados a `get*` services.
4. Centralizar toda llamada HTTP en `services/*.service.ts`.
5. Unificar validación con Zod.
6. Introducir mappers e interfaces explícitas.
7. Alinear listas/forms al patrón estándar del repo.
8. Limpiar exports/imports legacy.
9. Ejecutar lint/build/tsc y corregir errores.
10. Documentar decisiones del módulo (si hubo excepciones).

---

## 8. Anti-Patrones a Evitar

- Componentes “todo en uno” con más de una responsabilidad principal.
- Lógica de API dispersa en múltiples componentes del mismo módulo.
- Llamadas HTTP directas dentro de componentes (sin pasar por `services/*`).
- `type` para contratos principales cuando el estándar acordado del módulo es `interface`.
- `any` en contratos clave de formularios o respuestas.
- Validación distinta entre crear y editar sin razón funcional.
- Importar internals desde rutas profundas de otro módulo.
- Repetir UI pattern distinto al estándar cuando ya existe uno válido.

---

## 9. Convención de Migración Incremental

Para evitar romper el flujo de trabajo:

- Refactor por módulo, no por toda la app a la vez.
- Mantener compatibilidad temporal de imports cuando sea necesario.
- Cerrar cada módulo con verificación completa antes de iniciar el siguiente.
- Si un módulo requiere excepción de arquitectura, documentarla en `contextos/`.

---

## 10. Definición de "Done" Global

La migración de `frontend/modules` está finalizada cuando:

- Todos los módulos activos siguen una estructura equivalente.
- Los patrones de List/Form están homogeneizados.
- No quedan servicios de UI duplicados ni exports legacy críticos.
- La base es suficientemente consistente para escalar nuevos módulos sin rediseño.
