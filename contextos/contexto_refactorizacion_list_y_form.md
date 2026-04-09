# Contexto: Refactorización Estándar para Listados y Formularios

Este documento describe el patrón estándar adoptado para la refactorización de los componentes tipo `List` (ej. `EmpresasList`, `UsuarioList`, `CategoryList`) y sus respectivos `Form` (ej. `EmpresaForm`, `UsuarioForm`, `CategoryForm`).

El objetivo es unificar la experiencia de usuario (UX) y simplificar el mantenimiento mediante el uso de componentes reutilizables y patrones consistentes.

## 1. Patrón para Componentes `List`

### Estado para Diálogo de Eliminación (DeleteConfirmDialog)

- **Importante**: Mantener un estado **separado** `deleteDialog` (booleano) para controlar la visibilidad del `DeleteConfirmDialog`, NO usar `visible={!!selectedItem}`.
- El flujo correcto es:
  1. Click en "Eliminar" → `confirmDeleteItem(item)` establece `selectedItem` Y `setDeleteDialog(true)`
  2. En `onHide` del DeleteConfirmDialog limpiar ambos: `setDeleteDialog(false); setSelectedItem(null)`
  3. Mantener un estado `isDeleting` (booleano) para el loading del botón de confirmación**Implementación**:

```tsx
const [selectedItem, setSelectedItem] = useState<Item | null>(null);
const [deleteDialog, setDeleteDialog] = useState<boolean>(false);
const [isDeleting, setIsDeleting] = useState<boolean>(false);

const confirmDeleteItem = (item: Item) => {
  setSelectedItem(item);
  setDeleteDialog(true);
};

const handleDelete = async () => {
  setIsDeleting(true);
  try {
    await itemService.delete(selectedItem.id);
    // success toast
  } finally {
    setIsDeleting(false);
  }
};

// En JSX:
<DeleteConfirmDialog
  visible={deleteDialog}
  onHide={() => {
    setDeleteDialog(false);
    setSelectedItem(null);
  }}
  onConfirm={handleDelete}
  itemName={selectedItem?.name}
  isDeleting={isDeleting}
/>;
```

### Filtro `isActive` en Parámetros

- **Importante**: El parámetro `isActive` debe pasarse como **STRING** `"true"` o `"false"`, NO como booleano.
- El backend espera strings para la comparación: `if (isActive === 'true')`
- **Implementación correcta**:

```tsx
const response = await serviceService.getAll({
  page: page + 1,
  limit: rows,
  search: searchQuery || undefined,
  isActive: showActive ? "true" : undefined, // STRING, not boolean!
});
```

- **Nota**: El interface TypeScript de parámetros debe ser `isActive?: string | boolean;` para soportar ambos

### Columna de Acciones (Menú Flotante)

- **Antes**: Botones en línea (`Button`) por cada acción en cada fila.
- **Ahora**: Un único botón de engranaje (cog) que despliega un menú contextual (`Menu` de PrimeReact).

**Imports necesarios**:

```tsx
import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";
```

**State y Refs**:

```tsx
const menuRef = useRef<Menu>(null);
const [actionItem, setActionItem] = useState<Item | null>(null);
```

**Función getMenuItems()**:

```tsx
const getMenuItems = (item: Item | null): MenuItem[] => {
  if (!item) return [];
  return [
    {
      label: "Editar",
      icon: "pi pi-pencil",
      command: () => editItem(item),
    },
    {
      label: "Cambiar Estado",
      icon: item.isActive ? "pi pi-pause" : "pi pi-play",
      command: () => handleToggleItem(item),
    },
    {
      separator: true,
    },
    {
      label: "Eliminar",
      icon: "pi pi-trash",
      className: "p-menuitem-danger", // ← Estilos para acción destructiva
      command: () => confirmDeleteItem(item),
    },
  ];
};
```

**Template de acciones en la columna**:

```tsx
const actionBodyTemplate = (rowData: Item) => {
  return (
    <Button
      icon="pi pi-cog"
      rounded
      text
      onClick={(e) => {
        setActionItem(rowData);
        menuRef.current?.toggle(e);
      }}
      aria-controls="item-menu"
      aria-haspopup
      tooltip="Opciones"
      tooltipOptions={{ position: "left" }}
    />
  );
};
```

