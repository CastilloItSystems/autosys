# Contexto: Refactorización - Dialogo de Confirmación de Eliminación

Se creó un componente reutilizable `DeleteConfirmDialog` para centralizar el comportamiento y la UI de confirmación de eliminación en listados.

Propósito

- Evitar duplicación de diálogos de confirmación en múltiples listados (usuarios, empresas, etc.).
- Unificar UX: mismo texto, botones, estado de carga y manejo de confirmación.

Patrón de uso

- Importar `DeleteConfirmDialog` desde `frontend/components/common/DeleteConfirmDialog.tsx`.
- Props principales:
  - `visible`: boolean — controla la visibilidad del diálogo.
  - `onHide`: () => void — oculta el diálogo.
  - `onConfirm`: () => Promise<void> | void — acción a ejecutar al confirmar.
  - `itemName`: string | ReactNode — nombre del item a mostrar en el mensaje.
  - `isDeleting?`: boolean — indica estado de borrado (muestra loader en el botón confirmar).

Ejemplo (patrón en `EmpresasList.tsx` y `UsuarioList.tsx`):

1. Mantener `const [isDeleting, setIsDeleting] = useState(false)`.
2. Cuando el usuario solicita borrar: setear el item y `setDeleteDialog(true)`.
3. En la acción de borrado (`deleteAction`) setear `setIsDeleting(true)` antes de la llamada asíncrona y `setIsDeleting(false)` en finally.
4. Pasar `isDeleting` a `DeleteConfirmDialog` para mostrar el estado de carga en el botón Confirmar.

Notas técnicas

- Mantener la acción de borrado como función separada para poder pasarla directamente a `onConfirm`.
- Evitar duplicar `Toast`/mensajes: el handler de eliminación puede mostrar `toast.current?.show(...)` tras éxito/ error.
- Si hay varias tablas en la misma vista, asegurarse de que los ids de los menús/aria-controls sean únicos.

Beneficios

- Menos código repetido, UX consistente, manejo centralizado de estados y textos.
