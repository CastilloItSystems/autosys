# DOCUMENTO FUNCIONAL — MÓDULO DE CONCESIONARIO

## Sistema Integral de Gestión Comercial de Vehículos

**Versión 1.0 — Consolidado**
Enfocado en venta de vehículos para AutoSys
Abril 2026

---

# 1. Información General

## 1.1. Nombre del módulo

**Módulo de Concesionario**

## 1.2. Objetivo

Gestionar integralmente la operación comercial del concesionario, desde la captación del prospecto hasta la entrega formal del vehículo, incluyendo catálogo, oportunidades, cotizaciones, reserva de unidades, prueba de manejo, avalúo de usados, negociación, financiamiento, documentación, facturación, cobro, entrega, garantía inicial y seguimiento postventa.

## 1.3. Propósito del módulo

Permitir a la empresa controlar de forma trazable, rentable y eficiente:

- Captación de leads de vehículos
- Seguimiento comercial por asesor y por canal
- Administración del catálogo de vehículos nuevos y usados
- Gestión de disponibilidad real por unidad
- Cotización y propuesta comercial formal
- Reserva de unidades con control de vencimiento
- Coordinación y autorización de pruebas de manejo
- Avalúo y toma de vehículos usados como parte de pago
- Negociación comercial con trazabilidad de descuentos y aprobaciones
- Gestión de financiamiento, anticipos y formas de pago
- Control del expediente documental de la venta
- Facturación y conciliación del negocio
- Entrega del vehículo con acta de conformidad
- Activación de garantía y postventa inicial
- Historial comercial del cliente y del vehículo
- Trazabilidad digital y bitácora de eventos del negocio

## 1.4. Actores involucrados

Intervienen en el proceso los siguientes roles:

- Gerente Comercial
- Gerente de Ventas
- Gerencia General
- Supervisor Comercial
- Asesor Comercial
- Coordinador de Entregas
- Analista de Financiamiento
- Analista de Caja / Administración
- Analista de Documentación
- Responsable de Avalúos / Usados
- Responsable de Almacén de Accesorios
- Vigilancia / Garita
- Taller / Postventa
- Cliente
- Entidad financiera / banco
- Aseguradora

---

# 2. Alcance del Módulo

El módulo cubrirá los siguientes procesos:

1. Configuración comercial y catálogos base
2. Publicación y administración del catálogo de vehículos
3. Registro de leads y oportunidades del canal `VEHICULOS`
4. Seguimiento comercial y gestión del pipeline
5. Cotización y propuesta comercial
6. Reserva de unidad
7. Prueba de manejo
8. Avalúo y toma de vehículos usados
9. Negociación, descuentos y aprobaciones
10. Gestión de accesorios y servicios comerciales adicionales
11. Financiamiento y formas de pago
12. Gestión documental y expediente de venta
13. Facturación y cobro
14. Preparación y entrega del vehículo
15. Activación de garantía y postventa inicial
16. Historial comercial del cliente y del vehículo
17. Dashboards e indicadores
18. Integraciones con CRM, inventario, caja, contabilidad y taller
19. Automatizaciones y alertas operativas
20. Trazabilidad digital y bitácora del negocio

---

# 3. Tipos de Negocio Soportados

El módulo debe permitir manejar al menos los siguientes tipos de negocio:

- Venta de vehículos nuevos
- Venta de vehículos usados
- Reserva de unidades
- Venta financiada
- Venta al contado
- Venta mixta (anticipo + financiamiento)
- Venta con retoma / toma de usado
- Venta con accesorios
- Venta corporativa o flotilla
- Venta por campaña promocional
- Venta con aseguradora o convenio especial

---

# 4. Objetivos Funcionales

1. Controlar el flujo completo de la venta de vehículos.
2. Evitar pérdida de oportunidades comerciales por falta de seguimiento.
3. Garantizar disponibilidad y trazabilidad por unidad.
4. Formalizar cotizaciones, reservas, negociaciones y aprobaciones.
5. Reducir errores en documentación, facturación y entrega.
6. Integrar el canal comercial de vehículos con CRM, inventario, caja y postventa.
7. Controlar márgenes, descuentos, comisiones y condiciones comerciales.
8. Mejorar la experiencia del cliente desde la primera interacción hasta la entrega.
9. Mantener historial comercial y documental completo.
10. Facilitar seguimiento postventa, garantía inicial y fidelización.