**Columna en DataTable**:

```tsx
<Column
  header="Acciones"
  body={actionBodyTemplate}
  exportable={false}
  frozen={true}
  alignFrozen="right"
  style={{ width: "6rem", textAlign: "center" }}
  headerStyle={{ textAlign: "center" }}
/>
```

**Menu component al final del JSX** (antes del cierre de `motion.div` o componente raíz):

```tsx
<Menu model={getMenuItems(actionItem)} popup ref={menuRef} id="item-menu" />
```

**Notas importantes**:

- El `id` del Menu debe coincidir con `aria-controls` del Button
- `popup` habilita el comportamiento de menú flotante context
- `menuRef.current?.toggle(e)` abre/cierra el menú (no usar `hide()`)
- El Menu se renderiza **una sola vez** al final, no en cada fila
- `actionItem` almacena el item sobre el cual se abrió el menú

### Botón de Crear

- Reemplazar el botón primitivo `<Button label="Nuevo..." />` por el componente reutilizable `<CreateButton label="Nuevo..." onClick={openNew} />` importado de `@/components/common/CreateButton`.

### Diálogo de Eliminación (`DeleteConfirmDialog`)

- **Antes**: Diálogos de confirmación definidos inline con sus propios botones y lógica de loading dispersa.
- **Ahora**: Utilizar el componente `<DeleteConfirmDialog>`.
- **Implementación**:
  - Mantener un estado `isDeleting` (boolean).
  - El método de eliminación (ej. `handleDelete`) debe activar `setIsDeleting(true)` al inicio, realizar la petición, mostrar toast de éxito/error, y finalmente apagar el estado en el bloque `finally`.
  - Pasar los props al diálogo: `visible`, `onHide`, `onConfirm={handleDelete}`, `itemName={item.name}`, `isDeleting={isDeleting}`.

### Configuración de DataTable

- **Propiedades requeridas**:
  - `paginator` - Habilitar paginación
  - `lazy` - Cargar datos bajo demanda
  - `scrollable` - **Requerido**: Habilitar scroll horizontal para tablas responsivas
  - `sortMode="multiple"` - Permitir ordenamiento por múltiples columnas
  - `rowsPerPageOptions={[5, 10, 25, 50]}` - Opciones de filas por página
  - `emptyMessage="No se encontraron..."` - Mensaje cuando no hay datos

**Implementación correcta**:

```tsx
<DataTable
  value={items}
  paginator
  first={page * rows}
  rows={rows}
  totalRecords={totalRecords}
  rowsPerPageOptions={[5, 10, 25, 50]}
  onPage={onPageChange}
  dataKey="id"
  loading={loading}
  header={header}
  emptyMessage="No se encontraron items"
  sortMode="multiple"
  lazy
  scrollable
>
  {/* Columns */}
</DataTable>
```

### Configuración de Columnas

- Asegurarse de que la columna de acciones tenga:
  - `header="Acciones"` - **Requerido**: El header debe incluir una etiqueta descriptiva
  - `alignFrozen="right"` - Alinear a la derecha cuando se congela
  - `frozen={true}` - Congelar la columna en su lugar
  - `style={{ width: "6rem", textAlign: "center" }}` - Tamaño fijo y centrado
  - `headerStyle={{ textAlign: "center" }}` - Header también centrado

**Implementación correcta**:

```tsx
<Column
  header="Acciones"
  body={(rowData) => (
    <Button
      icon="pi pi-cog"
      rounded
      text
      aria-controls="popup_menu"
      aria-haspopup
      onClick={(e) => {
        setActionItem(rowData);
        menuRef.current?.toggle(e);
      }}
      tooltip="Opciones"
      tooltipOptions={{ position: "left" }}
    />
  )}
  exportable={false}
  frozen={true}
  alignFrozen="right"
  style={{ width: "6rem", textAlign: "center" }}
  headerStyle={{ textAlign: "center" }}
/>
```

---

## 2. Patrón para Componentes `Form`

