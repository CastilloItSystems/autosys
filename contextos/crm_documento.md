Perfecto. Te dejo el **Documento Funcional del CRM Automotriz** pensado para una empresa que:

- vende vehículos
- vende repuestos
- tiene taller
- quiere una solución robusta, escalable y profesional

Lo voy a estructurar como si fuera una base real para análisis funcional, diseño y desarrollo.

---

# DOCUMENTO FUNCIONAL

# CRM AUTOMOTRIZ ROBUSTO

---

## Estado de implementación (AutoSys - abril 2026)

Implementado en código:

- Leads + conversión explícita a oportunidades (`POST /api/crm/leads/:id/convert`)
- Oportunidades separadas con pipeline y cierre ganado/perdido
- Actividades/interacciones/cotizaciones/casos
- Campañas (base + métricas mínimas)
- Fidelización (eventos + encuestas NPS)
- Automatizaciones CRM v1 (oportunidades estancadas, actividades vencidas, SLA vencido, recordatorios de cierre)

Pendiente para siguientes iteraciones:

- Designer visual de reglas de automatización
- Integraciones externas de captación multicanal (web/redes/WhatsApp)
- Parametrización avanzada de catálogos CRM en UI administrativa

---

# 1. Información general

## 1.1. Nombre del módulo

**CRM Automotriz**

## 1.2. Objetivo

Centralizar y gestionar de forma integral la relación con clientes, prospectos y empresas, permitiendo administrar:

- captación de leads
- seguimiento comercial
- oportunidades de negocio
- actividades e interacciones
- cotizaciones
- campañas de marketing
- reclamos/casos
- fidelización y postventa

Todo esto conectado con las líneas de negocio de:

- venta de vehículos
- venta de repuestos
- taller y postventa

---

# 2. Alcance del módulo

El módulo CRM permitirá:

- registrar contactos y empresas
- administrar prospectos/leads
- calificar y convertir leads en oportunidades
- gestionar pipelines comerciales por línea de negocio
- programar y controlar actividades de seguimiento
- generar cotizaciones comerciales
- disponer de una vista 360 del cliente
- ejecutar campañas y segmentación
- gestionar reclamos y casos
- automatizar recordatorios y tareas
- medir desempeño comercial y de servicio

---

# 3. Objetivos funcionales

1. Tener una base única y confiable de clientes y contactos.
2. Evitar pérdida de prospectos y oportunidades.
3. Estandarizar el seguimiento comercial.
4. Incrementar la conversión de leads a ventas.
5. Mejorar la retención y fidelización de clientes.
6. Integrar marketing, ventas y postventa.
7. Facilitar el análisis de rentabilidad y comportamiento del cliente.
8. Preparar la integración con ventas, taller, repuestos y facturación.

---

# 4. Tipos de clientes gestionados

El CRM debe soportar distintos perfiles:

- cliente particular
- cliente empresa
- cliente flotilla
- aseguradora
- taller externo
- proveedor vinculado comercialmente
- prospecto sin compra
- cliente recurrente
- cliente VIP

---

# 5. Líneas de negocio del CRM

El CRM debe operar con al menos tres líneas de negocio:

## 5.1. Vehículos

- vehículos nuevos
- vehículos usados
- accesorios
- financiamiento
- renovación / retoma

## 5.2. Repuestos

- venta mostrador
- venta corporativa
- venta recurrente
- cotizaciones de repuestos
- convenios con talleres externos

## 5.3. Taller y postventa

- citas de servicio
- mantenimiento preventivo
- mantenimiento correctivo
- campañas postventa
- garantías
- retención y recuperación de clientes

---

# 6. Estructura funcional del CRM

El módulo CRM estará compuesto por los siguientes submódulos:

1. Contactos y cuentas
2. Leads / prospectos
3. Oportunidades
4. Actividades y seguimiento
5. Cotizaciones comerciales
6. Vista 360 del cliente
7. Campañas y marketing
8. Casos / reclamos / PQRS
9. Postventa y fidelización
10. Dashboards e indicadores
11. Configuración y parametrización
12. Automatizaciones e integración

---

# 7. Submódulo: Contactos y Cuentas

## 7.1. Objetivo

Registrar y administrar personas y empresas relacionadas con la operación comercial y postventa.

## 7.2. Tipos de registro

### Contacto persona

Representa individuos como:

- compradores
- prospectos
- conductores
- encargados de compras
- representantes de aseguradoras
- gerentes de flota

### Cuenta / empresa

Representa organizaciones como:

- empresas clientes
- flotillas
- aseguradoras
- talleres externos
- clientes corporativos

## 7.3. Funcionalidades

- crear, editar, consultar y desactivar contactos
- crear, editar, consultar y desactivar cuentas
- asociar múltiples contactos a una cuenta
- identificar contacto principal
- clasificar contactos y cuentas
- evitar duplicados por documento, teléfono o email
- registrar múltiples teléfonos y medios de contacto
- adjuntar documentos y observaciones
- etiquetar clientes por segmentos

## 7.4. Datos funcionales mínimos del contacto

- nombres
- apellidos
- documento
- fecha de nacimiento
- teléfonos
- WhatsApp
- email
- dirección
- ciudad
- país
- canal preferido
- asesor asignado
- origen
- estado
- observaciones

## 7.5. Datos funcionales mínimos de la cuenta

- razón social
- RUC/NIT
- nombre comercial
- industria
- dirección
- teléfonos
- email
- ciudad
- asesor responsable
- clasificación
- condiciones de crédito
- estado

## 7.6. Reglas de negocio

- no debe permitirse duplicidad exacta de documento
- un contacto puede pertenecer a varias cuentas si el negocio lo requiere
- una cuenta puede tener múltiples contactos
- al convertir un lead se debe validar si el contacto ya existe
- los campos de identificación deben ser auditables

---

# 8. Submódulo: Leads / Prospectos

## 8.1. Objetivo

Registrar y administrar toda intención comercial inicial proveniente de clientes potenciales.

## 8.2. Tipos de lead

- lead de vehículo nuevo
- lead de vehículo usado
- lead de repuestos
- lead de taller
- lead de mantenimiento
- lead de empresa/flotilla
- lead de aseguradora
- lead de campaña promocional

## 8.3. Funcionalidades

- registrar leads manualmente
- importar leads desde archivo
- capturar leads desde web, redes o formularios
- asignar lead a asesor
- calificar lead
- actualizar estado
- convertir lead en oportunidad
- descartar lead con motivo
- visualizar historial de contactos y seguimiento
- registrar fuente y campaña de origen

## 8.4. Datos mínimos del lead

- nombre o referencia
- contacto asociado
- empresa asociada si aplica
- línea de negocio
- producto/servicio de interés
- necesidad del cliente
- presupuesto estimado
- urgencia
- fuente
- campaña asociada
- asesor asignado
- fecha de ingreso
- estado
- score o nivel de interés

## 8.5. Estados del lead

- nuevo
- asignado
- contactado
- en seguimiento
- calificado
- no calificado
- convertido
- perdido