---

# 5. Estructura Funcional del Módulo

El módulo de concesionario estará compuesto por los siguientes submódulos:

1. Maestros y configuración comercial
2. Catálogo de vehículos / unidades
3. Leads y oportunidades de vehículos
4. Seguimiento comercial y actividades
5. Cotización / propuesta comercial
6. Reserva de unidad
7. Prueba de manejo
8. Avalúo y toma de usados
9. Negociación y aprobaciones
10. Accesorios y agregados comerciales
11. Financiamiento y formas de pago
12. Expediente documental de venta
13. Facturación y cobro
14. Entrega del vehículo
15. Garantía y postventa inicial
16. Historial comercial del cliente y del vehículo
17. Trazabilidad digital y bitácora
18. Dashboards e indicadores
19. Integraciones funcionales
20. Automatizaciones recomendadas

---

# 6. Submódulo: Maestros y Configuración Comercial

## 6.1. Objetivo

Permitir parametrizar la operación comercial del concesionario según la estructura y políticas de la empresa.

## 6.2. Catálogos principales

- Marcas
- Modelos
- Versiones y motorizaciones
- Tipos de vehículo
- Condición de unidad (nuevo, usado, demo, consignación)
- Colores exteriores e interiores
- Ubicaciones físicas (showroom, patio, almacén, tránsito)
- Canales de captación
- Campañas comerciales
- Etapas del pipeline comercial
- Tipos de cotización
- Motivos de pérdida de oportunidad
- Tipos de reserva
- Tipos de prueba de manejo
- Tipos de financiamiento
- Bancos y entidades financieras
- Documentos requeridos por tipo de cliente
- Tipos de descuento y topes de autorización
- Accesorios y paquetes comerciales
- Motivos de anulación de negocio
- Estados operativos y transiciones válidas

## 6.3. Reglas configurables

- Vigencia de cotizaciones
- Vigencia de reservas
- Monto mínimo de anticipo para reservar
- Topes de descuento por nivel jerárquico
- Obligatoriedad de prueba de manejo por tipo de unidad
- Obligatoriedad de avalúo para retomas
- Documentación mínima para facturar
- Reglas de comisión por asesor
- Políticas de devolución de anticipos
- SLA de seguimiento de leads y oportunidades
- Reglas de activación de garantía y entrega

---

# 7. Submódulo: Catálogo de Vehículos / Unidades

## 7.1. Objetivo

Administrar el portafolio comercial de vehículos y la disponibilidad real de cada unidad.

## 7.2. Funcionalidades

- Registrar unidades nuevas y usadas
- Asociar unidad a marca, modelo, versión y año
- Registrar identificadores únicos: VIN/chasis, serial de motor, placa si aplica
- Definir condición de la unidad: disponible, reservada, vendida, entregada, demo, en preparación
- Gestionar precios de lista y precios promocionales
- Publicar información comercial para catálogo interno o digital
- Adjuntar fotografías, fichas técnicas y accesorios incluidos
- Administrar ubicación física de la unidad
- Consultar inventario disponible por sede, marca, modelo y condición
- Bloquear unidad por reserva o proceso de facturación
- Identificar unidades en tránsito o pendientes de alistamiento

## 7.3. Datos mínimos de una unidad

- Marca, modelo, versión, año
- VIN/chasis
- Serial de motor
- Placa, si aplica
- Condición de unidad
- Kilometraje
- Color exterior e interior
- Combustible y transmisión
- Precio de lista
- Estado comercial
- Ubicación
- Fotos y descripción comercial

## 7.4. Estados de unidad

Disponible → Apartada temporal → Reservada → En documentación → Facturada → Lista para entrega → Entregada | Cancelada reserva | Bloqueada

## 7.5. Reglas de negocio