### Validación OnBlur

- Configurar el hook `useForm` de React Hook Form con `mode: "onBlur"`. Esto permite validar y mostrar errores de los campos al perder el foco en lugar de esperar al submit.
- **Implementación**:

```tsx
const {
  control,
  handleSubmit,
  reset,
  formState: { errors, isSubmitting },
} = useForm<FormData>({
  resolver: zodResolver(mySchema),
  mode: "onBlur", // ← REQUERIDO: Validar al perder el foco
  defaultValues: {
    field1: "",
    field2: "",
  },
});
```

- **Ventajas**: Feedback inmediato al usuario sin esperar submit, mejor UX
- **Nota**: `onBlur` es el modo recomendado para formularios multiclase

### Manejo de Errores (`handleFormError`)

- **Patrón centralizado**: No repetir lógica de error handling en cada formulario.
- Usar el helper `handleFormError` importado de `@/utils/errorHandlers`.
- **⚠️ Importante**: El Form **solo maneja errores**, NO muestra toasts de éxito.
- Los toasts de éxito se muestran en el componente **List padre** (en `onSave` callback)
- **Beneficios**:
  - Consistencia en mensajes de error entre todos los formularios
  - Manejo automático de AxiosError y extracción de mensajes del backend
  - Evita duplicación de mensajes (form + list parent)
  - El List padre tiene contexto completo para mensajes más específicos

**Implementación correcta en Form:**

```tsx
import { handleFormError } from "@/utils/errorHandlers";

const onSubmit = async (data: FormData) => {
  if (onSubmittingChange) onSubmittingChange(true);
  try {
    // Solo API call, SIN toast de éxito
    if (model?.id) {
      await itemService.update(model.id, data);
    } else {
      await itemService.create(data);
    }
    await onSave(); // El List padre muestra el toast de éxito
  } catch (error: any) {
    handleFormError(error, toast); // ✓ Solo manejar error aquí
  } finally {
    if (onSubmittingChange) onSubmittingChange(false);
  }
};
```

**Implementación en List padre (ItemModelList):**

```tsx
const handleSave = () => {
  toast.current?.show({
    severity: "success",
    summary: "Éxito",
    detail: selectedModel?.id
      ? "Modelo actualizado correctamente"
      : "Modelo creado correctamente",
    life: 3000,
  });
  loadModels(); // Recargar lista
  setFormDialog(false); // Cerrar dialog
};
```

**✗ INCORRECTO: Mostrar toasts de éxito en el Form**

```tsx
// ✗ NO: Esto causa duplicación
try {
  await itemService.create(data);
  toast.current?.show({               // ← NO, causa duplicado
    severity: "success",
    detail: "Creado correctamente",
  });
  await onSave();  // onSave también muestra otro toast → DUPLICADO
}
```

### Header del Dialog (`header` prop)

- El Dialog **no usa `header` como string simple**. Siempre se pasa un JSX con título, ícono y separador visual.
- Usar `maximizable` y `breakpoints` responsivos en todos los dialogs de formulario.

**Implementación correcta**:

```tsx
<Dialog
  visible={showForm}
  onHide={() => setFormDialog(false)}
  modal
  maximizable
  style={{ width: "75vw" }}
  breakpoints={{ "1400px": "75vw", "900px": "85vw", "600px": "95vw" }}
  header={
    <div className="mb-2 text-center md:text-left">
      <div className="border-bottom-2 border-primary pb-2">
        <h2 className="text-2xl font-bold text-900 mb-2 flex align-items-center justify-content-center md:justify-content-start">
          <i className="pi pi-ICON mr-3 text-primary text-3xl"></i>
          {selectedModel ? "Editar Modelo" : "Nuevo Modelo"}
        </h2>
      </div>
    </div>
  }
  footer={<FormActionButtons ... />}
>
  <MyForm ... />
</Dialog>
```

#### ✗ INCORRECTO: Header como string

```tsx
<Dialog header="Nuevo Modelo" style={{ width: "90vw", maxWidth: "850px" }}>
```

---

### Control del Submit Externo (`FormActionButtons`)

