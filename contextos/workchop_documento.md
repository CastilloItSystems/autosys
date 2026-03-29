Perfecto. Te dejo el **Documento Funcional del Módulo de Taller**, estructurado de forma profesional y pensado para una empresa automotriz que:

- vende vehículos
- vende repuestos
- tiene taller
- quiere un sistema robusto, escalable y controlado

Lo planteo como un documento base para análisis funcional, diseño y desarrollo.

---

# DOCUMENTO FUNCIONAL

# MÓDULO DE TALLER AUTOMOTRIZ ROBUSTO

---

# 1. Información general

## 1.1. Nombre del módulo

**Módulo de Taller Automotriz**

## 1.2. Objetivo

Gestionar integralmente la operación del taller automotriz, desde la cita y recepción del vehículo hasta la ejecución del trabajo, control de repuestos, facturación, entrega, garantía y seguimiento postservicio.

## 1.3. Propósito del módulo

Permitir a la empresa controlar de forma trazable, rentable y eficiente:

- atención de clientes de taller
- planificación de servicios
- recepción de vehículos
- diagnóstico técnico
- cotización de trabajos
- aprobación por parte del cliente
- apertura y ejecución de órdenes de trabajo
- consumo de repuestos e insumos
- control de mano de obra
- control de calidad
- entrega de vehículos
- garantías y retrabajos
- historial técnico del vehículo

---

# 2. Alcance del módulo

El módulo cubrirá los siguientes procesos:

1. Agenda y citas de taller
2. Recepción del vehículo
3. Inspección y diagnóstico
4. Cotización de servicios y repuestos
5. Aprobación de trabajos
6. Apertura y gestión de órdenes de trabajo
7. Asignación de técnicos y recursos
8. Control de tiempos y mano de obra
9. Solicitud, despacho y consumo de repuestos
10. Trabajos adicionales
11. Control de calidad
12. Facturación de servicios
13. Entrega del vehículo
14. Gestión de garantías
15. Historial técnico y postventa

---

# 3. Objetivos funcionales

1. Controlar el flujo completo del servicio de taller.
2. Reducir tiempos muertos y mejorar capacidad operativa.
3. Garantizar trazabilidad de cada intervención al vehículo.
4. Integrar el consumo de repuestos con inventario.
5. Controlar productividad y eficiencia del personal técnico.
6. Formalizar aprobaciones de clientes y trabajos adicionales.
7. Mejorar la calidad del servicio y reducir retrabajos.
8. Facilitar la facturación correcta y oportuna.
9. Mantener historial completo del vehículo.
10. Soportar garantías, reclamos y seguimiento postservicio.

---

# 4. Tipos de servicio que debe soportar

El módulo debe permitir manejar al menos los siguientes tipos de atención:

- mantenimiento preventivo
- mantenimiento correctivo
- diagnóstico técnico
- servicios rápidos
- cambio de aceite y filtros
- frenos
- suspensión
- motor
- transmisión
- electricidad/electrónica
- aire acondicionado
- alineación y balanceo
- llantas
- carrocería y pintura
- instalación de accesorios
- trabajos por garantía
- trabajos por campaña
- trabajos de aseguradora
- servicio a flotillas o empresas

---

# 5. Estructura funcional del módulo

El módulo de taller estará compuesto por los siguientes submódulos:

1. Maestros y configuración
2. Agenda y citas
3. Recepción del vehículo
4. Diagnóstico e inspección
5. Cotización de taller
6. Orden de trabajo
7. Planificación y asignación
8. Mano de obra y tiempos técnicos
9. Repuestos e insumos en taller
10. Trabajos adicionales
11. Control de calidad
12. Facturación de taller
13. Entrega del vehículo
14. Garantías y retrabajos
15. Historial técnico del vehículo
16. Dashboards e indicadores
17. Integraciones y automatizaciones

---

# 6. Submódulo: Maestros y configuración

## 6.1. Objetivo

Permitir parametrizar la operación del taller según la estructura de la empresa.

## 6.2. Catálogos principales

- tipos de servicio
- motivos de ingreso
- asesores de servicio
- técnicos
- jefes de taller
- especialidades técnicas
- bahías / estaciones de trabajo
- prioridades de atención
- operaciones estándar
- tiempos estándar
- listas de precios de mano de obra
- checklist de recepción
- checklist de diagnóstico
- checklist de control de calidad
- tipos de garantía
- causas de retrabajo
- tipos de orden de trabajo
- estados operativos
- tipos de cliente taller
- turnos de trabajo

## 6.3. Reglas configurables

- obligatoriedad de checklist de recepción
- obligatoriedad de control de calidad
- aprobación requerida para descuentos
- autorización para consumo sin stock
- tolerancias de tiempos
- reglas de facturación
- vigencia de cotizaciones
- SLA de entrega

---

# 7. Submódulo: Agenda y citas

## 7.1. Objetivo

Programar y organizar las atenciones del taller según capacidad y disponibilidad.

## 7.2. Funcionalidades

- registrar cita
- reagendar cita
- cancelar cita
- confirmar cita
- asignar asesor de servicio
- estimar duración
- asociar tipo de servicio
- consultar capacidad por día, técnico o bahía
- registrar observaciones del cliente
- enviar recordatorios al cliente
- convertir cita en recepción

## 7.3. Datos mínimos de una cita

- cliente
- vehículo
- fecha y hora
- sucursal
- tipo de servicio
- motivo de la cita
- asesor asignado
- duración estimada
- estado
- observaciones

## 7.4. Estados de cita

- programada
- confirmada
- en espera
- atendida
- cancelada
- no asistió
- reagendada

## 7.5. Reglas de negocio

- una cita debe asociarse a cliente y vehículo
- no debe exceder la capacidad configurada sin autorización
- debe poder crearse sin cliente completo en escenarios rápidos, pero completarse en recepción
- toda cita atendida debe poder convertirse en recepción

---

# 8. Submódulo: Recepción del vehículo

## 8.1. Objetivo

Registrar formalmente el ingreso del vehículo al taller, documentando el estado inicial y requerimientos del cliente.

## 8.2. Funcionalidades

- recepción con o sin cita previa
- búsqueda o registro de cliente
- búsqueda o registro de vehículo
- captura de kilometraje / horómetro
- nivel de combustible
- observaciones del cliente
- síntomas reportados
- checklist de ingreso
- registro de daños preexistentes
- registro de accesorios u objetos entregados
- toma de fotografías
- firma digital del cliente
- autorización de diagnóstico
- generación de orden de recepción

## 8.3. Datos mínimos de recepción

- cliente
- vehículo
- asesor de servicio
- fecha y hora de ingreso
- kilometraje
- combustible
- motivo de ingreso
- observaciones del cliente
- checklist
- daños visibles
- accesorios entregados
- fecha promesa
- estado

## 8.4. Reglas de negocio

- no se debe abrir OT sin recepción formal
- el kilometraje debe validarse contra historial
- debe existir trazabilidad del estado visual del vehículo
- debe registrarse autorización del cliente para diagnóstico cuando aplique
- la recepción debe poder originarse desde una cita

---

# 9. Submódulo: Diagnóstico e inspección

## 9.1. Objetivo

Documentar hallazgos técnicos, necesidades del vehículo y trabajos recomendados.

## 9.2. Funcionalidades