- Ninguna unidad debe venderse dos veces.
- El VIN/chasis debe ser único por empresa.
- Una unidad reservada no debe mostrarse como disponible para otro asesor, salvo autorización.
- Una unidad facturada no puede volver a disponible sin anulación formal.
- Toda unidad usada debe contar con expediente mínimo de ingreso y avalúo.

---

# 8. Submódulo: Leads y Oportunidades de Vehículos

## 8.1. Objetivo

Gestionar prospectos y oportunidades comerciales del canal `VEHICULOS` con seguimiento estructurado hasta el cierre.

## 8.2. Funcionalidades

- Registrar leads desde web, redes, showroom, llamadas, ferias, referidos y campañas
- Clasificar origen, interés, presupuesto y urgencia
- Asignar asesor comercial
- Convertir lead en oportunidad
- Gestionar pipeline comercial por etapas
- Registrar interés por una o varias unidades
- Vincular cliente existente o prospecto nuevo
- Registrar pérdida, abandono o reactivación
- Visualizar próximas actividades y estado del negocio

## 8.3. Datos mínimos del lead / oportunidad

- Cliente o prospecto
- Canal de origen
- Unidad o modelo de interés
- Presupuesto estimado
- Forma de pago esperada
- Asesor asignado
- Etapa comercial
- Probabilidad de cierre
- Fecha estimada de compra
- Observaciones clave

## 8.4. Etapas sugeridas del pipeline

Interesado → Contactado → Calificado → Prueba de manejo → Propuesta → Negociación → Reserva → Cierre ganado | Cierre perdido

## 8.5. Reglas de negocio

- Toda oportunidad debe quedar asociada al canal `VEHICULOS`.
- No debe crearse una oportunidad sin cliente o prospecto identificado.
- Toda oportunidad perdida debe registrar motivo.
- La oportunidad debe permitir múltiples actividades y múltiples cotizaciones.
- El cierre ganado debe quedar vinculado al negocio/venta correspondiente.

---

# 9. Submódulo: Seguimiento Comercial y Actividades

## 9.1. Objetivo

Garantizar control operativo del seguimiento comercial y evitar oportunidades sin gestión.

## 9.2. Funcionalidades

- Registrar llamadas, visitas, correos, WhatsApp y reuniones
- Programar tareas y recordatorios
- Gestionar seguimiento por fecha compromiso
- Registrar comentarios, objeciones y compromisos
- Escalar oportunidades estancadas
- Registrar próximas acciones
- Mostrar agenda del asesor
- Alertar actividades vencidas

## 9.3. Reglas de negocio

- Toda oportunidad activa debe tener próxima actividad definida.
- Las actividades vencidas deben quedar visibles en dashboard comercial.
- Las interacciones relevantes deben quedar auditadas en el historial del cliente.
- Un negocio sin seguimiento por encima del SLA debe generar alerta.

---

# 10. Submódulo: Cotización / Propuesta Comercial

## 10.1. Objetivo

Generar una propuesta económica formal del negocio para aprobación del cliente.

## 10.2. Componentes

Unidad, accesorios, gastos administrativos, descuentos, impuestos, servicios opcionales, valor de retoma, financiamiento estimado, anticipo requerido.

## 10.3. Funcionalidades

- Generar cotización desde oportunidad o desde catálogo
- Seleccionar unidad específica o cotizar por modelo/versión
- Agregar accesorios y paquetes comerciales
- Incluir valor estimado de retoma
- Incluir simulación de financiamiento
- Aplicar descuentos con validación jerárquica
- Emitir múltiples versiones
- Enviar al cliente
- Registrar aprobación, rechazo o vencimiento
- Convertir cotización aprobada en reserva o negocio

## 10.4. Datos mínimos

- Cliente
- Unidad o modelo cotizado
- Precio base
- Accesorios
- Descuentos
- Impuestos
- Vigencia
- Asesor
- Condiciones de pago
- Observaciones comerciales

## 10.5. Estados

Borrador → Emitida → Enviada → Pendiente respuesta → Aprobada | Rechazada | Vencida | Convertida

## 10.6. Reglas de negocio

- Toda cotización debe tener vigencia.
- Debe existir historial de versiones.
- Los descuentos fuera de umbral requieren autorización jerárquica.
- Una cotización aprobada no equivale por sí sola a unidad reservada.
- Debe poder existir más de una cotización por oportunidad.