## 8.6. Reglas de negocio

- todo lead debe tener responsable
- todo lead nuevo debe generar actividad de primer contacto
- si no se registra gestión dentro de un tiempo definido debe generar alerta
- un lead perdido debe registrar motivo
- un lead convertido no debe editarse sin permisos especiales
- debe guardarse historial de cambios de estado

---

# 9. Submódulo: Oportunidades

## 9.1. Objetivo

Gestionar negocios potenciales con probabilidad de cierre y valor comercial identificado.

## 9.2. Funcionalidades

- crear oportunidades desde lead o manualmente
- administrar pipeline por línea de negocio
- asignar responsable y sucursal
- registrar monto estimado
- registrar probabilidad de cierre
- actualizar etapa
- asociar productos, servicios o interés comercial
- relacionar actividades
- generar cotización
- marcar como ganada o perdida
- registrar competidor y motivo de pérdida

## 9.3. Tipos de oportunidad

- venta de vehículo
- retoma / usado
- venta de repuestos
- convenio de abastecimiento
- servicio de taller
- contrato de mantenimiento
- convenio corporativo
- atención a aseguradora

## 9.4. Datos mínimos

- nombre de oportunidad
- contacto / cliente
- empresa
- línea de negocio
- descripción
- producto o servicio principal
- monto estimado
- probabilidad
- etapa
- fecha estimada de cierre
- asesor responsable
- sucursal
- origen
- estado

## 9.5. Pipelines sugeridos

### Pipeline vehículos

- lead calificado
- contacto inicial
- análisis de necesidad
- cotización
- prueba / demostración
- negociación
- aprobación
- venta cerrada
- perdida

### Pipeline repuestos

- consulta
- identificación de necesidad
- cotización enviada
- seguimiento
- negociación
- pedido confirmado
- venta cerrada
- perdida

### Pipeline taller/postventa

- consulta
- agendamiento
- recepción / evaluación
- diagnóstico
- cotización
- aprobación
- ejecución / OT
- entregado
- cerrada
- perdida

## 9.6. Reglas de negocio

- una oportunidad debe pertenecer a una línea de negocio
- toda oportunidad activa debe tener próxima actividad
- motivo de pérdida obligatorio
- oportunidad ganada debe permitir originar proceso siguiente:
  - venta
  - cita
  - orden de trabajo
  - pedido
- cambios de etapa deben quedar auditados

---

# 10. Submódulo: Actividades y seguimiento

## 10.1. Objetivo

Registrar y controlar todas las interacciones y acciones de seguimiento comercial o de servicio.

## 10.2. Tipos de actividad

- llamada
- WhatsApp
- email
- visita
- reunión
- prueba de manejo
- envío de cotización
- recordatorio
- tarea interna
- seguimiento postventa
- encuesta
- cita comercial

## 10.3. Funcionalidades

- crear actividad manual
- generar actividad automática
- asignar responsable
- programar fecha y hora
- marcar resultado
- registrar comentarios
- definir próxima actividad
- relacionar actividad con lead, oportunidad, cliente, vehículo o caso
- ver agenda personal y por equipo
- alertas de actividades vencidas
- historial cronológico

## 10.4. Datos mínimos

- tipo de actividad
- asunto
- fecha programada
- hora
- responsable
- estado
- resultado
- observaciones
- próxima acción
- entidad relacionada

## 10.5. Estados

- pendiente
- realizada
- vencida
- cancelada
- reprogramada

## 10.6. Reglas de negocio

- una oportunidad activa no debe quedarse sin próxima actividad
- actividades vencidas deben verse en dashboard
- una actividad realizada puede disparar una nueva
- el historial no debe poder borrarse, solo anularse según permisos

---

# 11. Submódulo: Cotizaciones comerciales

## 11.1. Objetivo

Emitir propuestas comerciales formales asociadas a una oportunidad o cliente.

## 11.2. Tipos de cotización

- cotización de vehículo
- cotización de repuestos
- cotización de servicio/taller
- cotización de convenio o paquete corporativo

## 11.3. Funcionalidades

- crear cotización desde oportunidad
- agregar productos y servicios
- aplicar listas de precio
- aplicar descuentos según permiso
- calcular impuestos
- definir vigencia
- generar PDF/documento
- enviar por email o WhatsApp
- controlar versiones
- convertir a venta/pedido/cita/OT según tipo

## 11.4. Datos mínimos

- cliente
- oportunidad relacionada
- tipo de cotización
- fecha
- vigencia
- ítems
- cantidades
- precios
- descuentos
- impuestos
- subtotal
- total
- condiciones comerciales
- observaciones
- estado

## 11.5. Estados

- borrador
- emitida
- enviada
- vista
- en negociación
- aprobada
- rechazada
- vencida
- convertida

## 11.6. Reglas de negocio

- descuentos por encima de cierto límite requieren aprobación
- la cotización aprobada debe congelar condiciones clave
- debe mantenerse historial de versiones
- cotizaciones vencidas pueden renovarse con nueva versión
- una cotización convertida no debe eliminarse

---

# 12. Submódulo: Vista 360 del cliente

## 12.1. Objetivo

Disponer de una vista integral y consolidada del cliente y su relación con la empresa.

## 12.2. Información visible

- datos generales
- clasificación y segmento
- asesor responsable
- historial de leads
- oportunidades activas y cerradas
- cotizaciones
- ventas realizadas
- vehículos asociados
- historial de taller
- compras de repuestos
- casos/reclamos
- actividades e interacciones
- campañas recibidas
- saldos o condiciones comerciales
- indicadores de valor y recurrencia

## 12.3. Funcionalidades

- consulta consolidada
- filtros por línea de negocio
- timeline cronológico
- acceso rápido a acciones:
  - crear actividad
  - crear oportunidad
  - generar cotización
  - abrir caso
  - programar cita
- visualización de alertas:
  - cliente inactivo
  - garantía vigente
  - servicio pendiente
  - oportunidad abierta

## 12.4. Reglas

- la vista 360 debe consumir información de todos los módulos integrados
- no debe duplicar entidades, solo consolidarlas
- acceso restringido según permisos y sucursal

---

# 13. Submódulo: Campañas y marketing

## 13.1. Objetivo

Planificar, ejecutar y medir acciones comerciales y promocionales sobre segmentos de clientes o prospectos.

## 13.2. Tipos de campaña

- promoción de vehículos
- mantenimiento preventivo
- accesorios
- repuestos
- baterías
- llantas
- cambio de aceite
- recuperación de clientes inactivos
- renovación de vehículo
- cumpleaños
- campañas de garantía o revisión preventiva

## 13.3. Funcionalidades

- crear campañas
- definir objetivo
- definir canal
- segmentar audiencia
- asociar plantilla de mensaje
- programar envío
- registrar resultados
- generar leads u oportunidades derivadas
- medir conversión

## 13.4. Canales

- email
- WhatsApp
- SMS
- llamada
- acción interna/manual