- asignar técnico para diagnóstico
- completar checklist técnico
- registrar hallazgos
- clasificar criticidad
- asociar síntomas reportados y fallas encontradas
- adjuntar fotos/videos/evidencias
- registrar lectura de scanner o códigos si aplica
- sugerir operaciones y repuestos
- estimar tiempos y costos
- generar recomendaciones futuras

## 9.3. Datos mínimos

- recepción asociada
- técnico responsable
- fecha/hora de diagnóstico
- observaciones técnicas
- fallas detectadas
- nivel de criticidad
- operaciones sugeridas
- repuestos sugeridos
- tiempo estimado
- evidencia adjunta

## 9.4. Reglas de negocio

- el diagnóstico debe quedar ligado a una recepción
- toda recomendación adicional debe quedar registrada
- debe poder existir más de un diagnóstico por una misma recepción si hay revisiones complementarias
- las recomendaciones deben poder convertirse en cotización

---

# 10. Submódulo: Cotización de taller

## 10.1. Objetivo

Generar una propuesta económica de servicios, repuestos e insumos a ser aprobada por el cliente.

## 10.2. Componentes de la cotización

- mano de obra
- operaciones estándar
- repuestos
- lubricantes
- insumos
- servicios externos
- descuentos
- impuestos

## 10.3. Funcionalidades

- generar cotización desde recepción o diagnóstico
- agregar ítems manuales y automáticos
- tomar precios desde listas vigentes
- controlar costos y márgenes
- aplicar descuentos
- versionar cotización
- enviar al cliente
- registrar aprobación total o parcial
- registrar rechazo
- convertir ítems aprobados en OT

## 10.4. Datos mínimos

- cliente
- vehículo
- recepción o diagnóstico origen
- fecha
- vigencia
- ítems detallados
- subtotal
- descuento
- impuesto
- total
- estado
- usuario emisor

## 10.5. Estados

- borrador
- emitida
- enviada
- pendiente aprobación
- aprobada total
- aprobada parcial
- rechazada
- vencida
- convertida

## 10.6. Reglas de negocio

- toda ampliación de trabajo debe pasar por cotización o aprobación equivalente
- debe existir historial de versiones
- descuentos por encima de umbral requieren autorización
- solo ítems aprobados pueden pasar a ejecución facturable
- cotizaciones rechazadas deben guardar motivo si aplica

---

# 11. Submódulo: Orden de Trabajo (OT)

## 11.1. Objetivo

Administrar formalmente la ejecución de los trabajos aprobados sobre un vehículo.

## 11.2. Funcionalidades

- crear OT desde cotización aprobada o desde recepción según política
- numeración automática
- asignar responsable
- registrar prioridad
- definir fecha promesa
- administrar operaciones y tareas
- controlar estado de la OT
- registrar observaciones
- adjuntar documentos/evidencias
- pausar, reanudar o cerrar trabajos
- dividir tareas por técnico o especialidad

## 11.3. Datos mínimos

- número OT
- cliente
- vehículo
- recepción asociada
- cotización asociada
- asesor responsable
- técnico principal
- tipo de servicio
- prioridad
- fecha de apertura
- fecha promesa
- estado
- observaciones

## 11.4. Estados de OT

- borrador
- abierta
- en diagnóstico
- pendiente aprobación
- aprobada
- en proceso
- pausada
- esperando repuesto
- esperando autorización
- control de calidad
- lista para entrega
- entregada
- facturada
- cerrada
- anulada

## 11.5. Reglas de negocio

- no debe haber OT sin cliente y vehículo identificados
- una OT cerrada no puede modificarse sin reapertura autorizada
- una OT anulada no debe generar facturación
- las transiciones de estado deben quedar auditadas
- la fecha promesa debe ser visible en dashboard operativo

---

# 12. Submódulo: Planificación y asignación

## 12.1. Objetivo

Distribuir la carga de trabajo entre técnicos, bahías y recursos del taller.

## 12.2. Funcionalidades

- asignar técnico principal y técnicos secundarios
- asignar bahía o estación de trabajo
- programar inicio estimado y fin estimado
- consultar carga operativa del día
- reprogramar trabajos
- priorizar OT urgentes
- visualizar ocupación de técnicos y bahías

## 12.3. Reglas de negocio

- no debe asignarse un técnico fuera de su jornada sin autorización
- una bahía no debe duplicarse en el mismo horario salvo política especial
- la planificación debe contemplar disponibilidad de repuestos cuando sea posible
- las reasignaciones deben quedar registradas

---

# 13. Submódulo: Mano de obra y tiempos técnicos

## 13.1. Objetivo

Controlar el tiempo trabajado por técnico y por operación, permitiendo medir productividad y eficiencia.

## 13.2. Funcionalidades

- iniciar trabajo
- pausar trabajo
- reanudar trabajo
- finalizar trabajo
- registrar tiempo real
- registrar tiempo estándar por operación
- comparar horas vendidas vs horas consumidas
- calcular productividad por técnico
- calcular eficiencia por técnico
- registrar horas improductivas
- soportar reloj manual o automático

## 13.3. Datos mínimos

- OT
- operación
- técnico
- fecha/hora inicio
- fecha/hora fin
- pausas
- horas reales
- horas estándar
- observaciones

## 13.4. Indicadores derivados

- productividad
- eficiencia
- ocupación
- horas facturables
- horas improductivas
- cumplimiento de tiempos estándar

## 13.5. Reglas de negocio

- un técnico no debe tener dos trabajos activos simultáneamente si no está permitido
- toda imputación de tiempo debe quedar asociada a OT y operación
- las correcciones de tiempo deben requerir permiso y auditoría
- una OT no debe cerrarse sin finalizar sus tiempos activos

---

# 14. Submódulo: Repuestos e insumos en taller

## 14.1. Objetivo

Controlar los materiales utilizados por cada OT, integrando inventario y costos.

## 14.2. Funcionalidades

- reservar repuestos
- solicitar repuestos a bodega
- despachar contra OT
- registrar consumo real
- devolver sobrantes
- sustituir repuesto por equivalente autorizado
- registrar insumos menores
- manejar kits de servicio
- consultar disponibilidad
- relacionar faltantes con compras

## 14.3. Tipos de ítems

- repuesto facturable
- insumo absorbido
- lubricante
- material de taller
- servicio externo
- repuesto de garantía
- repuesto de cortesía

## 14.4. Datos mínimos

- OT
- ítem
- cantidad solicitada
- cantidad reservada
- cantidad despachada
- cantidad consumida
- cantidad devuelta
- costo
- precio
- almacén origen

## 14.5. Reglas de negocio

- no debe facturarse un repuesto no despachado, salvo política definida
- todo consumo debe generar trazabilidad de inventario
- las devoluciones deben quedar registradas
- el cambio de repuesto por equivalente debe quedar aprobado
- si no hay stock debe poder dispararse requisición o alerta

---

# 15. Submódulo: Trabajos adicionales

## 15.1. Objetivo

Gestionar trabajos descubiertos durante la ejecución que no estaban contemplados en la aprobación inicial.

## 15.2. Funcionalidades

- registrar hallazgo adicional
- estimar costo y tiempo adicional
- generar ampliación de cotización
- solicitar autorización al cliente
- aprobar total o parcialmente
- rechazar adicional
- incorporar ítems aprobados a la OT

## 15.3. Reglas de negocio

- ningún adicional facturable debe ejecutarse sin aprobación registrada
- la aprobación puede ser escrita, digital o por política comercial
- los adicionales deben mantener trazabilidad respecto a la OT original
- los tiempos y costos del adicional deben sumarse al total de la OT