---

# 11. Submódulo: Reserva de Unidad

## 11.1. Objetivo

Controlar el apartado formal de una unidad específica para evitar doble promesa comercial y asegurar compromiso del cliente.

## 11.2. Funcionalidades

- Reservar una unidad específica
- Registrar anticipo o soporte de pago
- Definir fecha de vencimiento de la reserva
- Bloquear la unidad para otros negocios
- Registrar condiciones de devolución del anticipo
- Renovar o cancelar reserva
- Convertir reserva en venta facturable
- Liberar la unidad si vence o se cancela

## 11.3. Datos mínimos de una reserva

- Cliente
- Unidad específica
- Cotización origen
- Fecha de reserva
- Fecha de vencimiento
- Monto de anticipo
- Forma de pago del anticipo
- Responsable comercial
- Estado
- Términos aceptados por el cliente

## 11.4. Estados

Pendiente pago → Activa → Próxima a vencer → Vencida | Cancelada | Convertida

## 11.5. Reglas de negocio

- No debe existir más de una reserva activa sobre la misma unidad.
- Toda reserva debe tener fecha de vencimiento.
- La reserva debe requerir anticipo cuando la política lo exija.
- Al cancelar o vencer una reserva, la unidad debe volver a disponible si no existe otro bloqueo formal.
- Las devoluciones de anticipo deben seguir política aprobada y quedar auditadas.

---

# 12. Submódulo: Prueba de Manejo

## 12.1. Objetivo

Coordinar y registrar la prueba de manejo del cliente como parte del proceso de decisión comercial.

## 12.2. Funcionalidades

- Programar prueba de manejo
- Asignar unidad demo o autorizada
- Validar documentos del cliente
- Registrar acompañante interno responsable
- Confirmar fecha, hora y ruta
- Registrar observaciones del cliente posteriores a la prueba
- Vincular resultado a la oportunidad comercial
- Bloquear temporalmente la unidad durante la prueba

## 12.3. Datos mínimos

- Cliente
- Oportunidad asociada
- Unidad asignada
- Fecha y hora
- Asesor responsable
- Responsable acompañante
- Licencia/documento validado
- Resultado de la prueba
- Observaciones

## 12.4. Reglas de negocio

- No debe programarse prueba sin cliente identificado.
- La unidad usada para prueba debe estar autorizada para ese fin.
- Debe existir registro de entrega y retorno de la unidad.
- Toda incidencia ocurrida durante la prueba debe quedar documentada.
- La prueba debe alimentar el avance del pipeline comercial.

---

# 13. Submódulo: Avalúo y Toma de Usados

## 13.1. Objetivo

Gestionar la evaluación y aceptación de un vehículo usado como parte de pago o retoma comercial.

## 13.2. Funcionalidades

- Registrar solicitud de retoma
- Capturar datos del vehículo usado
- Documentar estado general, kilometraje y condiciones mecánicas/estéticas
- Adjuntar fotos, documentos y observaciones
- Registrar valor estimado, valor aprobado y observaciones de riesgo
- Relacionar el avalúo con una oportunidad o cotización
- Aprobar o rechazar la retoma
- Integrar el valor aprobado al negocio comercial

## 13.3. Datos mínimos de avalúo

- Cliente
- Marca, modelo, año, placa
- VIN/chasis
- Kilometraje
- Estado general
- Fotos
- Documentación del vehículo
- Valor estimado
- Valor aprobado
- Responsable del avalúo
- Estado

## 13.4. Estados

Solicitado → En evaluación → Pendiente aprobación → Aprobado | Rechazado | Integrado al negocio

## 13.5. Reglas de negocio

- Toda retoma debe contar con avalúo formal.
- El valor aprobado puede diferir del valor solicitado y debe quedar justificado.
- No debe integrarse una retoma al negocio sin aprobación.
- El expediente del avalúo debe quedar vinculado al cliente y a la venta.

---

# 14. Submódulo: Negociación y Aprobaciones

## 14.1. Objetivo

Controlar condiciones extraordinarias del negocio, manteniendo trazabilidad de aprobaciones comerciales y financieras.

