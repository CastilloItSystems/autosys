# DOCUMENTO FUNCIONAL — MÓDULO DE TALLER AUTOMOTRIZ

## Sistema Integral de Gestión de Servicio

**Versión 2.0 — Consolidado**
Incluye procedimientos operativos CAMABAR C.A.
Abril 2026

---

# 1. Información General

## 1.1. Nombre del módulo

**Módulo de Taller Automotriz**

## 1.2. Objetivo

Gestionar integralmente la operación del taller automotriz, desde el agendamiento y recepción del vehículo hasta la ejecución del trabajo, control de repuestos, servicios externos, facturación, entrega, garantía y seguimiento postservicio, incorporando los controles operativos de garita, trazabilidad documental y protocolos de autorización jerárquica.

## 1.3. Propósito del módulo

Permitir a la empresa controlar de forma trazable, rentable y eficiente:

- Atención de clientes de taller
- Planificación de servicios
- Recepción de vehículos con inventario visual y fotográfico
- Diagnóstico técnico y detección de hallazgos ocultos
- Cotización y presupuesto de trabajos con aprobación formal del cliente
- Apertura y ejecución de órdenes de servicio/trabajo
- Consumo de repuestos e insumos con protocolo de firmas
- Gestión de servicios externos (T.O.T. — Trabajo en Otros Talleres)
- Control de mano de obra y tiempos técnicos
- Prueba de carretera con autorización jerárquica
- Control de calidad y escaneo electrónico post-reparación
- Control de garita/vigilancia (ingreso y egreso de vehículos y piezas)
- Entrega de vehículos con devolución de repuestos sustituidos
- Garantías y retrabajos
- Historial técnico del vehículo
- Trazabilidad digital y bitácora de eventos en tiempo real

## 1.4. Actores involucrados

Intervienen en el proceso los siguientes roles, conforme al manual operativo:

- Gerente de Servicio
- Gerente de Administración
- Gerencia General (casos extraordinarios)
- Asesor de Servicio
- Jefe de Taller
- Técnico / Mecánico especialista
- Almacenista / Bodeguero
- Administración / Caja
- Vigilancia / Garita
- Inspector / Responsable de Calidad
- Cliente (aprobaciones, firmas, conformidad)

---

# 2. Alcance del Módulo

El módulo cubrirá los siguientes procesos:

1. Agenda y citas de taller (con pre-diagnóstico telefónico)
2. Control de garita / vigilancia (ingreso y egreso)
3. Recepción del vehículo (inventario 360°, fotos, checklist, firma)
4. Inspección y diagnóstico (incluye hallazgos ocultos)
5. Cotización / presupuesto de servicios y repuestos
6. Aprobación de trabajos (firma, WhatsApp, correo)
7. Apertura y gestión de órdenes de servicio (OS/OT)
8. Asignación de técnicos, bahías y recursos
9. Control de tiempos y mano de obra
10. Solicitud, despacho y consumo de repuestos (con protocolo de firmas)
11. Gestión de servicios externos / T.O.T.
12. Trabajos adicionales y presupuestos suplementarios
13. Trazabilidad digital y bitácora en tiempo real
14. Escaneo electrónico post-reparación y certificación
15. Prueba de carretera (validación dinámica)
16. Control de calidad
17. Facturación de servicios
18. Entrega del vehículo (con devolución de repuestos sustituidos)
19. Gestión de garantías y retrabajos
20. Historial técnico y postventa
21. Dashboards e indicadores
22. Integraciones (CRM, inventario, compras, contabilidad)

---

# 3. Tipos de Servicio Soportados

El módulo debe permitir manejar al menos los siguientes tipos de atención:

- Mantenimiento preventivo
- Mantenimiento correctivo
- Diagnóstico técnico
- Servicios rápidos (cambio de aceite, filtros)
- Frenos, suspensión, motor, transmisión
- Electricidad / electrónica
- Aire acondicionado
- Alineación y balanceo
- Llantas
- Carrocería y pintura
- Instalación de accesorios
- Trabajos por garantía
- Trabajos por campaña
- Trabajos de aseguradora
- Servicio a flotillas o empresas
- Servicios con terceros / T.O.T. (Trabajo en Otros Talleres)

---

# 4. Objetivos Funcionales

1. Controlar el flujo completo del servicio de taller.
2. Reducir tiempos muertos y mejorar capacidad operativa.
3. Garantizar trazabilidad de cada intervención al vehículo.
4. Integrar el consumo de repuestos con inventario y protocolo de firmas.
5. Controlar productividad y eficiencia del personal técnico.
6. Formalizar aprobaciones de clientes y trabajos adicionales por medios verificables.
7. Mejorar la calidad del servicio y reducir retrabajos.
8. Facilitar la facturación correcta y oportuna.
9. Mantener historial completo del vehículo.
10. Soportar garantías, reclamos y seguimiento postservicio.
11. Gestionar servicios externos (T.O.T.) con trazabilidad de piezas.
12. Controlar ingreso y egreso de vehículos y piezas mediante garita.
13. Registrar jerarquía de autorizaciones para cada tipo de decisión.
14. Mantener bitácora digital en tiempo real de cada orden de servicio.

---

# 5. Estructura Funcional del Módulo

El módulo de taller estará compuesto por los siguientes submódulos:

1. Maestros y configuración
2. Agenda y citas (con pre-diagnóstico)
3. Control de garita / vigilancia
4. Recepción del vehículo
5. Diagnóstico e inspección (hallazgos ocultos)
6. Cotización / presupuesto de taller
7. Orden de servicio / trabajo (OS/OT)
8. Planificación y asignación
9. Mano de obra y tiempos técnicos
10. Repuestos e insumos (con protocolo de firmas)
11. Servicios externos / T.O.T.
12. Trabajos adicionales y presupuestos suplementarios
13. Trazabilidad digital y bitácora
14. Escaneo post-reparación y certificación electrónica
15. Prueba de carretera
16. Control de calidad
17. Facturación de taller
18. Entrega del vehículo
19. Garantías y retrabajos
20. Historial técnico del vehículo
21. Dashboards e indicadores
22. Integraciones y automatizaciones

---

# 6. Submódulo: Maestros y Configuración

## 6.1. Objetivo

Permitir parametrizar la operación del taller según la estructura de la empresa.

## 6.2. Catálogos principales

- Tipos de servicio
- Motivos de ingreso
- Asesores de servicio
- Técnicos / mecánicos
- Jefes de taller
- Especialidades técnicas
- Bahías / estaciones de trabajo
- Prioridades de atención
- Operaciones estándar con tiempos estándar
- Listas de precios de mano de obra
- Checklist de recepción, diagnóstico y control de calidad
- Tipos de garantía
- Causas de retrabajo
- Tipos de orden de servicio/trabajo
- Estados operativos y transiciones válidas
- Tipos de cliente taller
- Turnos de trabajo
- Proveedores de servicios externos (T.O.T.)
- Niveles de autorización jerárquica
- Puntos de control de garita

## 6.3. Reglas configurables

- Obligatoriedad de checklist de recepción
- Obligatoriedad de control de calidad por tipo de servicio
- Aprobación requerida para descuentos (con nivel jerárquico)
- Autorización para consumo sin stock
- Tolerancias de tiempos
- Reglas de facturación
- Vigencia de cotizaciones/presupuestos
- SLA de entrega (fecha promesa)
- Protocolo de firmas en entrega de repuestos (quién debe firmar)
- Niveles de autorización: Jefe Taller → Gerente Servicio → Administración → Gerencia General
- Obligatoriedad de devolución de repuestos sustituidos al cliente
- Cortesías estándar por OS (ej: lavado de vehículo)

---

# 7. Submódulo: Agenda y Citas

## 7.1. Objetivo

Programar y organizar las atenciones del taller según capacidad y disponibilidad, incluyendo un pre-diagnóstico telefónico para prever tipo de servicio, duración estimada y repuestos necesarios.

## 7.2. Funcionalidades