## 13.5. Segmentación posible

- por marca/modelo de vehículo
- por fecha de última visita
- por kilometraje
- por último servicio
- por tipo de cliente
- por ciudad o sucursal
- por campaña anterior
- por estado de oportunidad
- por clientes inactivos

## 13.6. Datos mínimos

- nombre campaña
- tipo
- objetivo
- canal
- segmento
- fecha inicio
- fecha fin
- presupuesto
- responsable
- estado

## 13.7. Métricas

- total destinatarios
- enviados
- entregados
- abiertos
- respondidos
- clics
- conversiones
- leads generados
- citas agendadas
- ventas asociadas

---

# 14. Submódulo: Casos / Reclamos / PQRS

## 14.1. Objetivo

Registrar y gestionar solicitudes, reclamos, garantías, consultas o incidentes reportados por clientes.

## 14.2. Tipos de caso

- reclamo de venta
- reclamo de taller
- reclamo de repuesto
- solicitud de garantía
- consulta general
- sugerencia
- incidente
- queja por atención

## 14.3. Funcionalidades

- apertura de caso
- asignación de responsable
- clasificación por tipo y prioridad
- relación con cliente, vehículo, factura, OT o venta
- seguimiento interno
- escalamiento
- registro de resolución
- control de tiempos de atención
- cierre con motivo

## 14.4. Datos mínimos

- número de caso
- cliente/contacto
- vehículo si aplica
- documento de referencia
- tipo
- prioridad
- descripción
- responsable
- fecha de apertura
- fecha compromiso
- estado
- resolución
- causa raíz

## 14.5. Estados

- abierto
- en análisis
- en proceso
- esperando cliente
- escalado
- resuelto
- cerrado
- rechazado

## 14.6. Reglas de negocio

- todo caso debe tener responsable
- debe definirse SLA según prioridad
- los casos vencidos deben generar alerta
- un caso de garantía debe permitir trazabilidad al documento origen
- un caso cerrado no debe editarse sin autorización

---

# 15. Submódulo: Postventa y fidelización

## 15.1. Objetivo

Asegurar continuidad de relación con el cliente después de una venta o servicio.

## 15.2. Procesos cubiertos

- seguimiento posterior a venta de vehículo
- seguimiento posterior a compra de repuestos
- seguimiento posterior a servicio de taller
- recordatorio de mantenimiento
- campañas de reactivación
- programas de fidelidad
- encuestas de satisfacción

## 15.3. Funcionalidades

- programar contactos postventa automáticos o manuales
- generar campañas por fecha o kilometraje
- detectar clientes inactivos
- sugerir recompra
- registrar satisfacción
- clasificar clientes por valor/recurrencia
- identificar riesgo de abandono

## 15.4. Casos de uso

### Venta de vehículo

- bienvenida
- activación de primer servicio
- contacto a los 7 días
- encuesta
- recordatorio de primer mantenimiento

### Repuestos

- seguimiento de uso o instalación
- venta complementaria
- recompra periódica

### Taller

- encuesta de satisfacción
- recordatorio de próxima visita
- seguimiento de recomendaciones no aprobadas
- recuperación de cliente inactivo

---

# 16. Submódulo: Dashboards e indicadores

## 16.1. Objetivo

Ofrecer visibilidad ejecutiva y operativa del desempeño del CRM.

## 16.2. Dashboards sugeridos

- dashboard general CRM
- dashboard por asesor
- dashboard por sucursal
- dashboard por línea de negocio
- dashboard de campañas
- dashboard de fidelización
- dashboard de casos/reclamos

## 16.3. KPIs principales

### Leads

- leads creados
- leads por fuente
- leads por campaña
- tiempo de primera gestión
- tasa de calificación

### Oportunidades

- número de oportunidades abiertas
- valor del pipeline
- oportunidades por etapa
- tasa de conversión
- tiempo promedio de cierre
- oportunidades perdidas por motivo

### Actividades

- actividades programadas
- realizadas
- vencidas
- productividad por asesor

### Cotizaciones

- emitidas
- aprobadas
- rechazadas
- tasa de conversión
- tiempo promedio de aceptación

### Casos

- abiertos
- resueltos
- tiempo medio de respuesta
- tiempo medio de cierre
- casos por tipo

### Fidelización

- clientes activos/inactivos
- retorno al taller
- recompra de repuestos
- frecuencia de atención
- valor de cliente

---

# 17. Submódulo: Configuración y parametrización

## 17.1. Objetivo

Permitir adaptar el CRM a las reglas de la empresa sin desarrollo adicional.

## 17.2. Catálogos configurables

- fuentes de lead
- tipos de lead
- etapas de pipeline
- motivos de pérdida
- tipos de actividad
- resultados de actividad
- tipos de caso
- prioridades
- segmentos
- etiquetas
- líneas de negocio
- sucursales
- territorios
- canales de campaña
- plantillas de comunicación

## 17.3. Reglas configurables

- tiempos máximos de primera atención
- reglas de asignación automática
- SLA de casos
- límites de descuentos
- condiciones para alertas
- frecuencia de recordatorios

---

# 18. Automatizaciones

## 18.1. Objetivo

Reducir tareas manuales y mejorar control y seguimiento.

## 18.2. Automatizaciones mínimas recomendadas

- asignación automática de leads
- generación automática de actividad inicial
- alerta por lead sin contacto
- alerta por oportunidad sin seguimiento
- recordatorio de actividad próxima
- alerta de caso vencido
- recordatorio de mantenimiento
- encuesta automática postventa
- campaña a clientes inactivos
- recordatorio de cumpleaños
- notificación de cotización vencida

## 18.3. Eventos que pueden disparar automatizaciones

- creación de lead
- cambio de etapa
- oportunidad ganada
- cotización emitida
- caso abierto
- venta cerrada
- OT cerrada
- cliente inactivo detectado

---

# 19. Integraciones funcionales

## 19.1. Integración con ventas de vehículos

- convertir oportunidad ganada en proceso de venta
- asociar vehículo vendido al cliente
- activar procesos de postventa

## 19.2. Integración con repuestos

- convertir oportunidad o cotización en pedido/factura
- registrar compras de repuestos en vista 360

## 19.3. Integración con taller

- generar cita desde oportunidad
- ver historial de taller
- registrar seguimiento post servicio
- generar campañas de mantenimiento

## 19.4. Integración con facturación/caja

- consultar documentos emitidos
- visualizar deudas o saldos

## 19.5. Integración con comunicaciones

- email
- WhatsApp
- SMS
- plantillas y notificaciones

---

# 20. Roles involucrados

## Roles principales

- asesor comercial de vehículos
- asesor de repuestos
- asesor de servicio
- supervisor comercial
- jefe de postventa
- gerente comercial
- call center
- marketing
- atención al cliente
- administrador del sistema

## Ejemplos de permisos

- crear lead
- reasignar lead
- editar contacto
- convertir oportunidad
- aprobar descuentos
- cerrar oportunidad como perdida
- ver dashboards globales
- abrir y cerrar casos
- lanzar campañas
- ver información financiera del cliente

