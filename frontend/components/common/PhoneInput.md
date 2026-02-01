# PhoneInput Component

Componente reutilizable para entrada de números telefónicos venezolanos con prefijos de operadores.

## Ubicación

`/components/common/PhoneInput.tsx`

## Características

- ✅ Dropdown con códigos de operadores venezolanos
- ✅ Validación automática de formato
- ✅ Muestra el operador asociado a cada código
- ✅ Limita la entrada a 7 dígitos
- ✅ Formato visual con espaciado automático (123 4567)
- ✅ Contador de caracteres visual
- ✅ Compatible con React Hook Form
- ✅ Manejo de errores visuales
- ✅ Guarda en formato completo: `+584261234567`

## Códigos Soportados

| Código | Operador |
| ------ | -------- |
| +58416 | Movistar |
| +58426 | Movistar |
| +58424 | Digitel  |
| +58414 | Movilnet |
| +58412 | Movilnet |

## Uso Básico

```tsx
import PhoneInput from "@/components/common/PhoneInput";

// Uso simple
<PhoneInput value={phone} onChange={(value) => setPhone(value)} />;
```

## Uso con React Hook Form

```tsx
import { Controller, useForm } from "react-hook-form";
import PhoneInput from "@/components/common/PhoneInput";

const {
  control,
  formState: { errors },
} = useForm();

<Controller
  name="telefono"
  control={control}
  render={({ field }) => (
    <PhoneInput
      value={field.value}
      onChange={field.onChange}
      error={!!errors.telefono}
      placeholder="1234567"
    />
  )}
/>;
```

## Props

| Prop          | Tipo                      | Default            | Descripción                                       |
| ------------- | ------------------------- | ------------------ | ------------------------------------------------- |
| `value`       | `string`                  | `""`               | Valor del teléfono completo (ej: "+584261234567") |
| `onChange`    | `(value: string) => void` | -                  | Callback cuando cambia el valor                   |
| `error`       | `boolean`                 | `false`            | Muestra estado de error                           |
| `disabled`    | `boolean`                 | `false`            | Deshabilita el input                              |
| `className`   | `string`                  | `""`               | Clases CSS adicionales                            |
| `placeholder` | `string`                  | `"Ingrese número"` | Placeholder del input                             |

## Formato de Datos

### Entrada (value)

El componente acepta números en formato completo:

- `"+584261234567"` ✅ Formato correcto
- `"04261234567"` ⚠️ Se parseará intentando extraer el código
- `""` ✅ Valor vacío

### Salida (onChange)

El componente siempre devuelve el formato completo:

```
"+58" + código (3 dígitos) + número (7 dígitos)
Ejemplo: "+584261234567"
```

## Validación

El componente incluye las siguientes validaciones automáticas:

- ✅ Solo acepta números (sin letras ni caracteres especiales)
- ✅ Limita a 7 dígitos el número local
- ✅ Formatea visualmente con espacio: "123 4567"
- ✅ Muestra contador 0/7 hasta 7/7

## Ejemplos de Uso

### Ejemplo 1: Formulario de Cliente

```tsx
<div className="col-12 md:col-6">
  <label htmlFor="telefono" className="block text-900 font-medium mb-2">
    Teléfono
  </label>
  <Controller
    name="telefono"
    control={control}
    render={({ field }) => (
      <PhoneInput
        value={field.value}
        onChange={field.onChange}
        error={!!errors.telefono}
      />
    )}
  />
  {errors.telefono && (
    <small className="p-error">{errors.telefono.message}</small>
  )}
</div>
```

### Ejemplo 2: Estado Simple

```tsx
const [phone, setPhone] = useState("");

<PhoneInput
  value={phone}
  onChange={setPhone}
  placeholder="Número de contacto"
/>;

// Resultado en phone: "+584261234567"
```

### Ejemplo 3: Disabled State

```tsx
<PhoneInput value={customerPhone} onChange={() => {}} disabled={true} />
```

## Estilos

El componente utiliza clases de PrimeReact y se adapta automáticamente al tema configurado. Incluye:

- Dropdown con ancho fijo de 140px
- Input flexible que ocupa el espacio restante
- Contador de caracteres con colores dinámicos:
  - Gris (text-500): Menos de 7 dígitos
  - Verde (text-success): 7 dígitos completos
  - Rojo (text-danger): Estado de error

## Integración con Validación

Para usar con Zod schema:

```tsx
import { z } from "zod";

const schema = z.object({
  telefono: z
    .string()
    .regex(/^\+58(416|426|424|414|412)\d{7}$/, {
      message: "Formato de teléfono inválido",
    })
    .optional()
    .or(z.literal("")),
});
```

## Notas Importantes

1. **Formato de almacenamiento**: Siempre guarda con formato internacional `+584XXXXXXXXX`
2. **Códigos válidos**: Solo acepta los 5 códigos de operadores venezolanos
3. **Longitud fija**: Número local siempre es de 7 dígitos
4. **Parsing inteligente**: Al recibir un valor, intenta detectar automáticamente el código

## Personalización

Para agregar más códigos o modificar operadores, edita el array `VENEZUELA_CODES`:

```tsx
const VENEZUELA_CODES = [
  { label: "+58 416", value: "+58416", operator: "Movistar" },
  // Agregar más códigos aquí
];
```

## Compatibilidad

- ✅ React 18+
- ✅ PrimeReact 10+
- ✅ React Hook Form 7+
- ✅ Next.js 13+ (App Router)