- Registrar cita (vía telefónica, redes sociales, presencial, web)
- Pre-diagnóstico: entrevista breve para determinar si es preventivo o correctivo
- Estimación de repuestos necesarios y costo preliminar al cliente
- Confirmación de disponibilidad de repuestos antes de asignar cita
- Reagendar, cancelar, confirmar cita
- Asignar asesor de servicio
- Consultar capacidad por día, técnico o bahía
- Recordatorio automático al cliente (24 horas antes mínimo)
- Registrar observaciones del cliente
- Convertir cita en recepción

## 7.3. Datos mínimos de una cita

- Cliente, vehículo (placa, modelo, marca)
- Fecha y hora
- Sucursal
- Tipo de servicio (preventivo/correctivo)
- Motivo de la cita / síntomas reportados
- Asesor asignado
- Duración estimada
- Repuestos pre-identificados y disponibilidad
- Costo estimado comunicado al cliente
- Estado, observaciones, origen (teléfono, redes, presencial, web, CRM)

## 7.4. Estados de cita

Programada → Confirmada → Atendida | Cancelada | No asistió | Reagendada | En espera

## 7.5. Reglas de negocio

- Una cita debe asociarse a cliente y vehículo.
- No debe exceder la capacidad configurada sin autorización.
- Debe verificarse asistencia al menos 24 horas antes de la cita.
- Toda cita atendida debe poder convertirse en recepción.
- Si se identifican repuestos en el pre-diagnóstico, verificar stock antes de confirmar cita.

---

# 8. Submódulo: Control de Garita / Vigilancia

## 8.1. Objetivo

Controlar físicamente el ingreso y egreso de vehículos, piezas, herramientas y personas al taller, manteniendo registro verificable de cada movimiento.

## 8.2. Funcionalidades

- Registro de ingreso de vehículo: placa, nombre del conductor, hora, kilometraje, seriales de motor y carrocería, color, modelo, marca
- Registro de egreso de vehículo: validación de pase de salida, hora, kilometraje final
- Control de salida de piezas a proveedores externos (T.O.T.): verificar orden de salida firmada por Asesor y Gerente de Servicio
- Control de salida de vehículo para prueba de carretera: verificar orden firmada, revisar materiales/herramientas que van en la unidad
- Control de reingreso de piezas desde proveedores externos
- Alerta si sale algo no especificado en la orden o ingresa algo no autorizado
- Registro fotográfico en garita si aplica

## 8.3. Datos mínimos de registro de garita

- Tipo de movimiento (ingreso vehículo, egreso vehículo, salida pieza, reingreso pieza, prueba carretera)
- Placa / identificación
- Nombre del conductor o responsable
- Fecha y hora
- Kilometraje (si aplica)
- Seriales de motor y carrocería (ingreso)
- Número de OS/OT asociada
- Orden de salida firmada (referencia)
- Observaciones
- Vigilante responsable

## 8.4. Reglas de negocio

- Ningún vehículo sale del taller sin pase de salida validado.
- Ninguna pieza sale sin orden firmada por Asesor de Servicio y Gerente de Servicio.
- Vigilancia debe reportar de inmediato a Gerencia General cualquier irregularidad.
- El registro de garita debe quedar vinculado a la OS/OT correspondiente.
- El kilometraje de salida y reingreso debe compararse automáticamente.

---

# 9. Submódulo: Recepción del Vehículo

## 9.1. Objetivo

Registrar formalmente el ingreso del vehículo al taller, documentando el estado inicial y requerimientos del cliente. El protocolo de bienvenida incluye inspección 360°, registro fotográfico y firma del cliente.

## 9.2. Funcionalidades

- Recepción con o sin cita previa
- Búsqueda o registro de cliente y vehículo
- Captura de kilometraje / horómetro
- Nivel de combustible
- Observaciones y síntomas reportados por el cliente
- Checklist de ingreso / inventario visual
- Inspección 360° de carrocería (golpes, rayones, detalles)
- Revisión de luces, corneta, relojes, funcionamiento general del vehículo
- Registro de daños preexistentes con zona del vehículo
- Registro de accesorios u objetos entregados y pertenencias internas
- Toma de fotografías (frontal, lateral, interior, daños, documentos)
- Firma digital del cliente
- Autorización de diagnóstico
- Sugerencia de mantenimientos correctivos adicionales al cliente durante la revisión
- Generación de presupuesto preliminar y aprobación/firma del cliente
- Apertura automática de mano de obra cortesía (lavado de vehículo)
- Generación de orden de recepción

## 9.3. Datos mínimos de recepción

Cliente, vehículo, asesor de servicio, fecha/hora ingreso, kilometraje, combustible, motivo de ingreso, observaciones del cliente, checklist completado, daños visibles con zona, accesorios/pertenencias entregadas, fecha promesa, estado, firma del cliente, autorización de diagnóstico, registro fotográfico.

## 9.4. Reglas de negocio

- No se debe abrir OS/OT sin recepción formal.
- El kilometraje debe validarse contra historial (no menor al último registrado salvo autorización).
- Debe existir trazabilidad del estado visual del vehículo (fotos obligatorias).
- Debe registrarse autorización del cliente para diagnóstico cuando aplique.
- Si el asesor detecta desperfectos adicionales, debe sugerirlos al cliente en el momento.
- Si el cliente aprueba trabajos adicionales, se actualiza el presupuesto y firma.
- Si el cliente rechaza sugerencias, se actualiza presupuesto solo con lo solicitado y firma.
- El presupuesto firmado debe archivarse en el expediente de la OS.
- La recepción debe poder originarse desde una cita.
- Toda recepción genera automáticamente una mano de obra cortesía de lavado de vehículo.

---

# 10. Submódulo: Diagnóstico e Inspección

## 10.1. Objetivo

Documentar hallazgos técnicos, necesidades del vehículo y trabajos recomendados, incluyendo la detección y gestión de hallazgos ocultos que surgen durante el desarme.

## 10.2. Funcionalidades

- Asignar técnico especialista para diagnóstico
- Completar checklist técnico
- Evaluación mecánica y electrónica (con escáner)
- Registrar hallazgos visibles
- Detectar y registrar hallazgos ocultos / daños no presupuestados
- Clasificar criticidad de cada hallazgo
- Evidencia visual obligatoria: fotografías y videos nítidos del deterioro
- Registrar lectura de scanner, códigos DTC
- Sugerir operaciones y repuestos
- Estimar tiempos y costos
- Generar presupuesto suplementario para hallazgos ocultos
- Comunicación al cliente con evidencia y aprobación verificable (WhatsApp, correo, firma)
- Generar recomendaciones futuras

## 10.3. Gestión de hallazgos ocultos

Cuando durante el desarme (ejemplo: culatas, radiadores, caja de cambios) aparecen fallas no presupuestadas:

1. El técnico toma fotografías y videos obligatorios del deterioro encontrado.
2. El Asesor genera un presupuesto suplementario (anexo) con nuevos repuestos y mano de obra.
3. Se informa al cliente detallando la razón técnica con evidencia visual.
4. No se procede sin autorización explícita y verificable del cliente.
5. Medios de autorización válidos: WhatsApp, correo electrónico o firma presencial.
6. Se advierte al cliente desde la recepción que pueden surgir hallazgos adicionales.

## 10.4. Reglas de negocio

- El diagnóstico debe quedar ligado a una recepción.
- Toda recomendación adicional debe quedar registrada.
- Puede existir más de un diagnóstico por recepción.
- Las recomendaciones deben poder convertirse en cotización/presupuesto.
- No se ejecuta ningún trabajo adicional sin autorización verificable del cliente.

---

# 11. Submódulo: Cotización / Presupuesto de Taller

## 11.1. Objetivo

Generar una propuesta económica formal de servicios, repuestos e insumos para aprobación del cliente, incluyendo presupuestos suplementarios por hallazgos.

## 11.2. Componentes

Mano de obra, operaciones estándar, repuestos, lubricantes, insumos, servicios externos (T.O.T.), descuentos, impuestos.

## 11.3. Funcionalidades