---

# 21. Requerimientos no funcionales

## 21.1. Usabilidad

- interfaz clara y rápida
- navegación por roles
- acceso desde web y dispositivos móviles
- búsqueda rápida por nombre, documento, placa, teléfono o email

## 21.2. Seguridad

- control de acceso por rol y sucursal
- auditoría de cambios
- historial de estados
- trazabilidad de interacciones
- protección de datos personales

## 21.3. Rendimiento

- búsquedas rápidas
- paneles actualizados en tiempo razonable
- soporte para crecimiento de registros históricos

## 21.4. Escalabilidad

- preparado para múltiples sucursales
- preparado para nuevas líneas de negocio
- integrable con ERP y BI

---

# 22. Reglas generales de negocio

1. Todo lead debe tener responsable.
2. Toda oportunidad activa debe tener próxima actividad.
3. Todo cierre perdido debe tener motivo.
4. No se deben duplicar clientes por documento o identificador principal.
5. Toda interacción relevante debe quedar registrada.
6. Toda campaña debe poder medirse.
7. Todo caso debe tener SLA según prioridad.
8. La información del cliente debe poder consultarse de forma consolidada.
9. Todo cambio importante de etapa, estado o responsable debe quedar auditado.
10. El CRM debe ser la fuente principal de relación comercial y postventa.

---

# 23. Flujo funcional resumido

## Flujo 1: Lead comercial

1. Se registra lead
2. Se asigna asesor
3. Se programa primer contacto
4. Se gestiona y califica
5. Se convierte en oportunidad
6. Se cotiza
7. Se negocia
8. Se gana o se pierde
9. Si se gana, se integra con venta/taller/repuestos
10. Se activa postventa

## Flujo 2: Cliente postventa

1. Cliente existente entra a CRM
2. Se detecta próxima necesidad
3. Se genera campaña o actividad
4. Se agenda cita o se emite cotización
5. Se concreta servicio o venta
6. Se realiza seguimiento
7. Se mide satisfacción
8. Se programa próxima acción

## Flujo 3: Reclamo/caso

1. Cliente reporta caso
2. Se registra y clasifica
3. Se asigna responsable
4. Se gestiona internamente
5. Se escala si es necesario
6. Se resuelve
7. Se cierra con trazabilidad

---

# 24. Fases sugeridas de implementación

## Fase 1: Núcleo CRM

- contactos
- cuentas
- leads
- oportunidades
- actividades
- dashboard básico

## Fase 2: Comercial robusto

- cotizaciones
- pipeline por línea de negocio
- reglas de asignación
- automatizaciones de seguimiento
- reportes por asesor

## Fase 3: Servicio y fidelización

- casos/reclamos
- campañas
- segmentación
- postventa
- encuestas
- clientes inactivos

## Fase 4: Integración total

- taller
- ventas de vehículos
- repuestos
- facturación
- BI / indicadores avanzados

---

# 25. Resultado esperado del módulo

Al finalizar, la empresa debe poder:

- saber quién es cada cliente y qué relación tiene con el negocio
- controlar todos los prospectos sin perder oportunidades
- dar seguimiento ordenado y medible
- vender más y con mejor trazabilidad
- retener clientes con campañas y postventa
- reducir reclamos no atendidos
- preparar la base para el módulo de taller y ERP completo

Perfecto. Ahora te entrego **lo mismo para el CRM**, en los mismos 4 bloques:

1. **Modelo de base de datos del CRM**
2. **Flujo de pantallas y menú del CRM**
3. **Documento técnico más detallado**
4. **Integración CRM + Taller**

Lo voy a dejar enfocado a una empresa automotriz que vende:

- vehículos
- repuestos
- servicios de taller

y que necesita un **CRM robusto, no genérico**.

---

# 1. MODELO DE BASE DE DATOS DEL CRM

Voy a plantearlo como un **modelo relacional funcional**, preparado para crecer e integrarse con taller, ventas, repuestos y facturación.

---

## 1.1. Entidades principales

---

## A. Maestros y catálogos

### tabla: `crm_linea_negocio`

- id
- codigo
- nombre
  - vehiculos
  - repuestos
  - taller
  - postventa
  - flotillas
- descripcion
- activo

### tabla: `crm_fuente_lead`

- id
- codigo
- nombre
  - web
  - whatsapp
  - llamada
  - showroom
  - facebook
  - instagram
  - referido
  - campaña
  - feria
- activo

### tabla: `crm_tipo_lead`

- id
- codigo
- nombre
- linea_negocio_id
- activo

### tabla: `crm_etapa_pipeline`

- id
- codigo
- nombre
- linea_negocio_id
- orden
- probabilidad_default
- es_cierre_ganado
- es_cierre_perdido
- activo

### tabla: `crm_motivo_perdida`

- id
- codigo
- nombre
- descripcion
- linea_negocio_id nullable
- activo

### tabla: `crm_tipo_actividad`

- id
- codigo
- nombre
  - llamada
  - whatsapp
  - email
  - visita
  - reunion
  - prueba_manejo
  - seguimiento
  - tarea
  - cita
  - encuesta
- activo

### tabla: `crm_resultado_actividad`

- id
- codigo
- nombre
- tipo_actividad_id nullable
- activo

### tabla: `crm_tipo_caso`

- id
- codigo
- nombre
  - reclamo
  - garantia
  - consulta
  - sugerencia
  - incidente
  - pqrs
- activo

### tabla: `crm_prioridad_caso`

- id
- codigo
- nombre
  - baja
  - media
  - alta
  - critica
- nivel
- activo

### tabla: `crm_estado_caso`

- id
- codigo
- nombre
- orden
- es_final
- activo

### tabla: `crm_tipo_campania`

- id
- codigo
- nombre
- activo

### tabla: `crm_canal_campania`

- id
- codigo
- nombre
  - email
  - whatsapp
  - sms
  - llamada
  - mixta
- activo

### tabla: `crm_segmento`

- id
- codigo
- nombre
- descripcion
- activo

### tabla: `crm_etiqueta`

- id
- codigo
- nombre
- color
- activo

### tabla: `sucursal`

- id
- codigo
- nombre
- direccion
- telefono
- activo

### tabla: `empleado`

- id
- persona_id
- sucursal_id
- codigo
- tipo_empleado
  - vendedor
  - asesor_servicio
  - call_center
  - marketing
  - supervisor
  - gerente
- activo

---

## B. Clientes, contactos y cuentas

Esto debe ser base maestra compartida con otros módulos.

### tabla: `cliente`

- id
- tipo_cliente
  - persona
  - empresa
- codigo
- estado
  - prospecto
  - activo
  - inactivo
  - bloqueado
- fecha_alta
- origen_principal_id nullable
- asesor_responsable_id nullable
- sucursal_id nullable
- observaciones
- activo

### tabla: `cliente_persona`

