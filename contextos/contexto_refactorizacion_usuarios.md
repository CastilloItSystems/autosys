# Contexto de Refactorización: Módulo de Usuarios

Este documento registra los patrones, soluciones y estandarizaciones aplicadas durante la refactorización profunda del módulo de usuarios (`UsuarioList`, `UsuarioForm`, `UsuarioChangePasswordForm`, `UsuarioMemberships`, `MembershipForm`) y su integración con el backend. Sirve como guía para futuras vistas y formularios en el sistema.

## 1. Estandarización de Interfaz (UI/UX)

### 1.1 Modales (Dialogs)

Se estableció un patrón visual uniforme para todas las ventanas modales del sistema de usuarios:

- **Cabeceras (Headers):**
  - Contenedor: `flex align-items-center gap-2 border-bottom-2 border-primary pb-2`
  - Ícono: `text-primary text-3xl`
  - Texto: `text-2xl font-bold text-900`
- **Pies de página (Footers):**
  - Se eliminaron los botones internos de los componentes de formulario.
  - Se adoptó el componente global `<FormActionButtons />` inyectado directamente en la prop `footer` del Dialog.
  - Los formularios se vinculan al botón de confirmación (submit) mediante el atributo `id={formId}`.

### 1.2 Formularios y Campos

- **React Hook Form (Controller):** Todos los campos usan el patrón `Controller` de React Hook Form, especialmente necesario para componentes de PrimeReact.
- **Etiquetas y Obligatoriedad:**
  - Clase estándar para etiquetas: `block text-900 font-medium mb-2`.
  - Los campos obligatorios muestran un asterisco rojo: `<span className="text-red-500">*</span>`.
- **Selector Múltiple:** El campo `departamento` pasó de ser un input de texto a un `<MultiSelect>` con validación de array (`z.array(z.string())`) y visualización en chips (`display="chip"`).

## 2. Validación y Componentes Compartidos (Contraseñas)

Para evitar duplicidad de código y errores en las validaciones, se extrajo la lógica de contraseñas al componente `PasswordRequirements.tsx`.

- **UI Reactiva:** Un componente visual que verifica en tiempo real (con ticks verdes) si la contraseña cumple con: al menos 6 caracteres, mezcla de 2 tipos (mayúsculas, minúsculas, números, símbolos) y confirmación de contraseña.
- **Validadores de Zod Exportables:**
  - `passwordValidator`: Obligatorio (usado en creación y cambio explícito).
  - `optionalPasswordValidator`: Opcional (usado en edición de perfil), pero si el usuario escribe algo, aplica las reglas estrictas.
- **Bug Fix (PrimeReact Password):** Se descubrió que el `<Password>` de PrimeReact no propaga correctamente la refacción nativa (`ref`) usando `register()`. La solución definitiva es envolverlo en un `<Controller>` y pasar explícitamente `value`, `onChange` y `onBlur`.
- Se configuró `mode: "onBlur"` en los formularios para optimizar el rendimiento y la experiencia de usuario.

## 3. Manejo de Estado (Padre - Hijo)

Para mantener los botones en el modal (`UsuarioList`) pero la lógica en el formulario (`UsuarioForm`), se implementó un patrón de comunicación de estado:

- El componente hijo recibe un prop `onSubmittingChange?: (isSubmitting: boolean) => void`.
- Dentro de la función `onSubmit` del hijo, se emite `true` al inicio y `false` en el bloque `finally` del `try/catch`.
- El padre almacena este valor en un estado y se lo pasa a `<FormActionButtons isSubmitting={isSubmitting} />`.
- Se usa siempre `handleFormError(error, toast)` dentro del `catch` para unificar cómo se muestran los mensajes de error del API.

## 4. Corrección de Permisos en el Backend

### El Problema

Al crear o editar usuarios, el sistema arrojaba: _"No se encontró la membresía activa para esta empresa"_.

- **Causa:** Las rutas de `/users` eran de nivel global y no pasaban por el middleware `extractEmpresa`, por lo tanto `req.membership` estaba indefinido. El middleware `authorize()` requiere `req.membership` para evaluar los permisos.

### La Solución

1. Se añadió `extractEmpresa` en las rutas de creación y eliminación de usuarios (`users.routes.ts`), para proveer el contexto necesario al autorizador.
2. Se creó un "Custom Helper" llamado `checkSelfOrAuthorize(PERMISSIONS.USERS_UPDATE)` en las rutas de usuario. Este helper evalúa primero si el usuario está modificando su propio perfil (`req.user?.userId === req.params.id`); de ser así, permite el paso directo sin evaluar la membresía. Si no es su perfil, inyecta `extractEmpresa` y evalúa el permiso global correspondiente.

## 5. Próximos Pasos Recomendados (Basados en este módulo)

- Aplicar este estándar de Modales (`border-bottom`, iconos grandes y `<FormActionButtons>`) a los módulos de Inventario y Empresa.
- Aplicar el mismo componente de visualización `PasswordRequirements` si existe alguna funcionalidad extra (ej. Reseteo de contraseña desde Login).
- Usar el estándar de "Asterisco Rojo" en el resto de los componentes del sistema para UX predecible.