- Generar cotización/presupuesto desde recepción o diagnóstico
- Generar presupuesto suplementario (anexo) por hallazgos ocultos
- Agregar ítems manuales y automáticos
- Tomar precios desde listas vigentes
- Controlar costos y márgenes
- Aplicar descuentos (con autorización según nivel jerárquico)
- Versionar cotización/presupuesto
- Enviar al cliente
- Registrar aprobación total o parcial (con medio verificable: firma, WhatsApp, correo)
- Registrar rechazo con motivo
- Convertir ítems aprobados en OS/OT
- Incluir servicios T.O.T. con costo del proveedor externo

## 11.4. Estados

Borrador → Emitida → Enviada → Pendiente aprobación → Aprobada total | Aprobada parcial | Rechazada | Vencida → Convertida

## 11.5. Reglas de negocio

- Toda ampliación de trabajo debe pasar por presupuesto o aprobación equivalente.
- Debe existir historial de versiones.
- Descuentos por encima de umbral requieren autorización jerárquica.
- Solo ítems aprobados pueden pasar a ejecución facturable.
- El presupuesto firmado debe archivarse en el expediente de la OS.
- Cotizaciones rechazadas deben guardar motivo.

---

# 12. Submódulo: Orden de Servicio / Trabajo (OS/OT)

## 12.1. Objetivo

Administrar formalmente la ejecución de los trabajos aprobados sobre un vehículo.

## 12.2. Funcionalidades

- Crear OS/OT desde cotización aprobada o desde recepción según política
- Numeración automática
- Entrega del formato OS/OT y llaves al Jefe de Taller
- Jefe de Taller traslada físicamente el vehículo al área de taller
- Asignar responsable, prioridad, fecha promesa
- Administrar operaciones y tareas
- Controlar estado de la OS/OT
- Registrar observaciones
- Adjuntar documentos/evidencias
- Pausar, reanudar o cerrar trabajos
- Dividir tareas por técnico o especialidad

## 12.3. Datos mínimos

Número OS/OT, cliente, vehículo, recepción asociada, cotización asociada, asesor responsable, técnico principal, tipo de servicio, prioridad, fecha apertura, fecha promesa, estado, observaciones.

## 12.4. Estados de OS/OT

Borrador → Abierta → En diagnóstico → Pendiente aprobación → Aprobada → En proceso → Pausada | Esperando repuesto | Esperando autorización | Esperando cliente → Control de calidad → Lista para entrega → Entregada → Facturada → Cerrada | Anulada

## 12.5. Reglas de negocio

- No debe haber OS/OT sin cliente y vehículo identificados.
- No crear OS/OT sin recepción formal.
- Una OS/OT cerrada no puede modificarse sin reapertura autorizada.
- Una OS/OT anulada no debe generar facturación.
- Las transiciones de estado deben quedar auditadas.
- La fecha promesa debe ser visible en dashboard operativo.
- El formato de OS se entrega físicamente al Jefe de Taller junto con las llaves.

---

# 13. Submódulo: Planificación y Asignación

## 13.1. Objetivo

Distribuir la carga de trabajo entre técnicos, bahías y recursos del taller.

## 13.2. Funcionalidades

- Jefe de Taller revisa carga de trabajo y asigna vehículo a técnico especialista
- Asignar técnico principal y secundarios
- Asignar bahía o estación de trabajo
- Especificaciones de la intervención a realizar
- Programar inicio y fin estimados
- Consultar carga operativa del día
- Reprogramar y priorizar OT urgentes
- Visualizar ocupación de técnicos y bahías

## 13.3. Reglas de negocio

- No debe asignarse un técnico fuera de su jornada sin autorización.
- Una bahía no debe duplicarse en el mismo horario.
- La planificación debe contemplar disponibilidad de repuestos.
- Las reasignaciones deben quedar registradas.

---

# 14. Submódulo: Mano de Obra y Tiempos Técnicos

## 14.1. Objetivo

Controlar el tiempo trabajado por técnico y por operación, permitiendo medir productividad y eficiencia.

## 14.2. Funcionalidades

- Iniciar, pausar, reanudar y finalizar trabajo
- Registrar tiempo real y tiempo estándar por operación
- Comparar horas vendidas vs. horas consumidas
- Calcular productividad y eficiencia por técnico
- Registrar horas improductivas
- Soportar reloj manual o automático

## 14.3. Indicadores derivados

Productividad, eficiencia, ocupación, horas facturables, horas improductivas, cumplimiento de tiempos estándar.

## 14.4. Reglas de negocio

- Un técnico no debe tener dos trabajos activos simultáneamente si no está permitido.
- Toda imputación de tiempo debe quedar asociada a OS/OT y operación.
- Las correcciones de tiempo requieren permiso y auditoría.
- Una OS/OT no debe cerrarse sin finalizar sus tiempos activos.

---

# 15. Submódulo: Repuestos e Insumos en Taller

## 15.1. Objetivo

Controlar los materiales utilizados por cada OS/OT, integrando inventario, costos y protocolo de firmas para entrega.

## 15.2. Funcionalidades

- Asesor de Servicio solicita transferencia de repuestos/insumos en sistema
- Almacén aprueba la solicitud en sistema
- Repuesto/insumo se refleja automáticamente como transferido a la orden
- Asesor imprime la solicitud y accede al almacenista
- Entrega física con protocolo de firmas: Almacenista + Jefe de Taller o Asesor + Técnico asignado
- Apartado en almacén (Picking Area): repuestos separados por número de OS y placa
- Estatus "Comprometido": piezas salen del inventario disponible para evitar venta a terceros
- Entrega escalonada: técnico retira piezas según fase de armado mediante vales parciales
- Reservar, despachar, devolver repuestos
- Sustituir repuesto por equivalente autorizado
- Registrar insumos menores y kits de servicio
- Consultar disponibilidad
- Relacionar faltantes con compras/requisiciones

## 15.3. Archivo y resguardo

Una vez completado el protocolo de firmas, el Almacenista archiva la solicitud firmada en carpeta de "Transferencias o Solicitudes de Repuestos e Insumos de Taller". El Asesor de Servicio archiva copia en el expediente de la OS. Este archivo físico sirve como respaldo ante inventarios y auditorías.

## 15.4. Tipos de ítems

Repuesto facturable, insumo absorbido, lubricante, material de taller, servicio externo, repuesto de garantía, repuesto de cortesía.

## 15.5. Reglas de negocio

- No debe facturarse un repuesto no despachado.
- Todo consumo debe generar trazabilidad de inventario.
- Las devoluciones deben quedar registradas.
- El cambio de repuesto por equivalente debe quedar aprobado.
- Si no hay stock, debe dispararse requisición o alerta.
- La entrega de repuestos requiere firma de: Almacenista, Jefe de Taller o Asesor, y Técnico asignado.
- Lo transferido a la orden alimenta automáticamente lo que será facturado.

---

# 16. Submódulo: Servicios Externos / T.O.T. (Trabajo en Otros Talleres)

## 16.1. Objetivo

Gestionar trabajos que requieren servicios de empresas especializadas externas que complementan la OS (ejemplo: rectificadoras, servicios que no se ejecutan en el taller propio).

## 16.2. Funcionalidades

- Registrar necesidad de servicio externo asociado a una OS/OT
- Generar orden de salida de piezas firmada por Gerente de Servicio
- Registro fotográfico de la pieza y sus seriales antes de salir del taller
- Detalle del daño o reparación a realizar y número de OS
- Instrucción específica del proceso técnico solicitado al proveedor
- Control de salida por vigilancia (verificar orden firmada por Asesor y Gerente)
- Registro de quién retira la pieza (proveedor o personal interno)
- Seguimiento del estado del servicio externo
- Control de reingreso de la pieza al taller
- Archivo en expediente de OS: presupuesto del proveedor, acta de entrega de pieza, acta de reingreso, factura del servicio
- Envío de factura del proveedor a Administración para pago
- Adición del costo T.O.T. al costo final de la OS

## 16.3. Datos mínimos