---

# 16. Submódulo: Control de calidad

## 16.1. Objetivo

Verificar que el trabajo realizado cumple con estándares antes de la entrega al cliente.

## 16.2. Funcionalidades

- checklist de control por tipo de servicio
- revisión de trabajos ejecutados
- validación por jefe de taller o responsable de calidad
- prueba de ruta si aplica
- validación de niveles, fugas, ruidos, funcionamiento y limpieza
- registrar observaciones
- aprobar o rechazar para retrabajo

## 16.3. Datos mínimos

- OT
- responsable de calidad
- fecha
- checklist
- resultado
- observaciones
- aprobación

## 16.4. Reglas de negocio

- no debe cerrarse una OT sin control de calidad cuando el tipo de servicio lo exija
- si el control falla, la OT debe regresar a ejecución
- debe quedar trazabilidad del responsable que aprobó la salida

---

# 17. Submódulo: Facturación de taller

## 17.1. Objetivo

Generar el documento de cobro correspondiente a los servicios prestados y materiales utilizados.

## 17.2. Funcionalidades

- consolidar mano de obra, repuestos e insumos facturables
- aplicar impuestos
- aplicar descuentos autorizados
- gestionar anticipos
- pagos parciales
- generar factura
- generar cuenta por cobrar si aplica
- vincular OT con factura
- visualizar saldo pendiente

## 17.3. Datos mínimos

- OT
- cliente
- fecha factura
- subtotal
- impuestos
- descuentos
- total
- anticipo
- saldo
- estado factura

## 17.4. Reglas de negocio

- no debe facturarse una OT anulada
- debe poder bloquearse entrega si existe saldo pendiente según política
- la factura debe reflejar solo conceptos aprobados y ejecutados
- una factura emitida debe quedar vinculada a la OT y al cliente

---

# 18. Submódulo: Entrega del vehículo

## 18.1. Objetivo

Formalizar la devolución del vehículo al cliente con explicación del trabajo realizado y conformidad de recepción.

## 18.2. Funcionalidades

- marcar vehículo listo para entrega
- resumir trabajos realizados
- mostrar repuestos utilizados
- mostrar recomendaciones pendientes
- registrar conformidad del cliente
- capturar firma
- registrar fecha y hora de entrega
- registrar responsable de entrega
- programar próxima visita o mantenimiento

## 18.3. Datos mínimos

- OT
- cliente
- fecha y hora de entrega
- trabajos realizados
- recomendaciones futuras
- responsable
- conformidad del cliente
- estado de entrega

## 18.4. Reglas de negocio

- no debe entregarse vehículo si no ha pasado control requerido
- puede bloquearse entrega por saldo pendiente según política
- toda entrega debe quedar firmada o validada
- la entrega debe cerrar la trazabilidad operativa del servicio

---

# 19. Submódulo: Garantías y retrabajos

## 19.1. Objetivo

Controlar intervenciones realizadas bajo garantía y analizar retrabajos para mejora continua.

## 19.2. Tipos de garantía

- garantía de fábrica
- garantía comercial
- garantía de mano de obra
- garantía de repuesto
- garantía de proveedor
- garantía de campaña

## 19.3. Funcionalidades

- registrar reclamo de garantía
- asociar OT original
- evaluar cobertura
- determinar responsable del costo
- generar OT de garantía
- registrar retrabajo
- analizar causa raíz
- medir reincidencia

## 19.4. Datos mínimos

- tipo de garantía
- cliente
- vehículo
- documento origen
- causa del reclamo
- responsable del costo
- estado
- resolución

## 19.5. Reglas de negocio

- toda garantía debe referenciar documento origen
- el responsable del costo debe quedar identificado
- las OT de garantía deben diferenciarse de las comerciales
- el sistema debe permitir medir costo de garantía y retrabajo

---

# 20. Submódulo: Historial técnico del vehículo

## 20.1. Objetivo

Conservar trazabilidad completa de todas las intervenciones realizadas al vehículo a lo largo del tiempo.

## 20.2. Información visible

- datos generales del vehículo
- propietario actual e histórico
- citas
- recepciones
- diagnósticos
- cotizaciones
- OTs
- trabajos ejecutados
- repuestos instalados
- kilometraje histórico
- garantías
- campañas o recomendaciones pendientes
- fotos y evidencias

## 20.3. Funcionalidades

- consulta cronológica
- filtros por fecha, tipo de servicio o sucursal
- consulta de historial de kilometraje
- consulta de repuestos reemplazados
- consulta de OT abiertas y cerradas
- consulta de garantías previas

## 20.4. Reglas de negocio

- el historial no debe eliminarse
- toda intervención debe poder rastrearse desde la ficha del vehículo
- el historial debe alimentar CRM y postventa

---

# 21. Submódulo: Dashboards e indicadores

## 21.1. Objetivo

Brindar visibilidad operativa, comercial y financiera del taller.

## 21.2. Dashboards sugeridos

- tablero operativo del taller
- tablero de recepción
- tablero de OT por estado
- tablero de carga por técnico
- tablero de repuestos pendientes
- tablero de productividad
- tablero de garantías y retrabajos

## 21.3. KPIs operativos

- vehículos recibidos por día
- OT abiertas
- OT en proceso
- OT retrasadas
- cumplimiento de fecha promesa
- tiempo promedio de ciclo
- tiempo promedio de recepción
- tiempo muerto por falta de repuestos

## 21.4. KPIs de productividad

- horas estándar vs reales
- productividad por técnico
- eficiencia por técnico
- ocupación de bahías
- cumplimiento por asesor de servicio

## 21.5. KPIs comerciales y financieros

- ticket promedio por OT
- venta de mano de obra
- venta de repuestos en taller
- margen por OT
- margen por tipo de servicio
- descuentos aplicados
- costo de garantía
- costo de retrabajo

## 21.6. KPIs de calidad

- porcentaje de retrabajo
- reincidencia por tipo de falla
- casos de garantía
- satisfacción del cliente

---

# 22. Integraciones funcionales

## 22.1. Integración con CRM

- ver historial del cliente
- generar citas desde CRM
- activar campañas de mantenimiento
- seguimiento postservicio
- encuestas de satisfacción

## 22.2. Integración con inventario / repuestos

- reserva y despacho por OT
- devoluciones
- control de faltantes
- solicitudes de compra

## 22.3. Integración con compras

- requisición por faltante
- compra urgente para OT
- seguimiento de repuesto pendiente

## 22.4. Integración con facturación/caja

- generación de factura
- registro de anticipo
- cobro al contado o crédito
- bloqueo por saldo pendiente

## 22.5. Integración con contabilidad

- ventas de servicios
- costo de repuestos
- costo de mano de obra
- provisiones de garantía
- centros de costo

## 22.6. Integración con ventas de vehículos

- activación de garantía del vehículo vendido
- primer mantenimiento
- historial del vehículo nuevo/usado

---

# 23. Automatizaciones recomendadas

- recordatorio de cita al cliente
- alerta de vehículo retrasado
- alerta de repuesto faltante crítico
- recordatorio de aprobación pendiente
- aviso de vehículo listo
- recordatorio de próximo mantenimiento
- encuesta de satisfacción post entrega
- alerta de OT sin avance
- alerta de tiempo excedido por operación
- alerta de control de calidad pendiente

---

# 24. Roles involucrados

## Roles principales

- recepcionista
- asesor de servicio
- técnico
- jefe de taller
- inspector/calidad
- bodeguero
- facturación/caja
- gerente postventa
- auditor
- administrador