## 14.2. Funcionalidades

- Solicitar descuento especial
- Solicitar bonificaciones o accesorios sin costo
- Aprobar excepciones de precio
- Aprobar condiciones especiales de pago
- Aprobar uso de unidad distinta a la inicialmente negociada
- Registrar observaciones y justificación comercial
- Mantener historial de quién autorizó cada excepción

## 14.3. Reglas de negocio

- Toda excepción debe quedar auditada con usuario, fecha y motivo.
- Los niveles de descuento deben seguir jerarquía definida.
- No debe avanzarse a facturación con condiciones no aprobadas.
- Las aprobaciones deben quedar visibles en el expediente del negocio.

---

# 15. Submódulo: Accesorios y Agregados Comerciales

## 15.1. Objetivo

Gestionar accesorios, paquetes y servicios adicionales ofrecidos dentro del negocio comercial.

## 15.2. Funcionalidades

- Agregar accesorios a cotización y venta
- Definir si el accesorio es facturable, bonificado o promocional
- Reservar disponibilidad de accesorios
- Coordinar instalación previa a la entrega
- Integrar costo al margen del negocio
- Registrar evidencia de instalación si aplica

## 15.3. Reglas de negocio

- No debe prometerse un accesorio sin disponibilidad o aprobación de compra.
- Todo accesorio bonificado debe quedar autorizado.
- La entrega del vehículo debe validar que los accesorios comprometidos estén instalados o claramente pendientes.

---

# 16. Submódulo: Financiamiento y Formas de Pago

## 16.1. Objetivo

Gestionar la estructura financiera del negocio comercial, incluyendo crédito, contado, anticipos y pagos mixtos.

## 16.2. Funcionalidades

- Registrar condición de pago: contado, crédito, mixto
- Simular financiamiento
- Asociar banco o entidad financiera
- Registrar documentos para evaluación financiera
- Registrar aprobación o rechazo del crédito
- Gestionar anticipo, saldo y cronograma de pagos
- Registrar pagos recibidos y soportes
- Conciliar pagos con caja/administración

## 16.3. Datos mínimos

- Tipo de negocio financiero
- Banco / entidad
- Monto financiado
- Enganche / anticipo
- Plazo
- Tasa referencial
- Estado de aprobación
- Documentos entregados
- Observaciones

## 16.4. Estados

No aplica | En simulación → En análisis → Aprobado | Rechazado | Formalizado

## 16.5. Reglas de negocio

- No debe pasarse a entrega sin validación de pago completo o aprobación formal de crédito.
- Todo anticipo debe tener soporte y conciliación en caja.
- La aprobación financiera debe quedar archivada en el expediente.
- Los pagos mixtos deben permitir trazabilidad por método de pago.

---

# 17. Submódulo: Expediente Documental de Venta

## 17.1. Objetivo

Concentrar y controlar todos los documentos necesarios para formalizar la venta y entrega del vehículo.

## 17.2. Funcionalidades

- Definir checklist documental por tipo de cliente y tipo de negocio
- Cargar cédulas, RIF, licencias, soportes bancarios, contratos, pólizas y documentos de retoma
- Validar recepción de documentos obligatorios
- Marcar documentos vencidos, pendientes o rechazados
- Relacionar documentos con cotización, reserva, financiamiento y factura
- Aprobar expediente para facturación y entrega

## 17.3. Información mínima visible

- Cliente
- Tipo de negocio
- Lista de documentos requeridos
- Documentos cargados
- Estado por documento
- Responsable de validación
- Fecha de aprobación documental
- Observaciones

## 17.4. Reglas de negocio

- No debe facturarse una venta sin expediente mínimo completo, salvo autorización extraordinaria.
- No debe entregarse un vehículo si existe documentación crítica pendiente.
- Todo documento aprobado debe quedar vinculado permanentemente al negocio.
- Las observaciones documentales deben ser visibles para Comercial y Administración.

---

# 18. Submódulo: Facturación y Cobro

## 18.1. Objetivo

Generar el documento de cobro y consolidar administrativamente el negocio de venta.

## 18.2. Funcionalidades