- id
- cliente_id
- nombres
- apellidos
- tipo_documento
- numero_documento
- fecha_nacimiento
- genero
- telefono
- whatsapp
- email
- direccion
- ciudad
- pais
- canal_preferido
- profesion nullable

### tabla: `cliente_empresa`

- id
- cliente_id
- razon_social
- nombre_comercial
- tipo_documento
- numero_documento
- industria
- telefono
- email
- direccion
- ciudad
- pais
- tamano_empresa
- numero_unidades_flota nullable

### tabla: `cliente_contacto`

- id
- cliente_empresa_id
- nombres
- apellidos
- cargo
- telefono
- whatsapp
- email
- es_principal
- activo

### tabla: `cliente_etiqueta`

- id
- cliente_id
- etiqueta_id

### tabla: `cliente_segmento`

- id
- cliente_id
- segmento_id

### tabla: `cliente_preferencia`

- id
- cliente_id
- acepta_email
- acepta_whatsapp
- acepta_sms
- acepta_llamadas
- acepta_promociones
- fecha_actualizacion

---

## C. Vehículos asociados al cliente

Compartido con ventas y taller, pero visible desde CRM.

### tabla: `vehiculo`

- id
- cliente_id
- placa
- vin
- marca_id
- modelo_id
- version
- anio
- color
- motor
- transmision
- combustible
- kilometraje_actual
- fecha_compra nullable
- estado
- activo

### tabla: `vehiculo_relacion_contacto`

- id
- vehiculo_id
- cliente_contacto_id nullable
- cliente_id nullable
- tipo_relacion
  - propietario
  - conductor
  - encargado
  - autorizado

---

## D. Leads

### tabla: `crm_lead`

- id
- numero
- cliente_id nullable
- contacto_temporal_nombre
- contacto_temporal_telefono
- contacto_temporal_email
- linea_negocio_id
- tipo_lead_id
- fuente_id
- campania_id nullable
- sucursal_id nullable
- asesor_id nullable
- producto_interes
- necesidad
- presupuesto_estimado
- urgencia
- score
- estado
  - nuevo
  - asignado
  - contactado
  - seguimiento
  - calificado
  - no_calificado
  - convertido
  - perdido
- fecha_ingreso
- fecha_ultimo_contacto nullable
- fecha_conversion nullable
- motivo_perdida_id nullable
- observaciones

### tabla: `crm_lead_historial`

- id
- lead_id
- estado_anterior
- estado_nuevo
- comentario
- usuario_id
- fecha

### tabla: `crm_lead_producto_interes`

- id
- lead_id
- tipo_item
  - vehiculo
  - repuesto
  - servicio
- referencia_id nullable
- descripcion

---

## E. Oportunidades

### tabla: `crm_oportunidad`

- id
- numero
- lead_id nullable
- cliente_id
- linea_negocio_id
- sucursal_id
- asesor_id
- nombre
- descripcion
- etapa_id
- probabilidad
- monto_estimado
- fecha_estimada_cierre
- fecha_cierre_real nullable
- competidor nullable
- estado
  - abierta
  - ganada
  - perdida
  - pausada
  - cancelada
- motivo_perdida_id nullable
- observaciones
- creada_en
- creada_por

### tabla: `crm_oportunidad_historial_etapa`

- id
- oportunidad_id
- etapa_anterior_id
- etapa_nueva_id
- probabilidad_anterior
- probabilidad_nueva
- comentario
- usuario_id
- fecha

### tabla: `crm_oportunidad_item`

- id
- oportunidad_id
- tipo_item
  - vehiculo
  - repuesto
  - servicio
  - paquete
- referencia_id nullable
- descripcion
- cantidad
- precio_estimado
- subtotal_estimado

---

## F. Actividades e interacciones

### tabla: `crm_actividad`

- id
- tipo_actividad_id
- cliente_id nullable
- lead_id nullable
- oportunidad_id nullable
- vehiculo_id nullable
- caso_id nullable
- asunto
- descripcion
- responsable_id
- fecha_programada
- fecha_realizada nullable
- estado
  - pendiente
  - realizada
  - vencida
  - cancelada
  - reprogramada
- resultado_id nullable
- proxima_accion
- fecha_proxima_accion nullable
- creado_por
- creado_en

### tabla: `crm_interaccion`

- id
- cliente_id nullable
- lead_id nullable
- oportunidad_id nullable
- actividad_id nullable
- canal
  - llamada
  - whatsapp
  - email
  - visita
  - presencial
  - formulario_web
- direccion
  - entrante
  - saliente
- fecha
- resumen
- detalle
- usuario_id
- adjunto_url nullable

---

## G. Cotizaciones CRM

### tabla: `crm_cotizacion`

- id
- numero
- oportunidad_id
- cliente_id
- linea_negocio_id
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
  - vista
  - negociacion
  - aprobada
  - rechazada
  - vencida
  - convertida
- observaciones
- emitida_por
- creada_en

### tabla: `crm_cotizacion_detalle`

- id
- cotizacion_id
- tipo_item
- referencia_id nullable
- descripcion
- cantidad
- precio_unitario
- descuento
- impuesto
- subtotal
- total
- orden

### tabla: `crm_cotizacion_historial`

- id
- cotizacion_id
- estado_anterior
- estado_nuevo
- comentario
- usuario_id
- fecha

---

## H. Casos / reclamos / PQRS

### tabla: `crm_caso`

- id
- numero
- cliente_id
- contacto_id nullable
- vehiculo_id nullable
- oportunidad_id nullable
- tipo_caso_id
- prioridad_id
- estado_id
- origen
  - llamada
  - whatsapp
  - email
  - web
  - presencial
  - postventa
- documento_referencia_tipo nullable
- documento_referencia_id nullable
- asunto
- descripcion
- responsable_id
- fecha_apertura
- fecha_compromiso nullable
- fecha_cierre nullable
- resolucion nullable
- causa_raiz nullable
- satisfaccion_cliente nullable

### tabla: `crm_caso_historial`

- id
- caso_id
- estado_anterior_id
- estado_nuevo_id
- comentario
- usuario_id
- fecha

### tabla: `crm_caso_seguimiento`

- id
- caso_id
- fecha
- comentario
- usuario_id
- es_interno

---

## I. Campañas y marketing

### tabla: `crm_campania`

- id
- codigo
- nombre
- tipo_campania_id
- canal_id
- linea_negocio_id nullable
- sucursal_id nullable
- objetivo
- descripcion
- fecha_inicio
- fecha_fin
- presupuesto
- estado
  - borrador
  - programada
  - activa
  - pausada
  - finalizada
  - cancelada
- responsable_id
- creada_en

### tabla: `crm_campania_segmento`

- id
- campania_id
- segmento_id

### tabla: `crm_campania_destinatario`

- id
- campania_id
- cliente_id
- vehiculo_id nullable
- estado_envio
  - pendiente
  - enviado
  - entregado
  - leido
  - respondido
  - fallido
- fecha_envio nullable
- fecha_respuesta nullable
- observacion

### tabla: `crm_campania_resultado`