## Permisos típicos

- crear recepción
- modificar kilometraje
- abrir OT
- asignar técnico
- registrar tiempos
- solicitar repuestos
- autorizar despacho sin stock
- aprobar descuentos
- aprobar garantía
- cerrar OT
- reabrir OT
- aprobar control de calidad
- entregar vehículo

---

# 25. Requerimientos no funcionales

## 25.1. Usabilidad

- pantallas rápidas para recepción y ejecución
- visualización clara de estados
- responsive para tablet o móvil
- búsqueda por cliente, placa, VIN, OT o teléfono

## 25.2. Seguridad

- acceso por rol y sucursal
- auditoría de acciones críticas
- trazabilidad de cambios de estado
- control de edición sobre documentos cerrados

## 25.3. Rendimiento

- consulta rápida de historial de vehículo
- tablero operativo en tiempo casi real
- soporte para gran volumen de OT históricas

## 25.4. Escalabilidad

- multi-sucursal
- múltiples talleres y bodegas
- integración con ERP y BI
- ampliación futura a app móvil de técnicos

---

# 26. Reglas generales de negocio

1. No se debe iniciar trabajo sin recepción registrada.
2. No debe ejecutarse trabajo adicional facturable sin aprobación.
3. No debe consumirse repuesto sin trazabilidad de inventario.
4. No debe cerrarse OT sin finalizar tareas activas.
5. No debe entregarse vehículo sin validaciones requeridas.
6. Toda garantía debe referenciar origen.
7. Todo cambio crítico debe quedar auditado.
8. El historial técnico del vehículo debe ser permanente.
9. La fecha promesa debe ser controlada y visible.
10. Toda OT debe tener responsable operativo.

---

# 27. Flujo funcional resumido

## Flujo 1: Servicio programado

1. Se agenda cita
2. Se recibe vehículo
3. Se realiza diagnóstico
4. Se genera cotización
5. Cliente aprueba
6. Se abre OT
7. Se asignan técnicos
8. Se consumen repuestos
9. Se ejecuta trabajo
10. Se hace control de calidad
11. Se factura
12. Se entrega vehículo
13. Se activa postventa

## Flujo 2: Trabajo adicional

1. OT en proceso
2. Técnico detecta hallazgo adicional
3. Se registra recomendación
4. Se genera ampliación de cotización
5. Cliente aprueba o rechaza
6. Si aprueba, se ejecuta e incorpora a factura
7. Si rechaza, queda pendiente como recomendación futura

## Flujo 3: Garantía

1. Cliente reporta falla
2. Se valida historial
3. Se clasifica garantía
4. Se genera OT de garantía
5. Se ejecuta trabajo
6. Se registra costo absorbido
7. Se cierra con trazabilidad al caso original

---

# 28. Fases sugeridas de implementación

## Fase 1: Núcleo operativo

- citas
- recepción
- diagnóstico
- cotización
- orden de trabajo
- consumo de repuestos
- facturación básica
- historial del vehículo

## Fase 2: Control operativo

- tiempos técnicos
- planificación y asignación
- control de calidad
- dashboard operativo
- trabajos adicionales

## Fase 3: Rentabilidad y postventa

- garantías
- retrabajos
- indicadores avanzados
- automatizaciones
- integración CRM completa

## Fase 4: Escalabilidad

- multi-sucursal
- app de técnicos
- gestión de flotillas
- integración con aseguradoras
- BI avanzado

---

# 29. Resultado esperado del módulo

La empresa debe poder:

- operar el taller con control total
- mejorar productividad y cumplimiento
- evitar pérdidas por mala trazabilidad
- controlar el uso de repuestos y mano de obra
- facturar correctamente
- reducir retrabajos
- brindar mejor experiencia al cliente
- construir historial técnico completo
- integrar postventa y fidelización

---

## Si quieres construir algo grande de verdad, te recomiendo ahora la **Opción 3: menú ERP completo unificado**.

Perfecto. Vamos a hacerlo bien.

Te voy a entregar los **4 entregables** del módulo de taller:

1. **Modelo de base de datos del taller**
2. **Flujo de pantallas y menú del taller**
3. **Documento técnico más detallado**
4. **Integración CRM + Taller**

Voy a estructurarlo de forma profesional, para que te sirva como base real de análisis y desarrollo.

---

# 1. MODELO DE BASE DE DATOS DEL TALLER

Voy a plantearlo como **modelo relacional funcional**, no todavía como script SQL, pero sí lo suficientemente claro para convertirlo luego en PostgreSQL, MySQL o SQL Server.

---

## 1.1. Entidades principales

Las agrupo por dominio.

---

## A. Maestros

### tabla: `taller_sucursal`

- id
- nombre
- codigo
- direccion
- telefono
- activo

### tabla: `taller_bahia`

- id
- sucursal_id
- nombre
- codigo
- tipo_bahia
- estado
- activo

### tabla: `taller_tipo_servicio`

- id
- codigo
- nombre
- descripcion
- requiere_control_calidad
- activo

### tabla: `taller_motivo_ingreso`

- id
- codigo
- nombre
- descripcion
- activo

### tabla: `taller_prioridad`

- id
- codigo
- nombre
- nivel
- color
- activo

### tabla: `taller_estado_ot`

- id
- codigo
- nombre
- orden
- es_final
- activo

### tabla: `taller_tipo_garantia`

- id
- codigo
- nombre
- descripcion
- activo

### tabla: `taller_especialidad_tecnica`

- id
- codigo
- nombre
- descripcion
- activo

### tabla: `taller_operacion`

- id
- codigo
- nombre
- descripcion
- tipo_servicio_id
- horas_estandar
- tarifa_base
- activo

### tabla: `taller_checklist_tipo`

- id
- codigo
- nombre
- categoria
  - recepcion
  - diagnostico
  - control_calidad
- activo

### tabla: `taller_checklist_item`

- id
- checklist_tipo_id
- codigo
- nombre
- descripcion
- tipo_respuesta
  - boolean
  - texto
  - numero
  - seleccion
- obligatorio
- orden
- activo

### tabla: `empleado`

- id
- persona_id
- sucursal_id
- codigo
- tipo_empleado
  - asesor
  - tecnico
  - jefe_taller
  - bodeguero
  - calidad
- activo

### tabla: `tecnico_especialidad`

- id
- tecnico_id
- especialidad_id
- nivel
- activo

---

## B. Clientes y vehículos

Estas pueden venir del módulo maestro/CRM, pero las incluyo referencialmente.

### tabla: `cliente`

- id
- tipo_cliente
- documento
- nombre_razon_social
- telefono
- email
- direccion
- activo

### tabla: `vehiculo`

- id
- cliente_id
- placa
- vin
- marca_id
- modelo_id
- version
- anio
- motor
- transmision
- combustible
- color
- kilometraje_actual
- activo

### tabla: `vehiculo_historial_propietario`

- id
- vehiculo_id
- cliente_id
- fecha_inicio
- fecha_fin

---

## C. Citas

### tabla: `taller_cita`

- id
- sucursal_id
- cliente_id
- vehiculo_id
- asesor_id
- tipo_servicio_id
- motivo_ingreso_id
- fecha_hora
- duracion_estimada_min
- observaciones
- estado
  - programada
  - confirmada
  - atendida
  - cancelada
  - no_asistio
  - reagendada
- origen
  - crm
  - web
  - manual
  - telefono