- **Antes**: El formulario contenía sus propios botones de Guardar y Cancelar al final del form.
- **Ahora**: Los botones se renderizan en el `footer` del `Dialog` padre usando `<FormActionButtons>`.
- **⚠️ Importante**:
  - El formulario interno **NO debe contener sus propios botones de acción**. Todos los botones (Guardar, Cancelar, Actualizar) deben controlarse desde el footer del Dialog usando `FormActionButtons`.
  - El Form **NO debe recibir `onCancel`** - el cancel se maneja en el Dialog padre (`setFormDialog(false)`)
  - El Form **NO debe recibir `hideFormDialog`** u otros callbacks de navegación

- **Props que SÍ debe recibir el Form**:
  - `model` - Dato a editar (null = crear nuevo)
  - `formId` - ID del form para sincronizar con FormActionButtons
  - `onSave` - Callback cuando la operación es exitosa (puede ser `async`)
  - `onSubmittingChange` - Para comunicar estado de carga al Dialog
  - Cualquier otra prop específica del negocio (ej. `toast`)

- **Implementación en Dialog padre**:

```tsx
<Dialog
  footer={
    <FormActionButtons
      formId="model-form"
      isUpdate={!!selectedModel?.id}
      onCancel={() => setFormDialog(false)} // ← Cancel se maneja aquí
      isSubmitting={isSubmitting}
    />
  }
>
  <ItemModelForm
    model={selectedModel}
    formId="model-form"
    onSave={handleSave}
    onSubmittingChange={setIsSubmitting}
    toast={toast}
    // ✗ NO pasar: onCancel, hideFormDialog, etc.
  />
</Dialog>
```

**Implementación correcta en Form:**

```tsx
// ✓ CORRECTO: Solo props necesarias para el form
interface ItemModelFormProps {
  model: Model | null;
  formId?: string;
  onSave: () => void | Promise<void>;  // Puede ser async
  onSubmittingChange?: (isSubmitting: boolean) => void;
  toast: React.RefObject<any>;
  // ✗ NO incluir: onCancel, hideFormDialog, etc.
}

export default function ItemModelForm({
  model,
  formId,
  onSave,
  onSubmittingChange,
  toast,
}: ItemModelFormProps) {
  const { control, handleSubmit } = useForm({ mode: "onBlur" });

  const onSubmit = async (data: FormData) => {
    if (onSubmittingChange) onSubmittingChange(true);
    try {
      // API call
      if (model?.id) {
        await itemService.update(model.id, data);
        toast.current?.show({ severity: "success", detail: "Actualizado..." });
      } else {
        await itemService.create(data);
        toast.current?.show({ severity: "success", detail: "Creado..." });
      }
      await onSave();  // ✓ Usar await en caso de que onSave sea async
    } catch (error: any) {
      handleFormError(error, toast);  // ✓ Usar helper centralizado para errores
    } finally {
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  return (
    <form id={formId || "model-form"} onSubmit={handleSubmit(onSubmit)}>
      {/* Solo campos de input, SIN botones, SIN onCancel */}
      <div className="col-12">
        <label>Nombre</label>
        <Controller name="name" control={control} render={...} />
      </div>
      {/* ... más campos ... */}
    </form>
  );
}

// ✗ INCORRECTO: Nunca hagas esto
// interface ItemModelFormProps {
//   model: Model | null;
//   onCancel: () => void;  ← ELIMINAR
//   hideFormDialog: () => void;  ← ELIMINAR
// }
// <form>
//   <div>Campos...</div>
//   <div className="flex justify-content-end gap-2">
//     <Button label="Cancelar" onClick={onCancel} />  ← ELIMINAR
//     <Button label="Guardar" type="submit" /> ← ELIMINAR
//   </div>
// </form>
```

**Implementación en ItemModelList:**

```tsx
<Dialog
  footer={
    <FormActionButtons
      formId="model-form"
      isUpdate={!!selectedModel?.id}
      onCancel={() => setFormDialog(false)}
      isSubmitting={isSubmitting}
    />
  }
>
  <ItemModelForm
    model={selectedModel}
    formId="model-form"
    onSave={handleSave}
    onSubmittingChange={setIsSubmitting}
  />
</Dialog>
```