OS/OT asociada, proveedor externo, pieza involucrada, seriales de la pieza, fotos antes de salida, descripción del trabajo solicitado, orden de salida (referencia), fecha salida, fecha reingreso estimada, fecha reingreso real, presupuesto del proveedor, factura del proveedor, estado (solicitado, en proceso, reingresado, facturado), responsable de aprobación.

## 16.4. Reglas de negocio

- Ninguna pieza sale del taller sin orden de salida firmada por Asesor de Servicio y Gerente de Servicio.
- Toda pieza debe fotografiarse con sus seriales antes de salir.
- La orden debe detallar exactamente el proceso técnico solicitado y el número de OS.
- Vigilancia debe verificar la orden de salida antes de permitir salida de pieza.
- El expediente de la OS debe contener: presupuesto del proveedor, acta de entrega, acta de reingreso y factura.
- La factura del proveedor debe enviarse a Administración para pago.
- El costo del T.O.T. se adiciona al costo final de la OS para facturación.

---

# 17. Submódulo: Trabajos Adicionales y Presupuestos Suplementarios

## 17.1. Objetivo

Gestionar trabajos descubiertos durante la ejecución que no estaban contemplados en la aprobación inicial.

## 17.2. Funcionalidades

- Registrar hallazgo adicional con evidencia fotográfica/video
- Estimar costo y tiempo adicional
- Generar presupuesto suplementario (ampliación)
- Solicitar autorización al cliente por medio verificable
- Aprobar total o parcialmente
- Rechazar adicional (queda como recomendación futura)
- Incorporar ítems aprobados a la OS/OT

## 17.3. Reglas de negocio

- Ningún adicional facturable debe ejecutarse sin aprobación registrada y verificable.
- La aprobación puede ser por firma, WhatsApp o correo.
- Los adicionales deben mantener trazabilidad respecto a la OS/OT original.
- Los tiempos y costos del adicional deben sumarse al total de la OS/OT.
- Se debe advertir al cliente desde la recepción que pueden surgir hallazgos adicionales.

---

# 18. Submódulo: Trazabilidad Digital y Bitácora

## 18.1. Objetivo

Mantener un registro en tiempo real de cada suceso relevante dentro de la OS/OT, creando una bitácora completa del servicio.

## 18.2. Funcionalidades

- Registro automático y manual de eventos con fecha, hora y descripción
- Registro de entrega de repuestos y filtros
- Registro de realización de escáner y otras revisiones
- Estatus diario de la reparación (información del Jefe de Taller al Asesor)
- Registro de quién autorizó cada paso y decisión
- Niveles de autorización: Jefe de Taller (técnica), Gerente de Servicio (extraordinario), Gerencia de Administración, Gerencia General
- Adhesión digital: todas las fotografías y reportes vinculados permanentemente a la OS

## 18.3. Reglas de negocio

- Toda información debe quedar registrada en la orden.
- Debe registrarse quién autorizó cada paso con nivel jerárquico.
- Las fotografías y evidencias deben cargarse y vincularse permanentemente a la OS en el sistema.
- La bitácora no puede eliminarse ni modificarse retroactivamente.

---

# 19. Submódulo: Escaneo Post-Reparación y Certificación Electrónica

## 19.1. Objetivo

Verificar electrónicamente que los parámetros del motor o pieza reparada sean correctos después del armado.

## 19.2. Funcionalidades

- Escaneo electrónico post-reparación (cuando aplique según tipo de vehículo/servicio)
- Verificación de parámetros del motor y piezas recuperadas
- Borrado de códigos de falla (DTC)
- Generación de reporte de escáner
- Impresión del reporte y adjuntarlo físicamente a la OS
- Carga del reporte al sistema vinculado a la OS
- Uso del reporte para explicaciones técnicas al cliente si lo solicita

## 19.3. Reglas de negocio

- Para vehículos electrónicos, el escaneo post-reparación es obligatorio.
- El reporte debe imprimirse Y cargarse al sistema.
- El reporte queda vinculado permanentemente a la OS.

---

# 20. Submódulo: Prueba de Carretera (Validación Dinámica)

## 20.1. Objetivo

Validar el funcionamiento del vehículo en condiciones reales de circulación después de la reparación.

## 20.2. Funcionalidades

- Generar orden de salida para prueba de carretera
- Autorización jerárquica obligatoria: firma de Gerente de Servicio, Asesor y Jefe de Taller
- Especificar motivo de la prueba en la orden
- Informar al cliente y obtener autorización escrita para la circulación legal del vehículo
- Equipo de prueba: chófer especializado + técnico con herramientas y escáner portátil
- Control de garita: vigilancia verifica orden firmada, revisa materiales/herramientas en el vehículo
- Monitoreo de parámetros en vivo durante la prueba
- Inspección de reingreso: kilometraje llegada vs. salida, ausencia de fugas en caliente, integridad física del vehículo

## 20.3. Reglas de negocio

- El vehículo solo sale con orden firmada por Gerente de Servicio, Asesor y Jefe de Taller.
- Vigilancia debe verificar que solo salen los materiales especificados en la orden.
- Si vigilancia detecta algo no especificado entrando o saliendo, debe informar de inmediato a Gerencia General.
- Al retornar, se verifica: kilometraje, ausencia de fugas, integridad física.
- El cliente debe autorizar la circulación legal del vehículo.

---

# 21. Submódulo: Control de Calidad

## 21.1. Objetivo

Verificar que el trabajo realizado cumple con estándares antes de la entrega al cliente.

## 21.2. Funcionalidades

- Checklist de control por tipo de servicio
- Revisión de trabajos ejecutados
- Validación por jefe de taller o responsable de calidad
- Prueba de ruta si aplica (ver submódulo 20)
- Validación de niveles, fugas, ruidos, funcionamiento y limpieza
- Registrar observaciones
- Aprobar o rechazar para retrabajo

## 21.3. Reglas de negocio

- No debe cerrarse una OS/OT sin control de calidad cuando el tipo de servicio lo exija.
- Si el control falla, la OS/OT regresa a ejecución.
- Debe quedar trazabilidad del responsable que aprobó la salida.

---

# 22. Submódulo: Facturación de Taller

## 22.1. Objetivo

Generar el documento de cobro correspondiente a los servicios prestados y materiales utilizados.

## 22.2. Funcionalidades

- Consolidar mano de obra, repuestos, insumos y servicios T.O.T. facturables
- Conciliación: presupuesto inicial vs. suplementarios vs. factura final
- Aplicar impuestos y descuentos autorizados
- Gestionar anticipos y pagos parciales
- Generar factura
- Generar cuenta por cobrar si aplica
- Vincular OS/OT con factura
- Visualizar saldo pendiente

## 22.3. Reglas de negocio

- No debe facturarse una OS/OT anulada.
- Debe poder bloquearse entrega si existe saldo pendiente.
- La factura debe reflejar solo conceptos aprobados y ejecutados.
- Los costos de T.O.T. deben incluirse en la factura final.
- El cierre administrativo incluye conciliación presupuesto vs. factura.

---

# 23. Submódulo: Entrega del Vehículo

## 23.1. Objetivo

Formalizar la devolución del vehículo al cliente con explicación del trabajo realizado, entrega de repuestos sustituidos y conformidad del cliente.

## 23.2. Funcionalidades

- Proceso estético: lavado completo y colocación de protectores
- Ubicación en zona de salida (pulmón) en posición de despacho
- Resumir trabajos realizados
- Mostrar repuestos utilizados
- Entrega de repuestos sustituidos al cliente (SIEMPRE)
- Entrega de reportes de escáner si aplica
- Explicación del trabajo al cliente (con reporte técnico si lo solicita)
- Mostrar recomendaciones pendientes
- Cliente paga en Caja, se valida el pago
- Registrar conformidad del cliente y firma del Acta de Conformidad
- Registrar fecha/hora de entrega y responsable
- Programar próxima visita o mantenimiento
- Egreso final: vigilancia valida pase de salida en garita con hora y kilometraje final

## 23.3. Reglas de negocio