- creada_por
- creada_en

### tabla: `taller_cita_historial`

- id
- cita_id
- estado_anterior
- estado_nuevo
- observacion
- usuario_id
- fecha

---

## D. Recepción

### tabla: `taller_recepcion`

- id
- numero
- sucursal_id
- cita_id nullable
- cliente_id
- vehiculo_id
- asesor_id
- tipo_servicio_id
- motivo_ingreso_id
- fecha_hora_ingreso
- kilometraje
- combustible_nivel
- observaciones_cliente
- observaciones_internas
- fecha_promesa
- estado
  - abierta
  - diagnosticando
  - cotizada
  - convertida_ot
  - cancelada
- firma_cliente
- autorizado_diagnostico
- creado_por
- creado_en

### tabla: `taller_recepcion_danio`

- id
- recepcion_id
- zona_vehiculo
- descripcion
- severidad
- foto_url

### tabla: `taller_recepcion_accesorio`

- id
- recepcion_id
- nombre
- cantidad
- observacion

### tabla: `taller_recepcion_checklist_respuesta`

- id
- recepcion_id
- checklist_item_id
- valor_bool
- valor_texto
- valor_numero
- valor_opcion
- observacion

### tabla: `taller_recepcion_foto`

- id
- recepcion_id
- url
- descripcion
- tipo
  - frontal
  - lateral
  - interior
  - danio
  - documento

---

## E. Diagnóstico

### tabla: `taller_diagnostico`

- id
- recepcion_id
- tecnico_id
- fecha_hora_inicio
- fecha_hora_fin
- observaciones
- criticidad_general
- estado
  - borrador
  - finalizado
  - aprobado_interno
- creado_por
- creado_en

### tabla: `taller_diagnostico_hallazgo`

- id
- diagnostico_id
- categoria
- descripcion
- criticidad
- requiere_aprobacion_cliente
- observacion

### tabla: `taller_diagnostico_operacion_sugerida`

- id
- diagnostico_id
- operacion_id
- descripcion
- horas_estimadas
- precio_estimado
- aprobado_para_cotizar

### tabla: `taller_diagnostico_repuesto_sugerido`

- id
- diagnostico_id
- producto_id
- descripcion
- cantidad
- costo_estimado
- precio_estimado

### tabla: `taller_diagnostico_evidencia`

- id
- diagnostico_id
- tipo
- url
- descripcion

---

## F. Cotización

### tabla: `taller_cotizacion`

- id
- numero
- sucursal_id
- recepcion_id
- diagnostico_id nullable
- cliente_id
- vehiculo_id
- version
- fecha_emision
- fecha_vigencia
- subtotal
- descuento
- impuesto
- total
- estado
  - borrador
  - emitida
  - enviada
  - pendiente_aprobacion
  - aprobada_total
  - aprobada_parcial
  - rechazada
  - vencida
  - convertida
- observaciones
- emitida_por
- creada_en

### tabla: `taller_cotizacion_detalle`

- id
- cotizacion_id
- tipo_item
  - operacion
  - repuesto
  - insumo
  - servicio_externo
- referencia_id
- descripcion
- cantidad
- precio_unitario
- costo_unitario
- descuento
- impuesto
- subtotal
- total
- aprobado
- orden

### tabla: `taller_cotizacion_aprobacion`

- id
- cotizacion_id
- tipo_aprobacion
  - total
  - parcial
  - rechazo
- fecha
- aprobado_por_nombre
- canal
  - presencial
  - whatsapp
  - email
  - llamada
  - firma_digital
- observacion

---

## G. Orden de trabajo

### tabla: `taller_ot`

- id
- numero
- sucursal_id
- recepcion_id
- cotizacion_id nullable
- cliente_id
- vehiculo_id
- asesor_id
- tecnico_principal_id nullable
- bahia_id nullable
- tipo_servicio_id
- prioridad_id
- fecha_apertura
- fecha_promesa
- fecha_cierre
- estado_id
- observaciones
- origen
  - recepcion
  - cita
  - garantia
  - campaña
- es_garantia
- ot_origen_garantia_id nullable
- creada_por
- creada_en

### tabla: `taller_ot_operacion`

- id
- ot_id
- operacion_id nullable
- descripcion
- tecnico_id nullable
- bahia_id nullable
- horas_estandar
- horas_vendidas
- horas_reales
- tarifa_hora
- subtotal
- estado
  - pendiente
  - asignada
  - en_proceso
  - pausada
  - finalizada
  - anulada
- orden

### tabla: `taller_ot_observacion`

- id
- ot_id
- tipo
  - interna
  - cliente
  - tecnica
  - calidad
- observacion
- usuario_id
- fecha

### tabla: `taller_ot_historial_estado`

- id
- ot_id
- estado_anterior_id
- estado_nuevo_id
- comentario
- usuario_id
- fecha

---

## H. Tiempos técnicos

### tabla: `taller_tiempo_tecnico`

- id
- ot_id
- ot_operacion_id
- tecnico_id
- fecha_hora_inicio
- fecha_hora_fin
- minutos_trabajados
- estado
  - activo
  - pausado
  - finalizado
- observacion

### tabla: `taller_tiempo_tecnico_pausa`

- id
- tiempo_tecnico_id
- fecha_hora_inicio
- fecha_hora_fin
- motivo

---

## I. Repuestos e insumos

### tabla: `taller_ot_material`

- id
- ot_id
- tipo_item
  - repuesto
  - insumo
  - lubricante
  - servicio_externo
- producto_id nullable
- descripcion
- cantidad_solicitada
- cantidad_reservada
- cantidad_despachada
- cantidad_consumida
- cantidad_devuelta
- costo_unitario
- precio_unitario
- facturable
- estado
  - solicitado
  - reservado
  - despachado
  - parcial
  - consumido
  - devuelto
  - cancelado

### tabla: `taller_ot_material_movimiento`

- id
- ot_material_id
- tipo_movimiento
  - reserva
  - despacho
  - consumo
  - devolucion
  - ajuste
- cantidad
- almacen_id
- referencia_movimiento_inventario
- usuario_id
- fecha

---

## J. Trabajos adicionales

### tabla: `taller_ot_adicional`

- id
- ot_id
- diagnostico_hallazgo_id nullable
- descripcion
- fecha
- tecnico_id
- estado
  - propuesto
  - cotizado
  - aprobado
  - rechazado
  - ejecutado
- observacion

### tabla: `taller_ot_adicional_detalle`

- id
- adicional_id
- tipo_item
- referencia_id
- descripcion
- cantidad
- precio_unitario
- costo_unitario
- total
- aprobado

---

## K. Control de calidad

### tabla: `taller_control_calidad`

- id
- ot_id
- responsable_id
- fecha
- resultado
  - aprobado
  - rechazado
  - aprobado_con_observacion
- observaciones
- requiere_retrabajo
- creado_en

### tabla: `taller_control_calidad_respuesta`

- id
- control_calidad_id
- checklist_item_id
- valor_bool
- valor_texto
- valor_numero
- valor_opcion
- observacion

---

## L. Facturación y entrega

### tabla: `taller_factura`

- id
- ot_id
- factura_id
- subtotal_servicios
- subtotal_repuestos
- descuento
- impuesto
- total
- saldo
- fecha
- estado

### tabla: `taller_entrega`

- id
- ot_id
- fecha_hora_entrega
- entregado_por
- recibido_por_nombre
- observaciones
- firma_cliente
- saldo_cancelado
- conformidad

