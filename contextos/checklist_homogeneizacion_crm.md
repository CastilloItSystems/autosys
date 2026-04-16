# Checklist de Homogeneización CRM

Objetivo: que todas las pantallas CRM sigan el mismo estándar de `List + Form` definido en `contexto_refactorizacion_list_y_form.md`.

## Criterios estándar (DoD por pantalla)

- [ ] Usa `CreateButton` para crear registros.
- [ ] Usa `Menu` + `MenuItem` (`primereact/menuitem`) para acciones por fila.
- [ ] Acción destructiva con `className="p-menuitem-danger"`.
- [ ] Si hay borrado, usa `DeleteConfirmDialog` con estados `deleteDialog`, `selectedItem`, `isDeleting`.
- [ ] `DataTable` con: `paginator`, `lazy`, `scrollable`, `sortMode="multiple"`, `rowsPerPageOptions`, `emptyMessage`.
- [ ] Columna de acciones homogénea (header, ancho fijo, centrado; frozen si aplica).
- [ ] Formulario separado (`*Form.tsx`) con `react-hook-form` en `mode: "onBlur"`.
- [ ] Errores del form por `handleFormError`.
- [ ] Éxitos se muestran en el componente `List` padre (no en el form).
- [ ] Dialog de formulario con header JSX consistente, `maximizable`, `breakpoints`.
- [ ] Footer de dialog con `FormActionButtons`.

## Backlog de pantallas CRM por homogeneizar

### Prioridad Alta (impacto diario)

- [x] `frontend/components/crm/leads/LeadList.tsx`
- [ ] `frontend/components/crm/leads/LeadKanban.tsx` (aplicar solo partes compatibles: dialogs, errores, acciones)
- [x] `frontend/components/crm/leads/LeadForm.tsx`
- [x] `frontend/components/crm/cases/CaseList.tsx`
- [x] `frontend/components/crm/cases/CaseForm.tsx`
- [x] `frontend/components/crm/quotes/QuoteList.tsx`
- [x] `frontend/components/crm/quotes/QuoteForm.tsx`

### Prioridad Media (seguimiento y operación)

- [ ] `frontend/components/crm/activities/ActivityList.tsx`
- [ ] `frontend/components/crm/activities/ActivityForm.tsx`
- [ ] `frontend/components/crm/interactions/InteractionList.tsx`
- [ ] `frontend/components/crm/interactions/InteractionForm.tsx`
- [ ] `frontend/components/crm/customer/CustomerCrmList.tsx` (validar que ya cumpla todo)
- [ ] `frontend/components/crm/customer/CustomerCrmForm.tsx` (validar que ya cumpla todo)

### Prioridad Baja (nuevo módulo CRM ya alineado parcialmente)

- [x] `frontend/components/crm/opportunities/OpportunityList.tsx` (reemplaza `OpportunityBoard.tsx`)
- [x] `frontend/components/crm/opportunities/OpportunityForm.tsx`
- [x] `frontend/app/empresa/crm/campanas/page.tsx`
- [x] `frontend/components/crm/campaigns/CampaignForm.tsx`
- [x] `frontend/app/empresa/crm/fidelizacion/page.tsx`
- [x] `frontend/components/crm/loyalty/LoyaltyForm.tsx`

## Secuencia recomendada de ejecución

1. [ ] Leads (List + Form + Kanban)
2. [x] Cases (List + Form)
3. [x] Quotes (List + Form)
4. [ ] Activities + Interactions
5. [ ] Revisión final de Customer
6. [x] Ajustes finales de Opportunities/Campañas/Fidelización
7. [ ] QA visual end-to-end CRM

## QA de homogeneidad (pasada final)

- [ ] Mismo patrón de botones primarios/secundarios en dialogs.
- [ ] Mismos textos de empty state por módulo.
- [ ] Mismos tiempos y estilo de toasts.
- [ ] Mismo comportamiento de loading en submit/delete.
- [ ] Menús de acciones consistentes en íconos y orden.
- [ ] Navegación CRM sin inconsistencias visuales entre módulos.

## Validación técnica

- [ ] `cd frontend && npm run build`
- [ ] Revisión manual de rutas:
  - [ ] `/empresa/crm`
  - [ ] `/empresa/crm/leads`
  - [ ] `/empresa/crm/oportunidades`
  - [ ] `/empresa/crm/casos`
  - [ ] `/empresa/crm/cotizaciones`
  - [ ] `/empresa/crm/actividades`
  - [ ] `/empresa/crm/interacciones`
  - [ ] `/empresa/crm/clientes`
  - [ ] `/empresa/crm/campanas`
  - [ ] `/empresa/crm/fidelizacion`