- Consolidar unidad, accesorios, descuentos y conceptos facturables
- Aplicar impuestos y condiciones aprobadas
- Registrar anticipos aplicados
- Generar factura
- Generar cuenta por cobrar cuando aplique
- Conciliar pagos recibidos
- Relacionar factura con reserva y negocio
- Controlar saldo pendiente

## 18.3. Reglas de negocio

- No debe facturarse una unidad sin bloqueo comercial/documental correspondiente.
- La factura debe reflejar exactamente las condiciones aprobadas.
- No debe liberarse la entrega con saldo pendiente fuera de política.
- Toda anulación o reverso debe seguir autorización formal.

---

# 19. Submódulo: Entrega del Vehículo

## 19.1. Objetivo

Formalizar la devolución comercial del vehículo al cliente con validación de pagos, documentos, accesorios, estado físico y conformidad.

## 19.2. Funcionalidades

- Preparar unidad para entrega
- Validar limpieza, alistamiento y combustible según política
- Confirmar instalación de accesorios comprometidos
- Verificar documentos de entrega
- Generar acta de entrega y conformidad
- Registrar fecha/hora de entrega y responsable
- Explicar cobertura inicial de garantía, mantenimientos y próximos pasos
- Entregar manuales, llaves, carnet, accesorios y documentos
- Registrar salida por garita si aplica

## 19.3. Datos mínimos de entrega

- Cliente
- Unidad
- Factura asociada
- Responsable de entrega
- Acta firmada
- Checklist de entrega
- Accesorios entregados
- Documentos entregados
- Kilometraje de entrega
- Fecha/hora

## 19.4. Reglas de negocio

- No debe entregarse una unidad sin factura y/o validación de cobro según política.
- Toda entrega debe quedar respaldada por acta firmada.
- Debe validarse que la unidad física coincide con la unidad facturada.
- Toda observación del cliente al momento de la entrega debe quedar registrada.
- La entrega cierra operativamente la venta y activa el postventa inicial.

---

# 20. Submódulo: Garantía y Postventa Inicial

## 20.1. Objetivo

Activar la relación postventa inicial del cliente después de la entrega del vehículo.

## 20.2. Funcionalidades

- Registrar activación de garantía
- Programar primer mantenimiento o contacto postventa
- Generar seguimiento de satisfacción inicial
- Crear recordatorios comerciales para renovación, referidos o accesorios futuros
- Derivar al módulo de taller cuando aplique

## 20.3. Reglas de negocio

- Toda entrega debe poder activar garantía y seguimiento postventa.
- El historial del vehículo debe integrarse con taller y CRM.
- Las incidencias tempranas deben poder convertirse en caso o garantía.

---

# 21. Submódulo: Historial Comercial del Cliente y del Vehículo

## 21.1. Objetivo

Conservar trazabilidad completa de la relación comercial con el cliente y de cada unidad vendida.

## 21.2. Información visible

- Leads y oportunidades
- Actividades e interacciones
- Cotizaciones emitidas
- Reservas
- Pruebas de manejo
- Avalúos de retoma
- Negociaciones y aprobaciones
- Pagos y facturas
- Entregas
- Garantías iniciales
- Casos o incidencias
- Vehículos asociados al cliente

## 21.3. Reglas de negocio

- El historial no debe eliminarse.
- Toda intervención comercial debe poder rastrearse desde la ficha del cliente.
- El historial del vehículo debe continuar disponible aun después de la entrega.
- Debe poder alimentar CRM, taller y fidelización.

---

# 22. Submódulo: Trazabilidad Digital y Bitácora

## 22.1. Objetivo

Mantener una bitácora digital completa de cada evento relevante del negocio comercial.

## 22.2. Funcionalidades

- Registrar eventos automáticos y manuales
- Registrar cambios de etapa, cotización, reserva, pago, aprobación y entrega
- Adjuntar evidencias, soportes y observaciones
- Registrar quién autorizó cada excepción
- Mantener línea de tiempo del negocio

## 22.3. Reglas de negocio

- Toda acción crítica debe quedar auditada.
- Las aprobaciones y rechazos deben registrar usuario, fecha y motivo.
- La bitácora no debe poder eliminarse ni alterarse retroactivamente.