- No debe entregarse vehículo si no ha pasado control de calidad requerido.
- Puede bloquearse entrega por saldo pendiente según política.
- Toda entrega debe quedar firmada con Acta de Conformidad.
- SIEMPRE se entregan los repuestos sustituidos al cliente.
- La entrega cierra la trazabilidad operativa del servicio.
- Vigilancia registra el egreso final con hora y kilometraje.

---

# 24. Submódulo: Garantías y Retrabajos

## 24.1. Objetivo

Controlar intervenciones bajo garantía y analizar retrabajos para mejora continua.

## 24.2. Tipos de garantía

Garantía de fábrica, comercial, de mano de obra, de repuesto, de proveedor, de campaña.

## 24.3. Funcionalidades

- Registrar reclamo de garantía
- Asociar OS/OT original
- Evaluar cobertura
- Determinar responsable del costo (empresa, proveedor, fabricante, aseguradora, cliente)
- Generar OS/OT de garantía
- Registrar retrabajo y causa raíz
- Medir reincidencia

## 24.4. Reglas de negocio

- Toda garantía debe referenciar documento origen.
- El responsable del costo debe quedar identificado.
- Las OS/OT de garantía deben diferenciarse de las comerciales.
- No cerrar garantía sin resolución.

---

# 25. Submódulo: Historial Técnico del Vehículo

## 25.1. Objetivo

Conservar trazabilidad completa de todas las intervenciones realizadas al vehículo.

## 25.2. Información visible

Datos generales del vehículo, propietario actual e histórico, citas, recepciones, diagnósticos, cotizaciones, OS/OTs, trabajos ejecutados, repuestos instalados, kilometraje histórico, garantías, campañas, recomendaciones pendientes, fotos y evidencias, reportes de escáner.

## 25.3. Reglas de negocio

- El historial no debe eliminarse.
- Toda intervención debe poder rastrearse desde la ficha del vehículo.
- El historial debe alimentar CRM y postventa.

---

# 26. Submódulo: Dashboards e Indicadores

## 26.1. Dashboards sugeridos

Tablero operativo del taller, tablero de recepción, tablero de OS/OT por estado, tablero de carga por técnico, tablero de repuestos pendientes, tablero de productividad, tablero de garantías y retrabajos.

## 26.2. KPIs operativos

Vehículos recibidos por día, OS/OT abiertas, en proceso y retrasadas, cumplimiento de fecha promesa, tiempo promedio de ciclo, tiempo muerto por falta de repuestos.

## 26.3. KPIs de productividad

Horas estándar vs. reales, productividad y eficiencia por técnico, ocupación de bahías, cumplimiento por asesor.

## 26.4. KPIs comerciales y financieros

Ticket promedio por OS/OT, venta de mano de obra, venta de repuestos, margen por OS/OT y tipo de servicio, descuentos aplicados, costo de garantía y retrabajo.

## 26.5. KPIs de calidad

Porcentaje de retrabajo, reincidencia por tipo de falla, casos de garantía, satisfacción del cliente.

## 26.6. Reportes adicionales (procedimiento operativo)

Cobro por mano de obra, cobro por venta de repuestos, historial del vehículo, órdenes abiertas/cerradas/facturadas, órdenes por asesor, por técnico, por tipo de mantenimiento, por modelo de vehículo.

---

# 27. Integraciones Funcionales

## 27.1. Integración con CRM

Ver historial del cliente, generar citas desde CRM, activar campañas de mantenimiento, seguimiento postservicio, encuestas de satisfacción.

## 27.2. Integración con inventario / repuestos

Reserva y despacho por OS/OT, devoluciones, control de faltantes, solicitudes de compra, estatus comprometido.

## 27.3. Integración con compras

Requisición por faltante, compra urgente para OS/OT, seguimiento de repuesto pendiente.

## 27.4. Integración con facturación/caja

Generación de factura, registro de anticipo, cobro al contado o crédito, bloqueo por saldo pendiente, pago de facturas de proveedores T.O.T.

## 27.5. Integración con contabilidad

Ventas de servicios, costo de repuestos, costo de mano de obra, costos de T.O.T., provisiones de garantía, centros de costo.

## 27.6. Integración con ventas de vehículos

Activación de garantía, primer mantenimiento, historial del vehículo nuevo/usado.

---

# 28. Automatizaciones Recomendadas

- Recordatorio de cita al cliente (mínimo 24 horas antes)
- Alerta de vehículo retrasado vs. fecha promesa
- Alerta de repuesto faltante crítico
- Recordatorio de aprobación pendiente del cliente
- Aviso de vehículo listo para entrega
- Recordatorio de próximo mantenimiento
- Encuesta de satisfacción post entrega
- Alerta de OS/OT sin avance
- Alerta de tiempo excedido por operación
- Alerta de control de calidad pendiente
- Alerta de pieza en servicio externo sin reingreso
- Notificación a Gerencia General por irregularidades de garita

---

# 29. Validaciones Funcionales Clave

- Kilometraje de recepción no menor al último registrado, salvo autorización.
- Fecha promesa no menor a fecha actual.
- No crear OS/OT sin recepción.
- No cerrar OS/OT con tiempos activos.
- No pasar a entrega sin control de calidad si aplica.
- No facturar ítems no aprobados.
- No consumir más material que el despachado sin ajuste/autorización.
- No cerrar garantía sin resolución.
- No ejecutar trabajo adicional sin aprobación verificable del cliente.
- No sacar pieza del taller sin orden firmada.
- No sacar vehículo para prueba sin autorización triple (Gerente, Asesor, Jefe Taller).
- No entregar vehículo sin devolución de repuestos sustituidos.

---

# 30. Roles y Permisos

## 30.1. Jerarquía de autorizaciones

| Nivel | Rol | Alcance de autorización |
|-------|-----|------------------------|
| 1 | Jefe de Taller | Decisiones técnicas, asignación de técnicos, supervisión de ejecución |
| 2 | Gerente de Servicio | Casos extraordinarios, aprobación de T.O.T., prueba de carretera, salida de piezas |
| 3 | Gerencia de Administración | Decisiones financieras, pagos a proveedores |
| 4 | Gerencia General | Situaciones excepcionales, irregularidades reportadas por vigilancia |

## 30.2. Permisos típicos por rol

| Acción | Asesor | Jefe Taller | Técnico | Almacén | Calidad | Caja | Vigilancia | Gerente |
|--------|--------|-------------|---------|---------|---------|------|------------|---------|
| Crear recepción | ✓ | | | | | | | ✓ |
| Abrir OS/OT | ✓ | ✓ | | | | | | ✓ |
| Asignar técnico | | ✓ | | | | | | ✓ |
| Registrar tiempos | | | ✓ | | | | | |
| Solicitar repuestos | ✓ | | | | | | | |
| Aprobar despacho | | | | ✓ | | | | |
| Aprobar descuentos | | | | | | | | ✓ |
| Control de calidad | | ✓ | | | ✓ | | | |
| Entregar vehículo | ✓ | | | | | ✓ | | |
| Registrar garita | | | | | | | ✓ | |
| Aprobar T.O.T. | | | | | | | | ✓ |
| Firmar prueba carretera | ✓ | ✓ | | | | | | ✓ |

---

# 31. Flujos Funcionales

## 31.1. Flujo completo: servicio programado

1. Cliente se comunica (teléfono, redes, presencial). Pre-diagnóstico.
2. Se agenda cita con repuestos pre-identificados.
3. Confirmación 24h antes.
4. Ingreso por garita: registro de placa, conductor, kilometraje, seriales.
5. Protocolo de bienvenida. Asesor recibe unidad.
6. Inventario 360°, checklist, fotos, daños, accesorios.
7. Sugerencia de mantenimientos correctivos adicionales.
8. Presupuesto y aprobación/firma del cliente.
9. Apertura de OS con cortesía de lavado.
10. Entrega de OS y llaves al Jefe de Taller. Traslado al área de taller.
11. Asignación de técnico especialista.
12. Solicitud de repuestos en sistema. Aprobación de almacén.
13. Entrega física con protocolo de firmas.
14. Ejecución del trabajo con bitácora en tiempo real.
15. Si hay hallazgos: evidencia, presupuesto suplementario, aprobación del cliente.
16. Si se requiere T.O.T.: orden de salida, fotos, control garita.
17. Escaneo post-reparación (si aplica). Reporte.
18. Prueba de carretera (si aplica). Autorización triple.
19. Control de calidad.
20. Lavado, protectores, ubicación en pulmón.
21. Conciliación presupuesto vs. factura.
22. Cliente paga en caja.
23. Entrega: explicación, repuestos sustituidos, reporte escáner, Acta de Conformidad.
24. Egreso por garita: pase de salida, hora, kilometraje final.
25. Activación de postventa y programación de próxima visita.