- id
- campania_id
- cliente_id
- lead_id nullable
- oportunidad_id nullable
- tipo_resultado
  - lead_generado
  - cita_generada
  - venta_generada
  - sin_respuesta
  - rechazo
- monto_generado nullable
- fecha

---

## J. Postventa y fidelización

### tabla: `crm_fidelizacion_evento`

- id
- cliente_id
- vehiculo_id nullable
- tipo_evento
  - bienvenida
  - cumpleanos
  - recordatorio_mantenimiento
  - cliente_inactivo
  - post_servicio
  - renovacion
  - recomendacion_pendiente
- fecha_evento
- estado
  - pendiente
  - ejecutado
  - cancelado
- referencia_tipo nullable
- referencia_id nullable
- observacion

### tabla: `crm_encuesta`

- id
- cliente_id
- vehiculo_id nullable
- referencia_tipo
  - venta
  - taller
  - repuesto
  - caso
- referencia_id
- fecha_envio
- fecha_respuesta nullable
- puntaje
- comentario
- estado

---

## K. Auditoría y adjuntos

### tabla: `crm_documento_adjunto`

- id
- entidad_tipo
- entidad_id
- nombre
- url
- tipo_archivo
- descripcion
- subido_por
- fecha

### tabla: `crm_auditoria`

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

- `cliente 1:1 cliente_persona` o `cliente 1:1 cliente_empresa`
- `cliente_empresa 1:N cliente_contacto`
- `cliente 1:N vehiculo`
- `crm_lead N:1 cliente` opcional
- `crm_lead 1:N crm_lead_historial`
- `crm_lead 1:1..N crm_oportunidad`
- `crm_oportunidad 1:N crm_actividad`
- `crm_oportunidad 1:N crm_cotizacion`
- `crm_cotizacion 1:N crm_cotizacion_detalle`
- `cliente 1:N crm_caso`
- `crm_campania N:M cliente` por `crm_campania_destinatario`
- `cliente 1:N crm_fidelizacion_evento`
- `cliente 1:N crm_interaccion`

---

## 1.3. Recomendaciones de modelado para CRM

- cliente debe ser entidad maestra compartida
- contacto empresa debe manejarse separado del cliente empresa
- oportunidades deben soportar varios pipelines por línea de negocio
- actividades e interacciones deben quedar separadas:
  - actividad = acción planificada/ejecutada
  - interacción = comunicación real registrada
- motivos de pérdida y etapas deben ser parametrizables
- campañas deben permitir trazabilidad a leads y oportunidades
- auditar:
  - cambio de responsable
  - cambio de etapa
  - cierre perdido
  - descuentos en cotizaciones
  - cambios en casos

---

# 2. FLUJO DE PANTALLAS Y MENÚ DEL CRM

Te propongo una navegación robusta y orientada al negocio.

---

## 2.1. Menú principal del CRM

### CRM

- Dashboard General
- Leads
- Oportunidades
- Contactos / Clientes
- Empresas / Cuentas
- Vehículos Asociados
- Actividades
- Interacciones
- Cotizaciones
- Casos / Reclamos
- Campañas
- Fidelización / Postventa
- Reportes
- Configuración

---

## 2.2. Flujo de pantallas

---

### A. Dashboard General

#### Objetivo

Mostrar el estado comercial y de relación con clientes en tiempo real.

#### Widgets sugeridos

- leads nuevos del día
- leads pendientes de gestión
- oportunidades abiertas
- valor del pipeline
- actividades vencidas
- cotizaciones por vencer
- casos abiertos
- clientes inactivos
- campañas activas
- conversión por línea de negocio

#### Acciones rápidas

- nuevo lead
- nueva oportunidad
- nueva actividad
- nueva cotización
- nuevo caso
- nueva campaña

---

### B. Pantalla de Leads

#### Vista listado

- número lead
- nombre/contacto
- teléfono
- línea de negocio
- fuente
- asesor
- estado
- score
- fecha ingreso

#### Filtros

- fecha
- estado
- asesor
- fuente
- sucursal
- línea de negocio
- campaña

#### Acciones

- crear lead
- editar
- asignar
- registrar gestión
- convertir en oportunidad
- marcar perdido
- ver historial

#### Formulario de lead

Secciones:

1. Datos del contacto
2. Línea de negocio
3. Interés/necesidad
4. Fuente/campaña
5. Asignación
6. Score y prioridad
7. Observaciones

---

### C. Pantalla de Oportunidades

#### Vista pipeline

- columnas por etapa
- tarjetas con:
  - cliente
  - monto estimado
  - asesor
  - fecha estimada
  - probabilidad

#### Vista listado

- número
- oportunidad
- cliente
- línea de negocio
- etapa
- monto estimado
- fecha cierre
- asesor
- estado

#### Acciones

- crear
- mover etapa
- editar
- registrar actividad
- crear cotización
- marcar ganada
- marcar perdida

#### Pantalla detalle oportunidad

Pestañas:

- resumen
- actividades
- cotizaciones
- interacciones
- productos/servicios de interés
- historial de etapa
- adjuntos

---

### D. Pantalla de Contactos / Clientes

#### Vista listado

- código
- nombre / razón social
- documento
- teléfono
- email
- tipo
- asesor
- estado

#### Acciones

- nuevo cliente
- editar
- asociar etiqueta
- asociar segmento
- ver vista 360

#### Pantalla ficha cliente 360

Pestañas:

- datos generales
- contactos
- vehículos
- leads
- oportunidades
- cotizaciones
- compras / historial comercial
- taller
- reclamos/casos
- campañas
- fidelización
- interacciones
- documentos

---

### E. Pantalla de Empresas / Cuentas

Para clientes corporativos o cuentas con varios contactos.

#### Acciones

- crear empresa
- agregar contactos
- asociar vehículos
- ver oportunidades corporativas
- ver convenios

---

### F. Pantalla de Vehículos Asociados

#### Vista listado

- placa
- VIN
- cliente
- marca/modelo
- año
- kilometraje
- estado

#### Acciones

- registrar vehículo
- editar
- asociar a cliente/contacto
- ver historial comercial y técnico
- programar seguimiento

---

### G. Pantalla de Actividades

#### Vista agenda/calendario

- actividades del día
- actividades vencidas
- próximas actividades

#### Vista listado

- tipo
- cliente/lead/oportunidad
- responsable
- fecha programada
- estado
- resultado

#### Acciones

- crear actividad
- reprogramar
- marcar realizada
- cancelar
- crear próxima actividad

---

### H. Pantalla de Interacciones

#### Vista timeline

- llamadas
- WhatsApp
- emails
- visitas
- formularios

#### Filtros

- cliente
- usuario
- canal
- fecha
- línea de negocio

---

### I. Pantalla de Cotizaciones

#### Vista listado

- número
- cliente
- oportunidad
- línea
- fecha
- vigencia
- total
- estado

#### Acciones

- nueva cotización
- editar
- enviar
- duplicar
- cambiar estado
- convertir