---

## M. Garantías y retrabajos

### tabla: `taller_garantia`

- id
- tipo_garantia_id
- cliente_id
- vehiculo_id
- ot_origen_id
- recepcion_id nullable
- fecha_reclamo
- causa_reclamo
- responsable_costo
  - empresa
  - proveedor
  - fabricante
  - aseguradora
  - cliente
- estado
  - abierta
  - evaluacion
  - aprobada
  - rechazada
  - cerrada
- resolucion

### tabla: `taller_retrabajo`

- id
- ot_id
- ot_origen_id
- motivo
- causa_raiz
- costo_estimado
- costo_real
- estado

---

## N. Historial y documentos

### tabla: `taller_documento_adjunto`

- id
- entidad_tipo
- entidad_id
- nombre
- url
- tipo_archivo
- descripcion
- subido_por
- fecha

---

## O. Auditoría

### tabla: `taller_auditoria`

- id
- entidad
- entidad_id
- accion
- valor_anterior_json
- valor_nuevo_json
- usuario_id
- fecha
- ip

---

## 1.2. Relaciones clave

Relaciones más importantes:

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
- `taller_ot 1:N taller_ot_adicional`
- `taller_ot 1:N taller_control_calidad`
- `taller_ot 1:1..N taller_factura`
- `taller_ot 1:1 taller_entrega`
- `taller_ot 1:N taller_garantia`
- `vehiculo 1:N historial técnico completo`

---

## 1.3. Recomendaciones de modelado

- usar **catálogos parametrizables**
- usar **historial de estados**
- guardar **campos monetarios con decimal preciso**
- usar **soft delete** cuando aplique
- separar claramente:
  - recepción
  - diagnóstico
  - cotización
  - OT
  - facturación
- mantener auditoría sobre:
  - estados
  - descuentos
  - tiempos
  - materiales
  - cierres y reaperturas

---

# 2. FLUJO DE PANTALLAS Y MENÚ DEL TALLER

Aquí te propongo una navegación profesional, orientada a operación real.

---

## 2.1. Menú principal del módulo Taller

### Taller

- Dashboard Operativo
- Citas
- Recepciones
- Diagnósticos
- Cotizaciones
- Órdenes de Trabajo
- Planificación
- Control de Tiempos
- Repuestos para OT
- Control de Calidad
- Entregas
- Garantías y Retrabajos
- Historial Vehicular
- Reportes
- Configuración

---

## 2.2. Flujo de pantallas

---

### A. Dashboard Operativo

#### Objetivo

Dar una visión en tiempo real del estado del taller.

#### Componentes

- OT abiertas por estado
- citas del día
- vehículos en recepción
- OT retrasadas
- técnicos ocupados/libres
- repuestos pendientes
- vehículos listos para entrega
- alertas críticas

#### Acciones rápidas

- nueva cita
- nueva recepción
- abrir OT
- asignar técnico
- registrar avance
- marcar vehículo listo

---

### B. Pantalla de Citas

#### Vista listado

- fecha/hora
- cliente
- vehículo
- placa
- tipo de servicio
- asesor
- estado

#### Filtros

- fecha
- sucursal
- asesor
- tipo de servicio
- estado

#### Acciones

- crear cita
- editar
- confirmar
- reagendar
- cancelar
- convertir en recepción

#### Formulario de cita

Campos:

- cliente
- vehículo
- sucursal
- tipo de servicio
- motivo
- fecha/hora
- duración estimada
- asesor
- observaciones

---

### C. Pantalla de Recepción

#### Vista listado

- número recepción
- fecha/hora
- cliente
- vehículo
- placa
- kilometraje
- asesor
- estado

#### Acciones

- nueva recepción
- ver detalle
- editar
- iniciar diagnóstico
- generar cotización
- convertir a OT

#### Formulario de recepción

Secciones:

1. Datos del cliente
2. Datos del vehículo
3. Motivo de ingreso
4. Estado del vehículo
5. Checklist
6. Daños visibles
7. Accesorios entregados
8. Fotos
9. Firma/autorización
10. Fecha promesa

---

### D. Pantalla de Diagnóstico

#### Vista listado

- diagnóstico #
- recepción
- técnico
- vehículo
- estado
- fecha

#### Acciones

- nuevo diagnóstico
- editar
- finalizar
- enviar a cotización

#### Formulario de diagnóstico

Secciones:

1. Datos base de recepción
2. Hallazgos técnicos
3. Checklist técnico
4. Evidencias
5. Repuestos sugeridos
6. Operaciones sugeridas
7. Tiempo estimado
8. Recomendaciones

---

### E. Pantalla de Cotizaciones

#### Vista listado

- número cotización
- cliente
- vehículo
- fecha
- total
- estado
- versión

#### Acciones

- crear
- editar
- duplicar
- enviar
- registrar aprobación
- convertir a OT

#### Formulario de cotización

Secciones:

1. Encabezado
2. Mano de obra
3. Repuestos
4. Insumos
5. Servicios externos
6. Descuentos/impuestos
7. Total
8. Historial de aprobación

---

### F. Pantalla de Órdenes de Trabajo

#### Vista listado

- número OT
- cliente
- vehículo
- placa
- técnico principal
- fecha promesa
- estado
- prioridad

#### Filtros

- estado
- técnico
- asesor
- sucursal
- prioridad
- fecha promesa
- vehículo

#### Acciones

- abrir OT
- ver detalle
- cambiar estado
- asignar técnico
- registrar materiales
- registrar tiempos
- añadir trabajo adicional
- enviar a calidad
- cerrar OT

#### Pantalla detalle OT

Pestañas:

- resumen
- operaciones
- técnicos
- materiales
- tiempos
- adicionales
- observaciones
- calidad
- facturación
- historial de estados
- adjuntos

---

### G. Pantalla de Planificación

#### Vista tipo tablero

- columnas por bahía o técnico
- OT asignadas
- horas estimadas
- horas disponibles
- fecha promesa

#### Acciones

- arrastrar y soltar OT
- reasignar técnico
- cambiar prioridad
- reprogramar

---

### H. Pantalla de Control de Tiempos

#### Vista por técnico

- técnico
- OT activa
- operación
- hora inicio
- tiempo acumulado
- estado

#### Acciones

- iniciar
- pausar
- reanudar
- finalizar
- registrar manual

#### Vista analítica

- horas reales
- horas estándar
- eficiencia
- productividad

---

### I. Pantalla de Repuestos para OT

#### Vista listado

- OT
- vehículo
- ítem
- cantidad solicitada
- despachada
- consumida
- devuelta
- estado

#### Acciones

- solicitar
- reservar
- despachar
- devolver
- sustituir
- ver stock

---

### J. Pantalla de Trabajos adicionales

Puede estar dentro de OT y también como listado general.

#### Datos

- OT
- hallazgo
- monto
- estado
- aprobado/rechazado
- fecha

#### Acciones

- proponer
- cotizar
- aprobar
- ejecutar

---

### K. Pantalla de Control de Calidad

#### Vista listado

- OT
- vehículo
- responsable
- fecha
- resultado

#### Acciones

- iniciar control
- completar checklist
- aprobar
- rechazar
- devolver a ejecución

---

### L. Pantalla de Facturación / Pre-factura

Si la facturación final está en otro módulo, aquí al menos debe haber una pre-liquidación.

#### Datos

- OT
- servicios
- materiales
- descuentos
- impuestos
- total
- anticipo
- saldo

#### Acciones