## 31.2. Flujo: trabajo adicional / hallazgo oculto

1. OS/OT en proceso.
2. Técnico detecta hallazgo (ej: al desarmar caja de cambios, detecta problema de embrague).
3. Evidencia obligatoria: fotos y videos.
4. Asesor genera presupuesto suplementario.
5. Comunicación al cliente con evidencia y detalle técnico.
6. Cliente aprueba (firma/WhatsApp/correo) o rechaza.
7. Si aprueba: se ejecuta e incorpora a factura.
8. Si rechaza: queda como recomendación futura en historial.

## 31.3. Flujo: garantía

1. Cliente reporta falla.
2. Se valida historial.
3. Se clasifica garantía.
4. Se genera OS/OT de garantía.
5. Se ejecuta trabajo.
6. Se registra costo absorbido.
7. Se cierra con trazabilidad al caso original.

---

# 32. Integración CRM + Taller

## 32.1. Objetivo

Permitir que el CRM y el Taller compartan una visión única del cliente y del vehículo, logrando continuidad entre captación, cita, servicio, seguimiento, fidelización, reclamos y próxima venta.

## 32.2. Flujos integrados

### Flujo A: CRM genera cita de taller

CRM detecta necesidad (mantenimiento pendiente, campaña, reclamo, cliente inactivo) → Asesor/contact center crea cita → Aparece en agenda del taller → Taller la convierte en recepción.

### Flujo B: Taller alimenta CRM

Se cierra una OS/OT → Sistema envía al CRM: fecha de visita, tipo de servicio, recomendaciones pendientes, kilometraje, satisfacción → CRM actualiza vista 360 del cliente.

### Flujo C: Recomendaciones no aprobadas se vuelven oportunidades CRM

Taller detecta trabajo adicional → Cliente no aprueba → Sistema genera oportunidad postventa, tarea de seguimiento y posible campaña futura.

### Flujo D: Garantía / reclamo desde CRM hacia taller

Cliente registra reclamo en CRM → CRM crea caso → Si requiere intervención técnica: se genera cita o recepción o garantía en taller → Taller resuelve y devuelve resultado a CRM.

### Flujo E: Cliente comprador entra a postventa

Ventas registra vehículo vendido → CRM agenda bienvenida, primer mantenimiento, recordatorios → Cuando llega al taller, el vehículo ya existe en el sistema.

## 32.3. Reglas de integración

- Cliente y vehículo deben ser entidades únicas compartidas.
- No duplicar fichas entre CRM y taller.
- Todo servicio de taller debe reflejarse en la vista 360 del CRM.
- Recomendaciones no ejecutadas deben poder convertirse en oportunidad.
- Todo caso CRM con componente técnico debe vincularse a taller.

---

# 33. Modelo de Base de Datos del Taller

## 33.1. Entidades principales

### A. Maestros

**tabla: `taller_sucursal`** — id, nombre, codigo, direccion, telefono, activo

**tabla: `taller_bahia`** — id, sucursal_id, nombre, codigo, tipo_bahia, estado, activo

**tabla: `taller_tipo_servicio`** — id, codigo, nombre, descripcion, requiere_control_calidad, activo

**tabla: `taller_motivo_ingreso`** — id, codigo, nombre, descripcion, activo

**tabla: `taller_prioridad`** — id, codigo, nombre, nivel, color, activo

**tabla: `taller_estado_ot`** — id, codigo, nombre, orden, es_final, activo

**tabla: `taller_tipo_garantia`** — id, codigo, nombre, descripcion, activo

**tabla: `taller_especialidad_tecnica`** — id, codigo, nombre, descripcion, activo

**tabla: `taller_operacion`** — id, codigo, nombre, descripcion, tipo_servicio_id, horas_estandar, tarifa_base, activo

**tabla: `taller_checklist_tipo`** — id, codigo, nombre, categoria (recepcion, diagnostico, control_calidad), activo

**tabla: `taller_checklist_item`** — id, checklist_tipo_id, codigo, nombre, descripcion, tipo_respuesta (boolean, texto, numero, seleccion), obligatorio, orden, activo

**tabla: `empleado`** — id, persona_id, sucursal_id, codigo, tipo_empleado (asesor, tecnico, jefe_taller, bodeguero, calidad, vigilancia), activo

**tabla: `tecnico_especialidad`** — id, tecnico_id, especialidad_id, nivel, activo

**tabla: `taller_proveedor_tot`** — id, nombre, rif, direccion, telefono, especialidad, activo

**tabla: `taller_nivel_autorizacion`** — id, nivel, rol, descripcion, activo

### B. Clientes y vehículos

**tabla: `cliente`** — id, tipo_cliente, documento, nombre_razon_social, telefono, email, direccion, activo

**tabla: `vehiculo`** — id, cliente_id, placa, vin, marca_id, modelo_id, version, anio, motor, serial_motor, serial_carroceria, transmision, combustible, color, kilometraje_actual, activo

**tabla: `vehiculo_historial_propietario`** — id, vehiculo_id, cliente_id, fecha_inicio, fecha_fin

### C. Citas

**tabla: `taller_cita`** — id, sucursal_id, cliente_id, vehiculo_id, asesor_id, tipo_servicio_id, motivo_ingreso_id, fecha_hora, duracion_estimada_min, observaciones, pre_diagnostico, repuestos_preidentificados, costo_estimado, estado (programada, confirmada, atendida, cancelada, no_asistio, reagendada), origen (crm, web, manual, telefono, redes), creada_por, creada_en

**tabla: `taller_cita_historial`** — id, cita_id, estado_anterior, estado_nuevo, observacion, usuario_id, fecha

### D. Control de garita

**tabla: `taller_garita_registro`** — id, tipo_movimiento (ingreso_vehiculo, egreso_vehiculo, salida_pieza, reingreso_pieza, prueba_carretera), placa, conductor_nombre, fecha_hora, kilometraje, serial_motor, serial_carroceria, os_ot_id, orden_salida_referencia, observaciones, vigilante_id, foto_url, creado_en

### E. Recepción

**tabla: `taller_recepcion`** — id, numero, sucursal_id, cita_id (nullable), cliente_id, vehiculo_id, asesor_id, tipo_servicio_id, motivo_ingreso_id, fecha_hora_ingreso, kilometraje, combustible_nivel, observaciones_cliente, observaciones_internas, fecha_promesa, estado (abierta, diagnosticando, cotizada, convertida_ot, cancelada), firma_cliente, autorizado_diagnostico, creado_por, creado_en

**tabla: `taller_recepcion_danio`** — id, recepcion_id, zona_vehiculo, descripcion, severidad, foto_url

**tabla: `taller_recepcion_accesorio`** — id, recepcion_id, nombre, cantidad, observacion

**tabla: `taller_recepcion_checklist_respuesta`** — id, recepcion_id, checklist_item_id, valor_bool, valor_texto, valor_numero, valor_opcion, observacion

**tabla: `taller_recepcion_foto`** — id, recepcion_id, url, descripcion, tipo (frontal, lateral, interior, danio, documento)

### F. Diagnóstico

**tabla: `taller_diagnostico`** — id, recepcion_id, tecnico_id, fecha_hora_inicio, fecha_hora_fin, observaciones, criticidad_general, estado (borrador, finalizado, aprobado_interno), creado_por, creado_en

**tabla: `taller_diagnostico_hallazgo`** — id, diagnostico_id, categoria, descripcion, criticidad, requiere_aprobacion_cliente, es_hallazgo_oculto, observacion