---

# 23. Submódulo: Dashboards e Indicadores

## 23.1. Dashboards sugeridos

- Tablero comercial del concesionario
- Tablero de leads y oportunidades
- Tablero de reservas
- Tablero de cotizaciones vigentes
- Tablero de entregas programadas
- Tablero de unidades disponibles y bloqueadas
- Tablero de financiamiento
- Tablero de comisiones y desempeño comercial

## 23.2. KPIs comerciales

- Leads captados por canal
- Tasa de conversión lead → oportunidad
- Tasa de conversión oportunidad → venta
- Tiempo promedio de ciclo comercial
- Cotizaciones emitidas vs. aprobadas
- Reservas activas y vencidas
- Ventas por asesor, sede, marca y modelo

## 23.3. KPIs financieros

- Monto vendido
- Ticket promedio
- Margen por negocio
- Descuentos aplicados
- Anticipos pendientes de formalización
- Ventas financiadas vs. contado

## 23.4. KPIs operativos

- Unidades disponibles
- Unidades reservadas
- Entregas pendientes
- Expedientes documentales incompletos
- Negocios retrasados por financiamiento o documentos

## 23.5. KPIs de postventa inicial

- Entregas con seguimiento realizado
- Primer mantenimiento programado
- Casos o reclamos tempranos
- Satisfacción inicial del cliente

---

# 24. Integraciones Funcionales

## 24.1. Integración con CRM

Registro y conversión de leads, oportunidades, actividades, campañas, clientes y vista 360 del canal `VEHICULOS`.

## 24.2. Integración con inventario / catálogo

Disponibilidad de unidades, datos de marca/modelo, accesorios, estados de la unidad y bloqueo por reserva o venta.

## 24.3. Integración con caja / facturación

Registro de anticipos, pagos, conciliación, facturación, saldos pendientes y soporte de cobros.

## 24.4. Integración con contabilidad

Reconocimiento de ingresos, cuentas por cobrar, anticipos, comisiones, costos y movimientos contables asociados a la venta.

## 24.5. Integración con taller / postventa

Activación de garantía, primer mantenimiento, campañas de servicio y seguimiento postentrega.

## 24.6. Integración con bancos / financieras

Consulta y formalización de créditos, estado de solicitudes y aprobación financiera.

---

# 25. Automatizaciones Recomendadas

- Asignación automática de lead por canal o sede
- Recordatorio de seguimiento vencido
- Alerta de oportunidad estancada
- Alerta de cotización por vencer
- Alerta de reserva próxima a vencer
- Alerta de documento faltante para facturación
- Aviso de crédito aprobado o rechazado
- Recordatorio de entrega programada
- Activación automática de seguimiento postventa
- Encuesta de satisfacción posterior a la entrega

---

# 26. Validaciones Funcionales Clave

- No crear oportunidad sin cliente o prospecto identificado.
- No reservar una unidad ya reservada o facturada.
- No facturar sin expediente documental mínimo completo, salvo autorización extraordinaria.
- No entregar una unidad con saldo pendiente fuera de política.
- No registrar venta sin unidad específica identificada por VIN/chasis cuando sea venta cerrada.
- No aprobar descuento fuera de umbral sin autorización jerárquica.
- No convertir cotización en reserva sin aceptar condiciones comerciales mínimas.
- No activar entrega si accesorios comprometidos siguen pendientes sin aceptación explícita del cliente.
- No cerrar venta sin acta de entrega firmada.

---

# 27. Roles y Permisos

## 27.1. Jerarquía de autorizaciones

| Nivel | Rol | Alcance de autorización |
|-------|-----|------------------------|
| 1 | Asesor Comercial | Gestión operativa de leads, oportunidades, cotizaciones y seguimiento |
| 2 | Supervisor / Gerente de Ventas | Aprobación de descuentos y condiciones comerciales dentro de umbrales |
| 3 | Gerente Comercial | Aprobación de excepciones relevantes, reservas especiales y condiciones extraordinarias |
| 4 | Gerencia General | Casos excepcionales, anulaciones extraordinarias y decisiones fuera de política |

