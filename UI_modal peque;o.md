# Patrones de UI - AutoSys

## 🪟 Diálogos de Confirmación

Para mantener consistencia visual en los diálogos de confirmación (guardar cambios, eliminar, etc.), utilizar la siguiente estructura con PrimeReact.

### Estructura Estándar

```tsx
<Dialog
  visible={showDialog}
  onHide={() => setShowDialog(false)}
  header="Título del Diálogo" // Ej: "Confirmar Cambios"
  modal
  style={{ width: "450px" }}
  footer={
    <div className="flex gap-2 pb-3 px-1">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        severity="secondary"
        onClick={() => setShowDialog(false)}
        className="flex-1" // Ocupa 50% del ancho
      />
      <Button
        label="Confirmar" // Ej: "Guardar Todo", "Eliminar"
        icon="pi pi-check"
        onClick={handleConfirm}
        loading={loading}
        className="flex-1" // Ocupa 50% del ancho
        autoFocus
        // severity="danger" // Usar si es acción destructiva
      />
    </div>
  }
>
  <div className="confirmation-content flex align-items-center gap-3">
    {/* Icono de Alerta */}
    <i
      className="pi pi-exclamation-triangle"
      style={{ fontSize: "2rem", color: "var(--yellow-500)" }} // Amarillo para advertencia
      // style={{ fontSize: "2rem", color: "var(--red-500)" }} // Rojo para peligro
    />

    {/* Mensaje */}
    <div className="flex flex-column">
      <span>
        Mensaje principal de confirmación. <b>Texto destacado</b>.
      </span>
      {/* Subtexto opcional */}
      <small className="text-500 mt-2">
        Detalle adicional o consecuencia de la acción.
      </small>
    </div>
  </div>
</Dialog>
```

### Claves de Diseño:

1.  **Ancho:** `style={{ width: "450px" }}` para evitar que sea muy ancho.
2.  **Footer:**
    - Usar `flex gap-2` para separar botones.
    - `pb-3 px-1` en el contenedor para dar aire respecto al borde inferior.
    - `className="flex-1"` en los botones para que tengan el mismo ancho (50/50).
3.  **Cuerpo:**
    - Clase `confirmation-content`.
    - `flex align-items-center gap-3` para alinear icono y texto.
    - Icono grande (`2rem`) con color semántico (`yellow-500` o `red-500`).