## Ejemplo de Uso (Resumen)

_List.tsx:_

```tsx
const [isDeleting, setIsDeleting] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);
const [actionItem, setActionItem] = useState(null);
const menuRef = useRef(null);

const formFooter = <FormActionButtons formId="my-form" isSubmitting={isSubmitting} ... />;

// en JSX:
<Dialog footer={formFooter}>
   <MyForm formId="my-form" onSubmittingChange={setIsSubmitting} />
</Dialog>
<DeleteConfirmDialog isDeleting={isDeleting} ... />
<Menu model={getMenuItems(actionItem)} popup ref={menuRef} />
```

_Form.tsx:_

```tsx
const { handleSubmit, control } = useForm({ mode: "onBlur", ... });

const onSubmit = async (data) => {
   if (onSubmittingChange) onSubmittingChange(true);
   try { /* guardar api */ }
   finally { if (onSubmittingChange) onSubmittingChange(false); }
};

return <form id={formId} onSubmit={handleSubmit(onSubmit)}>...</form>;
```

Con este estándar garantizamos que cualquier módulo nuevo o refactorizado posea el mismo look & feel, los mismos loaders en acciones destructivas o de guardado, y un código mucho más limpio.

---

## 3. Errores Comunes y Soluciones

### Menu / MenuItem - Importaciones

- **✗ INCORRECTO**: Importar `MenuItem` desde `primereact/menu`

  ```tsx
  import { Menu, MenuItem } from "primereact/menu"; // ✗ Error: MenuItem no se exporta
  ```

- **✓ CORRECTO**: `MenuItem` viene de `primereact/menuitem`
  ```tsx
  import { Menu } from "primereact/menu";
  import { MenuItem } from "primereact/menuitem";
  ```

### MenuItem - Propiedades para Estilos

- **✗ INCORRECTO**: Usar `severity="danger"` en MenuItem

  ```tsx
  const getMenuItems = (item) => [
    {
      label: "Eliminar",
      severity: "danger", // ✗ No existe in MenuItem
      command: () => confirmDelete(item),
    },
  ];
  ```

- **✓ CORRECTO**: Usar `className="p-menuitem-danger"` para items peligrosos
  ```tsx
  const getMenuItems = (item) => [
    {
      label: "Editar",
      icon: "pi pi-pencil",
      command: () => editItem(item),
    },
    {
      separator: true,
    },
    {
      label: "Eliminar",
      icon: "pi pi-trash",
      className: "p-menuitem-danger", // ✓ Usar className para styling
      command: () => confirmDelete(item),
    },
  ];
  ```

### DeleteConfirmDialog - Nesting

- **✗ INCORRECTO**: Envolver DeleteConfirmDialog dentro de un Dialog

  ```tsx
  <Dialog visible={deleteDialog} onHide={() => setDeleteDialog(false)}>
    <DeleteConfirmDialog
      itemName={selectedItem.name}
      onConfirm={handleDelete}
      onCancel={() => setDeleteDialog(false)} // ✗ No existe
    />
  </Dialog>
  ```

- **✓ CORRECTO**: DeleteConfirmDialog es un componente completo independiente
  ```tsx
  <DeleteConfirmDialog
    visible={deleteDialog}
    onHide={() => setDeleteDialog(false)}
    itemName={selectedItem.name}
    isDeleting={isDeleting}
    onConfirm={handleDelete}
  />
  ```

### onSave Signature - Async Support

- **✗ INCORRECTO**: Cambiar la signature de `onSave`

  ```tsx
  interface FormProps {
    onSave: () => void; // Limitado, no soporta async
  }
  ```

- **✓ CORRECTO**: Permitir Promises en onSave

  ```tsx
  interface FormProps {
    onSave: () => void | Promise<void>; // ✓ Soporta ambas
  }

  // En el Form:
  const onSubmit = async (data: FormData) => {
    try {
      await apiCall(data);
      await onSave(); // ✓ Usar await para soportar async
    } catch (error) {
      handleFormError(error, toast);
    }
  };
  ```