**tabla: `taller_diagnostico_operacion_sugerida`** — id, diagnostico_id, operacion_id, descripcion, horas_estimadas, precio_estimado, aprobado_para_cotizar

**tabla: `taller_diagnostico_repuesto_sugerido`** — id, diagnostico_id, producto_id, descripcion, cantidad, costo_estimado, precio_estimado

**tabla: `taller_diagnostico_evidencia`** — id, diagnostico_id, tipo (foto, video, reporte_scanner), url, descripcion

### G. Cotización

**tabla: `taller_cotizacion`** — id, numero, sucursal_id, recepcion_id, diagnostico_id (nullable), cliente_id, vehiculo_id, version, es_suplementaria, cotizacion_padre_id (nullable), fecha_emision, fecha_vigencia, subtotal, descuento, impuesto, total, estado (borrador, emitida, enviada, pendiente_aprobacion, aprobada_total, aprobada_parcial, rechazada, vencida, convertida), observaciones, emitida_por, creada_en

**tabla: `taller_cotizacion_detalle`** — id, cotizacion_id, tipo_item (operacion, repuesto, insumo, servicio_externo, cortesia), referencia_id, descripcion, cantidad, precio_unitario, costo_unitario, descuento, impuesto, subtotal, total, aprobado, orden

**tabla: `taller_cotizacion_aprobacion`** — id, cotizacion_id, tipo_aprobacion (total, parcial, rechazo), fecha, aprobado_por_nombre, canal (presencial, whatsapp, email, llamada, firma_digital), observacion, motivo_rechazo

### H. Orden de servicio / trabajo

**tabla: `taller_ot`** — id, numero, sucursal_id, recepcion_id, cotizacion_id (nullable), cliente_id, vehiculo_id, asesor_id, tecnico_principal_id (nullable), bahia_id (nullable), tipo_servicio_id, prioridad_id, fecha_apertura, fecha_promesa, fecha_cierre, estado_id, observaciones, origen (recepcion, cita, garantia, campaña), es_garantia, ot_origen_garantia_id (nullable), creada_por, creada_en

**tabla: `taller_ot_operacion`** — id, ot_id, operacion_id (nullable), descripcion, tecnico_id (nullable), bahia_id (nullable), horas_estandar, horas_vendidas, horas_reales, tarifa_hora, subtotal, estado (pendiente, asignada, en_proceso, pausada, finalizada, anulada), orden

**tabla: `taller_ot_observacion`** — id, ot_id, tipo (interna, cliente, tecnica, calidad, bitacora), observacion, usuario_id, fecha

**tabla: `taller_ot_historial_estado`** — id, ot_id, estado_anterior_id, estado_nuevo_id, comentario, usuario_id, nivel_autorizacion, fecha

### I. Tiempos técnicos

**tabla: `taller_tiempo_tecnico`** — id, ot_id, ot_operacion_id, tecnico_id, fecha_hora_inicio, fecha_hora_fin, minutos_trabajados, estado (activo, pausado, finalizado), observacion

**tabla: `taller_tiempo_tecnico_pausa`** — id, tiempo_tecnico_id, fecha_hora_inicio, fecha_hora_fin, motivo

### J. Repuestos e insumos

**tabla: `taller_ot_material`** — id, ot_id, tipo_item (repuesto, insumo, lubricante, servicio_externo, cortesia), producto_id (nullable), descripcion, cantidad_solicitada, cantidad_reservada, cantidad_despachada, cantidad_consumida, cantidad_devuelta, costo_unitario, precio_unitario, facturable, estado (solicitado, reservado, despachado, parcial, consumido, devuelto, cancelado, comprometido)

**tabla: `taller_ot_material_movimiento`** — id, ot_material_id, tipo_movimiento (reserva, despacho, consumo, devolucion, ajuste), cantidad, almacen_id, referencia_movimiento_inventario, usuario_id, fecha

**tabla: `taller_ot_material_firma`** — id, ot_material_id, firmante_rol (almacenista, jefe_taller, asesor, tecnico), firmante_id, fecha, firma_url

### K. Servicios externos (T.O.T.)

**tabla: `taller_tot`** — id, ot_id, proveedor_tot_id, pieza_descripcion, pieza_serial, foto_pieza_url, trabajo_solicitado, instruccion_tecnica, orden_salida_referencia, aprobado_por_id, fecha_salida, fecha_reingreso_estimada, fecha_reingreso_real, presupuesto_proveedor, factura_proveedor_referencia, costo_total, estado (solicitado, aprobado, salida, en_proceso, reingresado, facturado), observaciones, creado_en

**tabla: `taller_tot_documento`** — id, tot_id, tipo (presupuesto_proveedor, acta_entrega, acta_reingreso, factura), url, descripcion, fecha

### L. Trabajos adicionales

**tabla: `taller_ot_adicional`** — id, ot_id, diagnostico_hallazgo_id (nullable), descripcion, fecha, tecnico_id, estado (propuesto, cotizado, aprobado, rechazado, ejecutado), medio_aprobacion (firma, whatsapp, correo), observacion

**tabla: `taller_ot_adicional_detalle`** — id, adicional_id, tipo_item, referencia_id, descripcion, cantidad, precio_unitario, costo_unitario, total, aprobado

### M. Control de calidad

**tabla: `taller_control_calidad`** — id, ot_id, responsable_id, fecha, resultado (aprobado, rechazado, aprobado_con_observacion), observaciones, requiere_retrabajo, creado_en

**tabla: `taller_control_calidad_respuesta`** — id, control_calidad_id, checklist_item_id, valor_bool, valor_texto, valor_numero, valor_opcion, observacion

### N. Escaneo post-reparación

**tabla: `taller_escaneo_post`** — id, ot_id, tecnico_id, fecha, codigos_dtc_borrados, parametros_verificados, resultado, reporte_url, reporte_impreso, observaciones

### O. Prueba de carretera

**tabla: `taller_prueba_carretera`** — id, ot_id, orden_salida_referencia, motivo, chofer_id, tecnico_id, autorizado_gerente_id, autorizado_asesor_id, autorizado_jefe_taller_id, autorizacion_cliente, km_salida, km_llegada, fecha_hora_salida, fecha_hora_llegada, resultado, fugas_detectadas, integridad_verificada, observaciones

### P. Facturación y entrega

**tabla: `taller_factura`** — id, ot_id, factura_id, subtotal_servicios, subtotal_repuestos, subtotal_tot, descuento, impuesto, total, anticipo, saldo, fecha, estado

**tabla: `taller_entrega`** — id, ot_id, fecha_hora_entrega, entregado_por, recibido_por_nombre, observaciones, firma_cliente, saldo_cancelado, conformidad, repuestos_sustituidos_entregados, proxima_visita_programada

### Q. Garantías y retrabajos

**tabla: `taller_garantia`** — id, tipo_garantia_id, cliente_id, vehiculo_id, ot_origen_id, recepcion_id (nullable), fecha_reclamo, causa_reclamo, responsable_costo (empresa, proveedor, fabricante, aseguradora, cliente), estado (abierta, evaluacion, aprobada, rechazada, cerrada), resolucion

**tabla: `taller_retrabajo`** — id, ot_id, ot_origen_id, motivo, causa_raiz, costo_estimado, costo_real, estado

### R. Documentos y auditoría

**tabla: `taller_documento_adjunto`** — id, entidad_tipo, entidad_id, nombre, url, tipo_archivo, descripcion, es_expediente_fisico, subido_por, fecha

**tabla: `taller_auditoria`** — id, entidad, entidad_id, accion, valor_anterior_json, valor_nuevo_json, usuario_id, nivel_autorizacion, fecha, ip

## 33.2. Relaciones clave