#### Pantalla detalle cotización

Pestañas:

- encabezado
- ítems
- impuestos/descuentos
- historial
- adjuntos

---

### J. Pantalla de Casos / Reclamos

#### Vista listado

- número caso
- cliente
- tipo
- prioridad
- responsable
- estado
- fecha apertura
- fecha compromiso

#### Acciones

- crear caso
- asignar
- escalar
- cerrar
- ver seguimiento

#### Pantalla detalle caso

Pestañas:

- resumen
- seguimiento
- documentos
- referencias
- historial

---

### K. Pantalla de Campañas

#### Vista listado

- nombre campaña
- tipo
- canal
- objetivo
- fecha inicio/fin
- responsable
- estado

#### Acciones

- crear
- segmentar
- programar
- ejecutar
- ver resultados

#### Pantalla detalle campaña

Pestañas:

- datos generales
- segmento
- destinatarios
- resultados
- leads generados
- oportunidades generadas

---

### L. Pantalla de Fidelización / Postventa

#### Vistas recomendadas

- clientes inactivos
- mantenimientos pendientes
- cumpleaños
- renovaciones sugeridas
- recomendaciones de taller sin aprobar
- encuestas pendientes

#### Acciones

- crear campaña
- crear actividad
- programar cita
- abrir oportunidad postventa

---

### M. Reportes

- leads por fuente
- conversión por asesor
- pipeline por línea de negocio
- actividades vencidas
- cotizaciones aprobadas
- motivos de pérdida
- campañas convertidas
- clientes inactivos
- reclamos por tipo
- valor total del cliente

---

### N. Configuración

- líneas de negocio
- fuentes de leads
- tipos de leads
- etapas de pipeline
- motivos de pérdida
- tipos de actividad
- resultados de actividad
- tipos de caso
- prioridades
- segmentos
- etiquetas
- tipos de campaña
- canales
- reglas automáticas

---

# 3. DOCUMENTO TÉCNICO MÁS DETALLADO DEL CRM

Ahora te lo bajo a:

- actores
- casos de uso
- validaciones
- estados
- reglas de transición
- historias de usuario

---

## 3.1. Actores

- asesor comercial
- asesor de servicio
- vendedor de repuestos
- call center
- supervisor comercial
- gerente comercial
- marketing
- atención al cliente
- administrador
- cliente (indirecto)

---

## 3.2. Casos de uso principales

---

### CU01. Registrar lead

**Actor:** asesor / call center / marketing  
**Descripción:** registrar un nuevo prospecto.  
**Precondición:** ninguna.  
**Postcondición:** lead creado y asignable.

**Validaciones**

- línea de negocio obligatoria
- fuente obligatoria
- teléfono o email recomendado/obligatorio según canal
- evitar duplicado si ya existe cliente/contacto

---

### CU02. Asignar lead

**Actor:** supervisor / sistema automático  
**Descripción:** asignar lead a un asesor.  
**Postcondición:** lead con responsable y actividad inicial.

**Validaciones**

- asesor activo
- sucursal válida si aplica

---

### CU03. Gestionar lead

**Actor:** asesor  
**Descripción:** registrar seguimiento, actualizar estado y calificar.  
**Postcondición:** lead actualizado.

**Validaciones**

- motivo obligatorio si se marca no calificado o perdido
- fecha de seguimiento coherente
- historial obligatorio

---

### CU04. Convertir lead en oportunidad

**Actor:** asesor  
**Descripción:** pasar un lead calificado a oportunidad comercial.  
**Precondición:** lead existente.  
**Postcondición:** oportunidad creada.

**Validaciones**

- cliente/contacto asociado o creado
- línea de negocio heredada
- asesor responsable obligatorio

---

### CU05. Crear oportunidad

**Actor:** asesor  
**Descripción:** registrar una oportunidad manual o desde lead.  
**Postcondición:** oportunidad abierta en pipeline.

**Validaciones**

- cliente obligatorio
- etapa inicial obligatoria
- línea de negocio obligatoria
- monto estimado no negativo

---

### CU06. Mover oportunidad de etapa

**Actor:** asesor / supervisor  
**Descripción:** cambiar etapa del pipeline.  
**Postcondición:** historial de etapa actualizado.

**Validaciones**

- etapa válida para la línea de negocio
- motivo obligatorio si se pierde
- permisos especiales para revertir cierre

---

### CU07. Registrar actividad

**Actor:** asesor  
**Descripción:** programar seguimiento o registrar uno realizado.  
**Postcondición:** actividad visible en agenda.

**Validaciones**

- responsable obligatorio
- tipo actividad obligatorio
- al menos una entidad relacionada

---

### CU08. Emitir cotización

**Actor:** asesor  
**Descripción:** generar propuesta comercial.  
**Postcondición:** cotización emitida.

**Validaciones**

- oportunidad obligatoria
- al menos un detalle
- vigencia obligatoria
- total calculado

---

### CU09. Crear caso

**Actor:** atención al cliente / asesor / postventa  
**Descripción:** registrar reclamo, consulta o incidente.  
**Postcondición:** caso abierto con responsable.

**Validaciones**

- cliente obligatorio
- tipo y prioridad obligatorios
- descripción obligatoria

---

### CU10. Ejecutar campaña

**Actor:** marketing  
**Descripción:** lanzar campaña a segmentos de clientes.  
**Postcondición:** campaña activa y destinatarios trazables.

**Validaciones**

- segmento obligatorio
- canal obligatorio
- fecha de campaña válida

---

### CU11. Registrar resultado de campaña

**Actor:** sistema / marketing  
**Descripción:** registrar respuesta, lead u oportunidad generada.  
**Postcondición:** campaña medible.

---

### CU12. Registrar evento de fidelización

**Actor:** sistema / postventa  
**Descripción:** crear acciones por mantenimiento, inactividad o renovación.  
**Postcondición:** evento disponible para seguimiento.

---

## 3.3. Validaciones funcionales clave

- no duplicar cliente por documento principal
- no cerrar oportunidad como perdida sin motivo
- no dejar oportunidad activa sin próxima actividad visible
- no permitir etapas de otra línea de negocio
- no emitir cotización sin oportunidad o cliente válido
- no cerrar caso sin resolución
- no ejecutar campaña sin destinatarios
- no convertir lead si no existe relación clara con cliente/contacto
- clientes con restricción de contacto deben respetar preferencias

---

## 3.4. Estados y transiciones

---

### Lead

Estados:

- nuevo
- asignado
- contactado
- seguimiento
- calificado
- no_calificado
- convertido
- perdido

Transiciones ejemplo:

- nuevo → asignado
- asignado → contactado
- contactado → seguimiento
- seguimiento → calificado
- calificado → convertido
- seguimiento → perdido
- seguimiento → no_calificado

---

### Oportunidad

Estados:

- abierta
- pausada
- ganada
- perdida
- cancelada

Etapas:

- dependen del pipeline por línea de negocio

Reglas:

- ganada y perdida son cierres
- perdida requiere motivo
- ganada debe permitir conversión a venta/cita/pedido/OT

---

### Actividad

Estados:

- pendiente
- realizada
- vencida
- cancelada
- reprogramada

---

### Cotización

Estados:

- borrador
- emitida
- enviada
- vista
- negociacion
- aprobada
- rechazada
- vencida
- convertida

---

### Caso

Estados:

- abierto
- en_analisis
- en_proceso
- esperando_cliente
- escalado
- resuelto
- cerrado
- rechazado

---

### Campaña

Estados:

- borrador
- programada
- activa
- pausada
- finalizada
- cancelada

---

## 3.5. Historias de usuario resumidas

### HU01

Como asesor, quiero registrar leads por múltiples canales para no perder oportunidades.

### HU02

Como supervisor, quiero asignar leads automáticamente para reducir tiempos de respuesta.

### HU03

Como asesor, quiero mover oportunidades por pipeline para controlar mejor mis cierres.

### HU04

Como usuario comercial, quiero ver una ficha 360 del cliente para conocer su historial antes de contactarlo.

### HU05

Como asesor, quiero programar y registrar actividades para dar seguimiento ordenado.

### HU06

Como comercial, quiero emitir cotizaciones con versiones para negociar con el cliente.

### HU07

Como marketing, quiero lanzar campañas segmentadas y medir resultados.

### HU08

Como atención al cliente, quiero gestionar casos y reclamos con SLA para mejorar el servicio.

### HU09

Como postventa, quiero detectar clientes inactivos y generar seguimiento automático.

### HU10

Como gerente, quiero dashboards por línea de negocio para medir conversión y productividad.

---

# 4. INTEGRACIÓN CRM + TALLER

Aunque ya te di integración desde el lado de taller, aquí te la dejo **desde la perspectiva CRM**, para que quede simétrica y más clara.

---

## 4.1. Objetivo de la integración

Hacer que el CRM no termine en la venta o en el lead, sino que continúe la relación del cliente en postventa, servicio y fidelización.

El CRM debe ser la capa de relación, y Taller la capa operativa del servicio.

---

## 4.2. Entidades compartidas

Ambos módulos deben compartir como base única:

- cliente
- contacto
- empresa/cuenta
- vehículo
- sucursal
- empleado/asesor
- documentos relacionados
- casos/reclamos
- historial de interacción

---

## 4.3. Flujos integrados principales

---

### Flujo A. Cliente del CRM agenda cita en taller

1. El CRM detecta:
   - oportunidad de mantenimiento
   - recomendación pendiente
   - campaña respondida
   - reclamo técnico
2. Usuario crea cita.
3. La cita pasa al módulo taller.
4. Taller atiende y devuelve resultado.

**Beneficio:** el CRM genera tráfico real al taller.

---

### Flujo B. Servicio de taller alimenta la vista 360 del CRM

1. Se cierra recepción/OT.
2. El CRM recibe:
   - fecha de visita
   - trabajos realizados
   - monto
   - kilometraje
   - recomendaciones
   - satisfacción
3. En la ficha del cliente aparece la visita técnica.

**Beneficio:** el asesor comercial sabe todo lo que ha pasado con el cliente.

---

### Flujo C. Trabajo no aprobado se vuelve oportunidad CRM

1. Taller detecta reparación recomendada.
2. Cliente no aprueba hoy.
3. Sistema envía al CRM:
   - oportunidad postventa
   - actividad futura
   - evento de fidelización

**Beneficio:** ventas futuras no se pierden.

---

### Flujo D. Reclamo CRM crea caso técnico en taller

1. Cliente reclama desde CRM.
2. Atención al cliente abre caso.
3. Si el reclamo es técnico:
   - se genera cita
   - o inspección
   - o proceso de garantía
4. Taller resuelve y retroalimenta CRM.

**Beneficio:** el reclamo tiene trazabilidad total.

---

### Flujo E. CRM usa historial de taller para campañas inteligentes

Ejemplos:

- clientes que no cambian frenos hace 18 meses
- clientes con mantenimiento pendiente
- clientes con recomendación no atendida
- clientes que compraron vehículo y se acerca primer servicio

**Beneficio:** marketing y postventa son realmente inteligentes.

---

## 4.4. Información que CRM recibe desde Taller

- última visita al taller
- tipo de servicio realizado
- fecha de próxima visita sugerida
- kilometraje
- repuestos relevantes instalados
- recomendaciones pendientes
- OT abierta/cerrada
- garantía asociada
- encuesta de satisfacción
- retrasos o incidencias importantes

---

## 4.5. Información que CRM envía a Taller

- datos del cliente
- vehículo
- contacto principal
- etiqueta de cliente VIP/corporativo/flotilla
- observaciones comerciales relevantes
- cita agendada
- origen de la cita/campaña
- caso o reclamo relacionado
- prioridad o SLA

---

## 4.6. Casos de uso integrados

### Caso 1: recuperación de cliente inactivo

- CRM detecta inactividad
- crea actividad de contacto
- cliente acepta cita
- taller atiende
- CRM marca cliente recuperado

### Caso 2: recomendación técnica

- taller recomienda amortiguadores
- no aprueba
- CRM crea oportunidad postventa a 20 días
- asesor llama y logra cita

### Caso 3: reclamo postservicio

- CRM recibe mala encuesta
- abre caso
- si requiere retrabajo, taller genera atención
- CRM registra cierre y satisfacción final

### Caso 4: campaña por kilometraje

- CRM identifica vehículos cercanos al servicio
- envía campaña
- se generan leads/citas
- taller convierte y atiende
- CRM mide resultado campaña → facturación

---

## 4.7. Dashboard conjunto CRM + Taller

Recomendado tener un tablero cruzado con:

- clientes atendidos en taller provenientes de campaña
- tasa de retorno al taller
- oportunidades postservicio generadas
- recomendaciones convertidas en venta
- clientes inactivos recuperados
- satisfacción postservicio
- valor acumulado del cliente
- frecuencia de servicios por vehículo
- ingresos originados desde CRM

---

## 4.8. Reglas de integración

- cliente y vehículo deben existir una sola vez
- toda cita creada en CRM debe ser visible en Taller
- toda atención concluida en Taller debe reflejarse en CRM
- casos/reclamos deben tener referencia cruzada
- recomendaciones pendientes deben poder pasar a oportunidad CRM
- campañas CRM deben poder usar datos técnicos del historial de taller

---

# RECOMENDACIÓN FINAL PARA EL CRM

Si lo implementas por fases, yo haría esto:

## Fase 1

- clientes/contactos/cuentas
- leads
- oportunidades
- actividades
- dashboard básico

## Fase 2

- cotizaciones
- pipeline por línea de negocio
- interacciones
- vista 360 del cliente

## Fase 3

- campañas
- segmentación
- casos/reclamos
- fidelización

## Fase 4

- integración total con taller
- integración con ventas de vehículos
- integración con repuestos
- automatizaciones avanzadas
- BI y scoring

---