- generar pre-factura
- enviar a caja/facturación
- validar bloqueos

---

### M. Pantalla de Entrega

#### Vista listado

- OT
- cliente
- vehículo
- estado
- saldo
- lista para entrega

#### Formulario

- resumen de trabajos
- repuestos cambiados
- recomendaciones
- saldo pendiente
- firma cliente
- conformidad
- próxima visita

---

### N. Pantalla de Garantías y Retrabajos

#### Vista listado

- caso
- vehículo
- OT origen
- tipo garantía
- estado
- responsable costo

#### Acciones

- registrar reclamo
- evaluar
- aprobar/rechazar
- crear OT de garantía
- cerrar

---

### O. Pantalla de Historial del Vehículo

#### Búsqueda por:

- placa
- VIN
- cliente
- OT

#### Información mostrada:

- datos del vehículo
- cliente actual
- historial de citas
- historial de recepciones
- cotizaciones
- OTs
- repuestos usados
- garantías
- kilometraje histórico
- recomendaciones pendientes

---

### P. Reportes

- productividad de técnicos
- OT por estado
- cumplimiento de promesas
- consumo de repuestos
- rentabilidad por OT
- garantías
- retrabajos
- ventas de servicios
- ventas de repuestos en taller

---

### Q. Configuración

- tipos de servicio
- motivos de ingreso
- estados OT
- prioridades
- bahías
- checklist
- operaciones estándar
- tarifas de mano de obra
- tipos de garantía
- parámetros operativos

---

# 3. DOCUMENTO TÉCNICO MÁS DETALLADO

Aquí te lo dejo en formato de:

- actores
- casos de uso
- validaciones
- estados
- reglas de transición
- historias de usuario resumidas

---

## 3.1. Actores del sistema

- recepcionista
- asesor de servicio
- técnico
- jefe de taller
- inspector de calidad
- bodeguero
- cajero/facturador
- gerente postventa
- administrador del sistema
- cliente (indirecto para aprobaciones)

---

## 3.2. Casos de uso principales

---

### CU01. Registrar cita

**Actor:** recepcionista / asesor  
**Descripción:** registrar una nueva cita para atención futura.  
**Precondición:** cliente y vehículo deben existir o ser creados.  
**Postcondición:** cita programada y visible en agenda.

**Flujo básico**

1. Usuario ingresa a “Nueva cita”.
2. Selecciona cliente y vehículo.
3. Define fecha/hora, servicio y asesor.
4. Guarda.
5. Sistema genera cita con estado “programada”.

**Validaciones**

- fecha/hora obligatoria
- servicio obligatorio
- cliente obligatorio
- vehículo obligatorio

---

### CU02. Registrar recepción

**Actor:** asesor de servicio  
**Descripción:** registrar el ingreso formal del vehículo al taller.  
**Precondición:** cliente y vehículo identificados.  
**Postcondición:** recepción creada.

**Validaciones**

- kilometraje obligatorio
- motivo de ingreso obligatorio
- asesor obligatorio
- no permitir kilometraje inconsistente sin autorización

---

### CU03. Realizar diagnóstico

**Actor:** técnico  
**Descripción:** registrar hallazgos técnicos.  
**Precondición:** recepción abierta.  
**Postcondición:** diagnóstico disponible para cotización.

**Validaciones**

- técnico obligatorio
- observación técnica obligatoria si hay hallazgos
- al finalizar debe registrar estado

---

### CU04. Emitir cotización

**Actor:** asesor de servicio  
**Descripción:** preparar propuesta económica basada en diagnóstico.  
**Precondición:** recepción o diagnóstico existente.  
**Postcondición:** cotización emitida.

**Validaciones**

- al menos un ítem
- totales correctos
- vigencia obligatoria

---

### CU05. Aprobar cotización

**Actor:** asesor / cliente indirecto  
**Descripción:** registrar aprobación total o parcial.  
**Precondición:** cotización emitida o enviada.  
**Postcondición:** cotización en estado aprobada.

**Validaciones**

- tipo de aprobación obligatorio
- si es parcial, al menos un ítem aprobado
- medio de aprobación obligatorio si política lo exige

---

### CU06. Abrir orden de trabajo

**Actor:** asesor / jefe de taller  
**Descripción:** crear OT para trabajos aprobados.  
**Precondición:** recepción válida y cotización aprobada según política.  
**Postcondición:** OT abierta.

**Validaciones**

- cliente y vehículo obligatorios
- tipo de servicio obligatorio
- fecha de apertura obligatoria
- no duplicar OT abierta igual sin autorización

---

### CU07. Asignar técnico y bahía

**Actor:** jefe de taller  
**Descripción:** distribuir OT a recursos disponibles.  
**Precondición:** OT abierta.  
**Postcondición:** OT asignada.

**Validaciones**

- técnico activo
- bahía disponible
- horario válido

---

### CU08. Registrar tiempo técnico

**Actor:** técnico  
**Descripción:** registrar horas trabajadas en una operación.  
**Precondición:** OT asignada.  
**Postcondición:** tiempo acumulado en OT.

**Validaciones**

- no permitir dos tiempos activos incompatibles
- la operación debe pertenecer a la OT

---

### CU09. Solicitar y consumir repuestos

**Actor:** técnico / bodeguero  
**Descripción:** asociar materiales a una OT.  
**Precondición:** OT activa.  
**Postcondición:** material despachado/consumido.

**Validaciones**

- cantidad mayor a cero
- stock o autorización
- trazabilidad obligatoria

---

### CU10. Registrar trabajo adicional

**Actor:** técnico / asesor  
**Descripción:** documentar hallazgo nuevo y solicitar aprobación.  
**Precondición:** OT en proceso.  
**Postcondición:** adicional en estado propuesto o aprobado.

**Validaciones**

- descripción obligatoria
- costo/tiempo estimado si será cotizado

---

### CU11. Ejecutar control de calidad

**Actor:** inspector / jefe de taller  
**Descripción:** verificar conformidad del trabajo.  
**Precondición:** OT terminada técnicamente.  
**Postcondición:** OT aprobada o devuelta a retrabajo.

**Validaciones**

- checklist completo si es obligatorio
- responsable obligatorio

---

### CU12. Generar facturación

**Actor:** caja/facturación  
**Descripción:** generar cobro de OT ejecutada.  
**Precondición:** OT con trabajos cerrados y validaciones cumplidas.  
**Postcondición:** factura emitida.

---

### CU13. Entregar vehículo

**Actor:** asesor / caja  
**Descripción:** formalizar devolución del vehículo al cliente.  
**Precondición:** OT lista para entrega.  
**Postcondición:** vehículo entregado.

**Validaciones**

- control de calidad cumplido si aplica
- validar saldo
- firma o conformidad

---

### CU14. Registrar garantía

**Actor:** asesor / gerente postventa  
**Descripción:** atender reclamo por trabajo previo o cobertura.  
**Precondición:** existencia de documento origen.  
**Postcondición:** garantía abierta y trazable.

---

## 3.3. Validaciones funcionales clave

- kilometraje de recepción no menor al último registrado, salvo autorización
- fecha promesa no menor a fecha actual
- no crear OT sin recepción
- no cerrar OT con tiempos activos
- no pasar a entrega sin control de calidad si aplica
- no facturar ítems no aprobados
- no consumir más material que el despachado sin ajuste/autorización
- no cerrar garantía sin resolución

---

## 3.4. Estados y transición de OT

### Estados:

- borrador
- abierta
- en_diagnostico
- pendiente_aprobacion
- aprobada
- en_proceso
- pausada
- esperando_repuesto
- esperando_cliente
- control_calidad
- lista_entrega
- entregada
- facturada
- cerrada
- anulada

### Transiciones válidas ejemplo

- borrador → abierta
- abierta → en_diagnostico
- en_diagnostico → pendiente_aprobacion
- pendiente_aprobacion → aprobada
- aprobada → en_proceso
- en_proceso → pausada
- en_proceso → esperando_repuesto
- en_proceso → control_calidad
- control_calidad → en_proceso
- control_calidad → lista_entrega
- lista_entrega → entregada
- entregada → facturada
- facturada → cerrada

### Reglas

- anulada solo desde estados no finales, según permisos
- cerrada solo después de entrega/facturación según política
- esperando_repuesto requiere material pendiente
- control_calidad requiere operaciones finalizadas

---

## 3.5. Historias de usuario resumidas

### HU01

Como asesor de servicio, quiero registrar la recepción del vehículo con fotos y checklist para documentar el estado inicial.

### HU02

Como técnico, quiero registrar diagnóstico y sugerir operaciones para que el cliente apruebe correctamente el trabajo.

### HU03

Como asesor, quiero emitir cotizaciones versionadas para controlar cambios y aprobaciones del cliente.

### HU04

Como jefe de taller, quiero asignar OT a técnicos y bahías para equilibrar la carga operativa.

### HU05

Como técnico, quiero iniciar y detener tiempos por operación para medir mi productividad.

### HU06

Como bodeguero, quiero despachar repuestos por OT para mantener trazabilidad de inventario.

### HU07

Como responsable de calidad, quiero validar checklist final antes de entrega para evitar retrabajos.

### HU08

Como gerente postventa, quiero ver KPIs del taller para controlar eficiencia, garantías y rentabilidad.

---

# 4. INTEGRACIÓN CRM + TALLER

Esta parte es clave porque si lo haces bien, el sistema queda poderoso.

---

## 4.1. Objetivo de la integración

Permitir que el CRM y el Taller compartan una visión única del cliente y del vehículo, logrando continuidad entre:

- captación
- cita
- servicio
- seguimiento
- fidelización
- reclamos
- próxima venta

---

## 4.2. Entidades compartidas

Debe haber una base maestra común para:

- cliente
- contacto
- empresa/cuenta
- vehículo
- sucursal
- asesor
- historial de interacciones
- documentos comerciales
- casos/reclamos

---

## 4.3. Flujos integrados principales

---

### Flujo A. CRM genera cita de taller

1. En CRM se detecta necesidad:
   - mantenimiento pendiente
   - campaña
   - reclamo
   - cliente inactivo
2. Asesor/contact center crea cita.
3. La cita aparece en agenda del taller.
4. Taller la convierte en recepción.

**Resultado:** el lead comercial/postventa se convierte en servicio real.

---

### Flujo B. Taller alimenta CRM

1. Se cierra una OT.
2. El sistema envía al CRM:
   - fecha de visita
   - tipo de servicio realizado
   - recomendaciones pendientes
   - kilometraje
   - satisfacción si existe
3. CRM actualiza vista 360 del cliente.

**Resultado:** el historial del cliente queda completo.

---

### Flujo C. Recomendaciones no aprobadas se vuelven oportunidades CRM

1. En taller se detecta trabajo adicional o futuro.
2. Cliente no aprueba en ese momento.
3. El sistema genera automáticamente:
   - oportunidad postventa
   - tarea de seguimiento
   - posible campaña futura

**Resultado:** no se pierde venta futura.

---

### Flujo D. Garantía / reclamo desde CRM hacia taller

1. Cliente registra reclamo en CRM.
2. CRM crea caso.
3. Si el caso requiere intervención técnica:
   - se genera cita
   - o recepción
   - o proceso de garantía en taller
4. Taller resuelve y devuelve resultado a CRM.

**Resultado:** reclamos comerciales y técnicos quedan conectados.

---

### Flujo E. Cliente comprador de vehículo entra a postventa

1. En ventas se registra vehículo vendido.
2. CRM agenda:
   - bienvenida
   - primer mantenimiento
   - recordatorios
3. Cuando llega al taller, el vehículo ya existe en el sistema.
4. Taller ejecuta y devuelve historial.

**Resultado:** integración completa ventas → postventa → fidelización.

---

## 4.4. Datos que Taller debe enviar al CRM

Cada vez que ocurre una atención relevante, taller debería actualizar CRM con:

- fecha última visita
- tipo de servicio realizado
- kilometraje registrado
- monto facturado
- OT número
- recomendaciones pendientes
- garantía abierta/cerrada
- satisfacción del cliente
- próxima fecha sugerida
- estado de fidelización/inactividad

---

## 4.5. Datos que CRM debe enviar al Taller

Cuando desde CRM se active una atención, debe enviar:

- cliente
- vehículo
- contacto principal
- tipo de requerimiento
- observaciones del cliente
- origen de campaña o caso
- cita programada
- prioridad
- etiquetas especiales:
  - VIP
  - garantía
  - flotilla
  - aseguradora
  - cliente con reclamo previo

---

## 4.6. Casos de uso integrados

### Caso 1: campaña de mantenimiento

- CRM detecta vehículo con mantenimiento pendiente
- envía campaña
- cliente responde
- se crea cita en taller
- taller atiende
- CRM registra conversión campaña → servicio

### Caso 2: cliente inactivo

- CRM detecta que no visita el taller hace 8 meses
- genera oportunidad de recuperación
- asesor agenda cita
- taller atiende
- CRM cambia estado del cliente a recuperado

### Caso 3: recomendación pendiente

- taller recomienda cambio de amortiguadores
- cliente rechaza por ahora
- CRM crea oportunidad de seguimiento a 30 días
- asesor vuelve a contactar

### Caso 4: baja satisfacción

- después de entrega, CRM envía encuesta
- cliente responde mal
- CRM crea caso
- taller revisa y gestiona retrabajo o garantía

---

## 4.7. Dashboard conjunto CRM + Taller

Muy recomendable tener indicadores cruzados:

- clientes atendidos en taller por campaña
- tasa de retorno al taller
- conversión de recomendaciones en ventas
- clientes inactivos recuperados
- satisfacción postservicio
- valor total del cliente
- frecuencia de servicios por vehículo
- ingresos generados desde campañas CRM

---

## 4.8. Reglas de integración

- cliente y vehículo deben ser entidades únicas compartidas
- no duplicar fichas entre CRM y taller
- todo servicio de taller debe reflejarse en la vista 360 del CRM
- recomendaciones no ejecutadas deben poder convertirse en oportunidad
- todo caso CRM con componente técnico debe vincularse a taller
- toda visita al taller debe actualizar comportamiento del cliente

---

# RECOMENDACIÓN FINAL DE IMPLEMENTACIÓN

Si vas a construir esto de forma seria, te recomiendo este orden:

## Fase 1

- maestros comunes
- cliente
- vehículo
- citas
- recepción
- diagnóstico
- cotización
- OT básica

## Fase 2

- tiempos técnicos
- materiales OT
- control de calidad
- entrega
- facturación integrada

## Fase 3

- garantías
- retrabajos
- dashboards
- integración CRM completa

## Fase 4

- automatizaciones
- campañas de postventa
- móvil para técnicos
- BI avanzado
- multi-sucursal completa

---