- `cliente 1:N vehiculo`
- `vehiculo 1:N taller_cita`
- `vehiculo 1:N taller_recepcion`
- `taller_recepcion 1:N taller_diagnostico`
- `taller_recepcion 1:N taller_cotizacion`
- `taller_cotizacion 1:N taller_cotizacion_detalle`
- `taller_recepcion 1:1..N taller_ot`
- `taller_ot 1:N taller_ot_operacion`
- `taller_ot 1:N taller_tiempo_tecnico`
- `taller_ot 1:N taller_ot_material`
- `taller_ot 1:N taller_ot_material_firma`
- `taller_ot 1:N taller_ot_adicional`
- `taller_ot 1:N taller_tot`
- `taller_ot 1:N taller_control_calidad`
- `taller_ot 0..1:1 taller_escaneo_post`
- `taller_ot 0..1:1 taller_prueba_carretera`
- `taller_ot 1:1..N taller_factura`
- `taller_ot 1:1 taller_entrega`
- `taller_ot 1:N taller_garantia`
- `taller_ot 1:N taller_garita_registro`
- `vehiculo 1:N historial técnico completo`

---

# 34. Flujo de Pantallas y Menú del Taller

## 34.1. Menú principal

- Dashboard Operativo
- Citas
- Control de Garita
- Recepciones
- Diagnósticos
- Cotizaciones / Presupuestos
- Órdenes de Servicio
- Planificación
- Control de Tiempos
- Repuestos para OS
- Servicios Externos (T.O.T.)
- Control de Calidad
- Entregas
- Garantías y Retrabajos
- Historial Vehicular
- Reportes
- Configuración

## 34.2. Pantallas principales

### Dashboard Operativo
Componentes: OS/OT abiertas por estado, citas del día, vehículos en recepción, OS/OT retrasadas, técnicos ocupados/libres, repuestos pendientes, piezas en T.O.T., vehículos listos para entrega, alertas críticas. Acciones rápidas: nueva cita, nueva recepción, abrir OS, asignar técnico, registrar avance, marcar vehículo listo.

### Pantalla de Citas
Vista listado con filtros por fecha, sucursal, asesor, tipo de servicio, estado. Formulario incluye pre-diagnóstico y repuestos pre-identificados.

### Pantalla de Garita
Vista en tiempo real de movimientos. Registro de ingreso/egreso. Alertas de irregularidades. Vinculación con OS/OT.

### Pantalla de Recepción
Formulario por secciones: datos del cliente, datos del vehículo, motivo de ingreso, estado del vehículo (inspección 360°), checklist, daños visibles, accesorios, fotos, firma/autorización, fecha promesa.

### Pantalla de Diagnóstico
Secciones: datos base de recepción, hallazgos técnicos (visibles y ocultos), checklist técnico, evidencias (fotos/videos), repuestos sugeridos, operaciones sugeridas, tiempo estimado, recomendaciones.

### Pantalla de Cotizaciones/Presupuestos
Secciones: encabezado, mano de obra, repuestos, insumos, servicios externos T.O.T., descuentos/impuestos, total, historial de aprobación. Soporte para presupuestos suplementarios.

### Pantalla de Órdenes de Servicio
Vista listado con filtros. Detalle por pestañas: resumen, operaciones, técnicos, materiales, tiempos, T.O.T., adicionales, bitácora, calidad, facturación, historial de estados, adjuntos.

### Pantalla de Planificación
Vista tipo tablero (kanban) por bahía o técnico. Drag & drop de OS/OT. Horas estimadas y disponibles.

### Pantalla de Control de Tiempos
Vista por técnico: OS activa, operación, hora inicio, tiempo acumulado, estado. Acciones: iniciar, pausar, reanudar, finalizar. Vista analítica: horas reales vs. estándar, eficiencia, productividad.

### Pantalla de Repuestos para OS
Vista: OS, vehículo, ítem, cantidades (solicitada, despachada, consumida, devuelta), estado, firmas. Acciones: solicitar, reservar, despachar, devolver, sustituir.

### Pantalla de Servicios Externos (T.O.T.)
Vista: OS, proveedor, pieza, estado, fecha salida, fecha reingreso. Acciones: registrar, aprobar salida, registrar reingreso, adjuntar documentos, registrar factura.

### Pantalla de Control de Calidad
Vista: OS, vehículo, responsable, fecha, resultado. Acciones: iniciar control, completar checklist, aprobar, rechazar, devolver a ejecución.

### Pantalla de Entrega
Formulario: resumen de trabajos, repuestos cambiados, repuestos sustituidos para entregar al cliente, recomendaciones, saldo pendiente, firma cliente, conformidad, próxima visita.

### Pantalla de Garantías y Retrabajos
Vista: caso, vehículo, OS origen, tipo garantía, estado, responsable costo. Acciones: registrar reclamo, evaluar, aprobar/rechazar, crear OS de garantía, cerrar.

### Pantalla de Historial del Vehículo
Búsqueda por placa, VIN, cliente, OS. Información: datos del vehículo, cliente actual, historial cronológico completo (citas, recepciones, cotizaciones, OS/OTs, repuestos usados, garantías, kilometraje histórico, recomendaciones pendientes, reportes de escáner).

### Reportes
Productividad de técnicos, OS por estado, cumplimiento de promesas, consumo de repuestos, rentabilidad por OS, garantías, retrabajos, ventas de servicios, ventas de repuestos, órdenes por asesor, por técnico, por tipo de mantenimiento, por modelo de vehículo.

---

# 35. Fases de Implementación Sugeridas

## Fase 1: Núcleo operativo

Maestros comunes, cliente, vehículo, citas (con pre-diagnóstico), control de garita, recepción (con protocolo completo), diagnóstico, cotización/presupuesto, OS/OT básica, consumo de repuestos (con protocolo de firmas), facturación básica, historial del vehículo.

## Fase 2: Control operativo

Tiempos técnicos, planificación y asignación, servicios externos T.O.T., trazabilidad/bitácora, control de calidad, escaneo post-reparación, prueba de carretera, dashboard operativo, trabajos adicionales.

## Fase 3: Rentabilidad y postventa

Garantías, retrabajos, indicadores avanzados, automatizaciones, integración CRM completa.

## Fase 4: Escalabilidad

Multi-sucursal, app móvil para técnicos, gestión de flotillas, integración con aseguradoras, BI avanzado.

---

# 36. Reglas Generales de Negocio

1. No se debe iniciar trabajo sin recepción registrada.
2. No debe ejecutarse trabajo adicional facturable sin aprobación verificable.
3. No debe consumirse repuesto sin trazabilidad de inventario.
4. No debe cerrarse OS/OT sin finalizar tareas activas.
5. No debe entregarse vehículo sin validaciones requeridas.
6. Toda garantía debe referenciar origen.
7. Todo cambio crítico debe quedar auditado.
8. El historial técnico del vehículo debe ser permanente.
9. La fecha promesa debe ser controlada y visible.
10. Toda OS/OT debe tener responsable operativo.
11. SIEMPRE se devuelven repuestos sustituidos al cliente.
12. Ningún vehículo ni pieza sale del taller sin orden autorizada y verificada por garita.
13. Toda autorización debe registrar quién la otorgó y su nivel jerárquico.
14. La bitácora de la OS es inmutable y constituye el expediente del servicio.

---

# 37. Requerimientos No Funcionales

## 37.1. Usabilidad
Pantallas rápidas para recepción y ejecución. Visualización clara de estados. Responsive para tablet o móvil. Búsqueda por cliente, placa, VIN, OS/OT o teléfono.

## 37.2. Seguridad
Acceso por rol y sucursal. Auditoría de acciones críticas. Trazabilidad de cambios de estado. Control de edición sobre documentos cerrados. Jerarquía de autorizaciones.

## 37.3. Rendimiento
Consulta rápida de historial de vehículo. Tablero operativo en tiempo casi real. Soporte para gran volumen de OS/OT históricas.

## 37.4. Escalabilidad
Multi-sucursal. Múltiples talleres y bodegas. Integración con ERP y BI. Ampliación futura a app móvil de técnicos.

## 37.5. Gestión documental
Soporte para expediente digital de cada OS (presupuestos firmados, solicitudes de repuestos, órdenes de salida de piezas, facturas de proveedores, reportes de escáner, actas de conformidad). Posibilidad de vincular documentos físicos escaneados.