## 27.2. Permisos típicos por rol

| Acción | Asesor | Supervisor | Gerente | Administración | Documentación | Entregas | Caja |
|--------|--------|------------|---------|----------------|---------------|----------|------|
| Crear lead / oportunidad | ✓ | ✓ | ✓ | | | | |
| Emitir cotización | ✓ | ✓ | ✓ | | | | |
| Aprobar descuento | | ✓ | ✓ | | | | |
| Reservar unidad | ✓ | ✓ | ✓ | | | | |
| Aprobar excepción comercial | | | ✓ | | | | |
| Validar expediente documental | | | | | ✓ | | |
| Registrar pago / anticipo | | | | ✓ | | | ✓ |
| Facturar negocio | | | | ✓ | | | ✓ |
| Coordinar entrega | | | | | | ✓ | |
| Confirmar entrega final | ✓ | | | | | ✓ | |

---

# 28. Flujos Funcionales

## 28.1. Flujo completo: lead a entrega

1. Se registra lead del canal `VEHICULOS`.
2. Se asigna asesor comercial.
3. El asesor contacta, califica y convierte en oportunidad.
4. Se identifica unidad o modelo de interés.
5. Se agenda prueba de manejo si aplica.
6. Se emite cotización.
7. Se negocian condiciones y descuentos.
8. Si aplica, se registra avalúo de retoma.
9. El cliente confirma intención y se genera reserva de unidad.
10. Se registra anticipo y se bloquea la unidad.
11. Se gestiona financiamiento o pago contado.
12. Se completa expediente documental.
13. Administración valida negocio para facturación.
14. Se factura y se concilian pagos.
15. Se prepara la unidad para entrega.
16. Se firma acta de entrega y conformidad.
17. Se activa garantía y seguimiento postventa inicial.

## 28.2. Flujo: reserva vencida

1. La reserva se acerca a fecha de vencimiento.
2. El sistema alerta al asesor y supervisor.
3. Si no se renueva ni convierte, la reserva vence.
4. La unidad vuelve a estado disponible.
5. El negocio queda marcado para reactivación o pérdida.

## 28.3. Flujo: venta con retoma

1. Cliente manifiesta entrega de usado como parte de pago.
2. Se registra solicitud de avalúo.
3. Responsable de usados evalúa la unidad.
4. Se aprueba valor de retoma.
5. El valor se incorpora a la cotización o negocio.
6. La documentación del usado se integra al expediente.

## 28.4. Flujo: venta financiada

1. Cliente elige opción de crédito.
2. Se simula plan financiero.
3. Se solicitan documentos.
4. Se remite a entidad financiera.
5. Se registra aprobación o rechazo.
6. Aprobado el crédito, se formaliza el negocio.
7. Se factura y entrega conforme a la validación administrativa.

---

# 29. Anexos Sugeridos

## 29.1. Pantallas principales sugeridas

- Dashboard comercial de concesionario
- Lista de leads y oportunidades de vehículos
- Ficha del cliente y vista 360
- Catálogo de unidades
- Ficha de unidad
- Cotizador comercial
- Pantalla de reservas
- Pantalla de pruebas de manejo
- Pantalla de avalúo de usados
- Bandeja de expediente documental
- Pantalla de entregas programadas

## 29.2. Entidades funcionales principales

- Cliente
- Lead
- Oportunidad
- Unidad / vehículo
- Cotización
- Reserva
- Prueba de manejo
- Avalúo
- Negocio / venta
- Expediente documental
- Pago / anticipo
- Factura
- Entrega

---

# 30. Extensiones Futuras

El manual operativo de referencia contempla también venta de maquinaria y equipos. En esta versión del módulo, el alcance queda centrado en vehículos. Como extensión futura, el sistema debe poder parametrizar:

- Tipos de activo distintos a vehículo
- Reglas documentales específicas de maquinaria/equipos
- Flujos de entrega técnica especializados
- Garantías y contratos particulares por tipo de activo
- Estructuras de cotización y financiamiento adaptadas a maquinaria/equipos

Estas variantes no forman parte del flujo funcional obligatorio de la versión 1 del módulo de concesionario.
