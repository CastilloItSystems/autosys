// backend/prisma/seeds/workshop.seed.ts
// Seeds para todos los catálogos del módulo Workshop

import type { PrismaClient } from '../../src/generated/prisma/client.js'

// ---------------------------------------------------------------------------
// DATA
// ---------------------------------------------------------------------------

const SERVICE_TYPES = [
  { code: 'MAINT-PREVENTIVO', name: 'Mantenimiento Preventivo' },
  { code: 'FRENOS', name: 'Sistema de Frenos' },
  { code: 'SUSPENSION', name: 'Sistema de Suspensión' },
  { code: 'MOTOR', name: 'Diagnóstico de Motor' },
  { code: 'TRANSMISION', name: 'Transmisión' },
  { code: 'ELECTRICO', name: 'Sistema Eléctrico' },
  { code: 'AIRE-ACONDICIONADO', name: 'Aire Acondicionado' },
  { code: 'ALINEO-BALANCEO', name: 'Alineación y Balanceo' },
  { code: 'LLANTAS', name: 'Servicio de Llantas' },
]

const BAYS = [
  {
    code: 'BAY-01',
    name: 'Bahía General 1',
    description: 'Bahía de uso general',
  },
  {
    code: 'BAY-02',
    name: 'Bahía General 2',
    description: 'Bahía de uso general',
  },
  {
    code: 'BAY-03',
    name: 'Bahía Mecánica Pesada',
    description: 'Trabajos de motor y transmisión',
  },
  {
    code: 'BAY-04',
    name: 'Bahía Eléctrica',
    description: 'Diagnóstico eléctrico y electrónico',
  },
]

type OperationDifficulty = 'BASIC' | 'STANDARD' | 'ADVANCED' | 'SPECIALIST'

const OPERATIONS: {
  code: string
  name: string
  description: string
  serviceTypeCode: string
  difficulty: OperationDifficulty
  requiredSpecialtyCode: string
  standardMinutes: number
  minMinutes: number
  maxMinutes: number
  listPrice: number
  costPrice: number
  warrantyDays?: number
  warrantyKm?: number
  requiredEquipment?: string
  tags: string[]
}[] = [
  // ── MANTENIMIENTO PREVENTIVO ──────────────────────────────────────────────
  {
    code: 'OP-CAMBIO-ACEITE',
    name: 'Cambio de aceite y filtro de aceite',
    description:
      'Sustitución del aceite de motor y filtro de aceite. Incluye inspección visual de niveles de otros fluidos y revisión de posibles fugas.',
    serviceTypeCode: 'MAINT-PREVENTIVO',
    difficulty: 'BASIC',
    requiredSpecialtyCode: 'ESP-MECANICA',
    standardMinutes: 30,
    minMinutes: 20,
    maxMinutes: 45,
    listPrice: 25,
    costPrice: 8,
    warrantyDays: 90,
    warrantyKm: 5000,
    requiredEquipment:
      'Foso o elevador, llave de filtro, recipiente de aceite usado',
    tags: ['aceite', 'filtro', 'mantenimiento', 'preventivo', 'motor'],
  },
  {
    code: 'OP-CAMBIO-FILTRO-AIRE',
    name: 'Cambio de filtro de aire',
    description:
      'Sustitución del filtro de aire del motor para mantener la mezcla aire-combustible óptima.',
    serviceTypeCode: 'MAINT-PREVENTIVO',
    difficulty: 'BASIC',
    requiredSpecialtyCode: 'ESP-MECANICA',
    standardMinutes: 15,
    minMinutes: 10,
    maxMinutes: 20,
    listPrice: 15,
    costPrice: 4,
    warrantyDays: 180,
    warrantyKm: 15000,
    tags: ['filtro', 'aire', 'mantenimiento', 'preventivo'],
  },
  {
    code: 'OP-CAMBIO-BUJIAS',
    name: 'Cambio de bujías',
    description:
      'Sustitución de bujías del motor. Incluye inspección de cables y bobinas de encendido.',
    serviceTypeCode: 'MOTOR',
    difficulty: 'STANDARD',
    requiredSpecialtyCode: 'ESP-MECANICA',
    standardMinutes: 45,
    minMinutes: 30,
    maxMinutes: 90,
    listPrice: 35,
    costPrice: 12,
    warrantyDays: 180,
    warrantyKm: 20000,
    requiredEquipment: 'Llave de bujías, torquímetro',
    tags: ['bujías', 'encendido', 'motor', 'mantenimiento'],
  },
  {
    code: 'OP-CAMBIO-FILTRO-COMBUSTIBLE',
    name: 'Cambio de filtro de combustible',
    description:
      'Sustitución del filtro de combustible para asegurar el flujo correcto hacia el motor.',
    serviceTypeCode: 'MAINT-PREVENTIVO',
    difficulty: 'STANDARD',
    requiredSpecialtyCode: 'ESP-MECANICA',
    standardMinutes: 30,
    minMinutes: 20,
    maxMinutes: 45,
    listPrice: 20,
    costPrice: 6,
    warrantyDays: 180,
    warrantyKm: 20000,
    tags: ['filtro', 'combustible', 'mantenimiento'],
  },

  // ── FRENOS ────────────────────────────────────────────────────────────────
  {
    code: 'OP-REV-FRENOS',
    name: 'Revisión completa del sistema de frenos',
    description:
      'Inspección de pastillas, discos, tambores, líquido de frenos y latiguillos. Incluye prueba de funcionamiento.',
    serviceTypeCode: 'FRENOS',
    difficulty: 'STANDARD',
    requiredSpecialtyCode: 'ESP-MECANICA',
    standardMinutes: 45,
    minMinutes: 30,
    maxMinutes: 60,
    listPrice: 40,
    costPrice: 12,
    tags: ['frenos', 'revisión', 'seguridad', 'pastillas', 'discos'],
  },
  {
    code: 'OP-CAMBIO-PASTILLAS-DEL',
    name: 'Cambio de pastillas de freno delanteras',
    description:
      'Sustitución de pastillas de freno del eje delantero. Incluye limpieza de pinzas y revisión de discos.',
    serviceTypeCode: 'FRENOS',
    difficulty: 'STANDARD',
    requiredSpecialtyCode: 'ESP-MECANICA',
    standardMinutes: 60,
    minMinutes: 45,
    maxMinutes: 90,
    listPrice: 60,
    costPrice: 18,
    warrantyDays: 365,
    warrantyKm: 30000,
    requiredEquipment: 'Elevador, juego de llaves, regresador de pistón',
    tags: ['frenos', 'pastillas', 'delanteras', 'seguridad'],
  },
  {
    code: 'OP-CAMBIO-PASTILLAS-TRAS',
    name: 'Cambio de pastillas de freno traseras',
    description:
      'Sustitución de pastillas de freno del eje trasero. Incluye limpieza de pinzas y revisión de discos.',
    serviceTypeCode: 'FRENOS',
    difficulty: 'STANDARD',
    requiredSpecialtyCode: 'ESP-MECANICA',
    standardMinutes: 60,
    minMinutes: 45,
    maxMinutes: 90,
    listPrice: 60,
    costPrice: 18,
    warrantyDays: 365,
    warrantyKm: 30000,
    requiredEquipment: 'Elevador, juego de llaves, regresador de pistón',
    tags: ['frenos', 'pastillas', 'traseras', 'seguridad'],
  },
  {
    code: 'OP-CAMBIO-DISCOS-FRENO',
    name: 'Cambio de discos de freno (par)',
    description:
      'Sustitución de discos de freno de un eje (2 discos). Incluye cambio de pastillas y purga del circuito hidráulico.',
    serviceTypeCode: 'FRENOS',
    difficulty: 'STANDARD',
    requiredSpecialtyCode: 'ESP-MECANICA',
    standardMinutes: 90,
    minMinutes: 75,
    maxMinutes: 120,
    listPrice: 90,
    costPrice: 28,
    warrantyDays: 365,
    warrantyKm: 40000,
    requiredEquipment: 'Elevador, torquímetro, extractor',
    tags: ['frenos', 'discos', 'seguridad'],
  },
  {
    code: 'OP-PURGA-FRENOS',
    name: 'Purga y cambio de líquido de frenos',
    description:
      'Vaciado del líquido de frenos viejo y llenado con líquido nuevo. Elimina absorción de humedad y restaura la temperatura de ebullición.',
    serviceTypeCode: 'FRENOS',
    difficulty: 'STANDARD',
    requiredSpecialtyCode: 'ESP-MECANICA',
    standardMinutes: 30,
    minMinutes: 25,
    maxMinutes: 45,
    listPrice: 25,
    costPrice: 8,
    warrantyDays: 180,
    tags: ['frenos', 'líquido', 'purga', 'mantenimiento'],
  },

  // ── SUSPENSIÓN ────────────────────────────────────────────────────────────
  {
    code: 'OP-REV-SUSPENSION',
    name: 'Revisión del sistema de suspensión',
    description:
      'Inspección de amortiguadores, espirales, rótulas, bujes y barras estabilizadoras. Incluye prueba en ruta.',
    serviceTypeCode: 'SUSPENSION',
    difficulty: 'STANDARD',
    requiredSpecialtyCode: 'ESP-ALINEACION',
    standardMinutes: 60,
    minMinutes: 45,
    maxMinutes: 75,
    listPrice: 50,
    costPrice: 15,
    requiredEquipment: 'Elevador, fosa de inspección',
    tags: ['suspensión', 'revisión', 'amortiguadores', 'rótulas'],
  },
  {
    code: 'OP-CAMBIO-AMORTIGUADORES',
    name: 'Cambio de amortiguadores (par)',
    description:
      'Sustitución de amortiguadores de un eje (2 piezas). Incluye revisión de soportes y testigos de espirales.',
    serviceTypeCode: 'SUSPENSION',
    difficulty: 'ADVANCED',
    requiredSpecialtyCode: 'ESP-ALINEACION',
    standardMinutes: 120,
    minMinutes: 90,
    maxMinutes: 180,
    listPrice: 100,
    costPrice: 30,
    warrantyDays: 365,
    warrantyKm: 50000,
    requiredEquipment: 'Elevador, compresor de muelles, torquímetro',
    tags: ['suspensión', 'amortiguadores', 'muelles'],
  },
  {
    code: 'OP-CAMBIO-ROTULAS',
    name: 'Cambio de rótulas (par)',
    description:
      'Sustitución de rótulas de dirección de un eje. Incluye prueba de alineación y torque de montaje.',
    serviceTypeCode: 'SUSPENSION',
    difficulty: 'ADVANCED',
    requiredSpecialtyCode: 'ESP-ALINEACION',
    standardMinutes: 90,
    minMinutes: 75,
    maxMinutes: 120,
    listPrice: 80,
    costPrice: 25,
    warrantyDays: 365,
    warrantyKm: 40000,
    requiredEquipment: 'Elevador, extractor de rótulas, torquímetro',
    tags: ['suspensión', 'rótulas', 'dirección'],
  },

  // ── ALINEACIÓN Y BALANCEO ─────────────────────────────────────────────────
  {
    code: 'OP-ALINEACION',
    name: 'Alineación computarizada 4 ruedas',
    description:
      'Ajuste de los ángulos de convergencia, caída y avance de las 4 ruedas mediante equipo láser computarizado.',
    serviceTypeCode: 'ALINEO-BALANCEO',
    difficulty: 'STANDARD',
    requiredSpecialtyCode: 'ESP-ALINEACION',
    standardMinutes: 45,
    minMinutes: 35,
    maxMinutes: 60,
    listPrice: 40,
    costPrice: 10,
    warrantyDays: 90,
    warrantyKm: 10000,
    requiredEquipment: 'Alineadora computarizada 3D',
    tags: ['alineación', 'dirección', 'llantas', 'suspensión'],
  },
  {
    code: 'OP-BALANCEO',
    name: 'Balanceo de llantas (4 ruedas)',
    description:
      'Balanceo dinámico de las 4 ruedas para eliminar vibraciones. Incluye colocación de pesas de equilibrio.',
    serviceTypeCode: 'ALINEO-BALANCEO',
    difficulty: 'BASIC',
    requiredSpecialtyCode: 'ESP-ALINEACION',
    standardMinutes: 30,
    minMinutes: 20,
    maxMinutes: 45,
    listPrice: 25,
    costPrice: 6,
    warrantyDays: 90,
    warrantyKm: 5000,
    requiredEquipment: 'Balanceadora dinámica',
    tags: ['balanceo', 'llantas', 'vibraciones'],
  },
  {
    code: 'OP-ROTACION-LLANTAS',
    name: 'Rotación de llantas',
    description:
      'Cambio de posición de las llantas para uniformizar el desgaste y prolongar su vida útil.',
    serviceTypeCode: 'LLANTAS',
    difficulty: 'BASIC',
    requiredSpecialtyCode: 'ESP-ALINEACION',
    standardMinutes: 30,
    minMinutes: 20,
    maxMinutes: 40,
    listPrice: 15,
    costPrice: 4,
    requiredEquipment: 'Elevador, llave de impacto, torquímetro',
    tags: ['llantas', 'rotación', 'mantenimiento'],
  },

  // ── MOTOR ─────────────────────────────────────────────────────────────────
  {
    code: 'OP-DIAG-SCANNER',
    name: 'Diagnóstico con escáner OBD2',
    description:
      'Lectura de códigos de falla (DTC) mediante escáner OBD2. Incluye borrado de códigos y reporte de resultados.',
    serviceTypeCode: 'MOTOR',
    difficulty: 'STANDARD',
    requiredSpecialtyCode: 'ESP-ELECTRICA',
    standardMinutes: 60,
    minMinutes: 30,
    maxMinutes: 90,
    listPrice: 50,
    costPrice: 10,
    requiredEquipment: 'Escáner OBD2 multimarca',
    tags: ['diagnóstico', 'scanner', 'OBD2', 'fallas', 'motor'],
  },
  {
    code: 'OP-LIMPIEZA-INYECTORES',
    name: 'Limpieza de inyectores (ultrasonido)',
    description:
      'Limpieza profunda de inyectores mediante ultrasonido. Restaura el patrón de inyección y mejora el rendimiento del combustible.',
    serviceTypeCode: 'MOTOR',
    difficulty: 'ADVANCED',
    requiredSpecialtyCode: 'ESP-MECANICA',
    standardMinutes: 120,
    minMinutes: 90,
    maxMinutes: 180,
    listPrice: 110,
    costPrice: 35,
    warrantyDays: 90,
    warrantyKm: 10000,
    requiredEquipment: 'Banco de ultrasonido para inyectores',
    tags: ['inyectores', 'limpieza', 'motor', 'combustible'],
  },
  {
    code: 'OP-CAMBIO-CORREA-DISTRIBUCION',
    name: 'Cambio de correa de distribución',
    description:
      'Sustitución de la correa de distribución y tensores. Incluye revisión del sistema de distribución y ajuste de fase.',
    serviceTypeCode: 'MOTOR',
    difficulty: 'ADVANCED',
    requiredSpecialtyCode: 'ESP-MECANICA',
    standardMinutes: 180,
    minMinutes: 150,
    maxMinutes: 240,
    listPrice: 150,
    costPrice: 40,
    warrantyDays: 730,
    warrantyKm: 60000,
    requiredEquipment: 'Herramientas de bloqueo de distribución, torquímetro',
    tags: ['distribución', 'correa', 'motor', 'timing'],
  },

  // ── SISTEMA ELÉCTRICO ─────────────────────────────────────────────────────
  {
    code: 'OP-DIAG-ELECTRICO',
    name: 'Diagnóstico del sistema eléctrico',
    description:
      'Diagnóstico completo del sistema eléctrico: batería, alternador, motor de arranque, fusibles y cableado.',
    serviceTypeCode: 'ELECTRICO',
    difficulty: 'STANDARD',
    requiredSpecialtyCode: 'ESP-ELECTRICA',
    standardMinutes: 60,
    minMinutes: 45,
    maxMinutes: 120,
    listPrice: 50,
    costPrice: 12,
    requiredEquipment: 'Multímetro, analizador de batería/alternador',
    tags: ['eléctrico', 'diagnóstico', 'batería', 'alternador'],
  },
  {
    code: 'OP-CAMBIO-BATERIA',
    name: 'Cambio de batería',
    description:
      'Sustitución de la batería del vehículo. Incluye prueba del alternador y sistema de carga.',
    serviceTypeCode: 'ELECTRICO',
    difficulty: 'BASIC',
    requiredSpecialtyCode: 'ESP-ELECTRICA',
    standardMinutes: 30,
    minMinutes: 20,
    maxMinutes: 40,
    listPrice: 20,
    costPrice: 5,
    warrantyDays: 365,
    tags: ['batería', 'eléctrico', 'arranque'],
  },
  {
    code: 'OP-REP-ALTERNADOR',
    name: 'Reparación / cambio de alternador',
    description:
      'Diagnóstico, reparación o sustitución del alternador. Incluye prueba del sistema de carga completo.',
    serviceTypeCode: 'ELECTRICO',
    difficulty: 'ADVANCED',
    requiredSpecialtyCode: 'ESP-ELECTRICA',
    standardMinutes: 120,
    minMinutes: 90,
    maxMinutes: 180,
    listPrice: 100,
    costPrice: 30,
    warrantyDays: 365,
    requiredEquipment: 'Analizador de carga, elevador',
    tags: ['alternador', 'carga', 'eléctrico'],
  },

  // ── AIRE ACONDICIONADO ────────────────────────────────────────────────────
  {
    code: 'OP-CARGA-AC',
    name: 'Carga de refrigerante A/C',
    description:
      'Recarga del sistema de aire acondicionado con refrigerante R134a o R1234yf. Incluye prueba de fugas y verificación de presiones.',
    serviceTypeCode: 'AIRE-ACONDICIONADO',
    difficulty: 'STANDARD',
    requiredSpecialtyCode: 'ESP-AC',
    standardMinutes: 40,
    minMinutes: 30,
    maxMinutes: 60,
    listPrice: 45,
    costPrice: 15,
    warrantyDays: 90,
    requiredEquipment: 'Estación de carga de A/C, manómetros',
    tags: ['aire acondicionado', 'refrigerante', 'carga', 'AC'],
  },
  {
    code: 'OP-REV-AC',
    name: 'Revisión y diagnóstico del sistema A/C',
    description:
      'Diagnóstico completo del sistema de climatización: compresor, condensador, evaporador, válvulas y cañerías.',
    serviceTypeCode: 'AIRE-ACONDICIONADO',
    difficulty: 'STANDARD',
    requiredSpecialtyCode: 'ESP-AC',
    standardMinutes: 45,
    minMinutes: 30,
    maxMinutes: 60,
    listPrice: 40,
    costPrice: 10,
    requiredEquipment: 'Estación de A/C, detector de fugas electrónico',
    tags: ['aire acondicionado', 'diagnóstico', 'revisión', 'AC'],
  },
  {
    code: 'OP-CAMBIO-COMPRESOR-AC',
    name: 'Cambio de compresor de A/C',
    description:
      'Sustitución del compresor del sistema de aire acondicionado. Incluye recarga de refrigerante y prueba de presiones.',
    serviceTypeCode: 'AIRE-ACONDICIONADO',
    difficulty: 'SPECIALIST',
    requiredSpecialtyCode: 'ESP-AC',
    standardMinutes: 180,
    minMinutes: 150,
    maxMinutes: 240,
    listPrice: 160,
    costPrice: 45,
    warrantyDays: 365,
    requiredEquipment: 'Elevador, estación de A/C, herramientas de embrague',
    tags: ['aire acondicionado', 'compresor', 'AC'],
  },

  // ── TRANSMISIÓN ───────────────────────────────────────────────────────────
  {
    code: 'OP-CAMBIO-ACEITE-TRANSMISION',
    name: 'Cambio de aceite de transmisión automática',
    description:
      'Sustitución del aceite ATF y filtro de la transmisión automática. Incluye limpieza de la bandeja.',
    serviceTypeCode: 'TRANSMISION',
    difficulty: 'STANDARD',
    requiredSpecialtyCode: 'ESP-MECANICA',
    standardMinutes: 60,
    minMinutes: 45,
    maxMinutes: 90,
    listPrice: 55,
    costPrice: 18,
    warrantyDays: 180,
    warrantyKm: 30000,
    requiredEquipment: 'Elevador, extractor de aceite',
    tags: ['transmisión', 'aceite', 'ATF', 'automática'],
  },
]

const INGRESS_MOTIVES = [
  {
    code: 'MOT-MANT-PREV',
    name: 'Mantenimiento preventivo',
    description: 'Servicio de mantenimiento programado',
  },
  {
    code: 'MOT-REPARACION',
    name: 'Reparación',
    description: 'Reparación de falla o avería',
  },
  {
    code: 'MOT-DIAGNOSTICO',
    name: 'Diagnóstico',
    description: 'Diagnóstico de problema sin reparación',
  },
  {
    code: 'MOT-GARANTIA',
    name: 'Garantía',
    description: 'Trabajo cubierto por garantía',
  },
  {
    code: 'MOT-SINIESTRO',
    name: 'Siniestro',
    description: 'Daño por accidente o colisión',
  },
  { code: 'MOT-OTRO', name: 'Otro', description: 'Motivo no clasificado' },
]

const TECHNICIAN_SPECIALTIES = [
  {
    code: 'ESP-MECANICA',
    name: 'Mecánica general',
    description: 'Motor, frenos, transmisión',
  },
  {
    code: 'ESP-ELECTRICA',
    name: 'Electrónica automotriz',
    description: 'Diagnóstico y reparación eléctrica/electrónica',
  },
  {
    code: 'ESP-CARROCERIA',
    name: 'Carrocería y pintura',
    description: 'Reparación de chapa y pintura',
  },
  {
    code: 'ESP-AC',
    name: 'Aire acondicionado',
    description: 'Sistemas de climatización vehicular',
  },
  {
    code: 'ESP-ALINEACION',
    name: 'Alineación y suspensión',
    description: 'Alineación, balanceo y suspensión',
  },
]

const SHIFTS = [
  {
    code: 'TURNO-AM',
    name: 'Turno Mañana',
    startTime: '08:00',
    endTime: '13:00',
    workDays: [1, 2, 3, 4, 5],
  },
  {
    code: 'TURNO-PM',
    name: 'Turno Tarde',
    startTime: '13:00',
    endTime: '18:00',
    workDays: [1, 2, 3, 4, 5],
  },
]

const CHECKLIST_TEMPLATES = [
  // ── RECEPTION ────────────────────────────────────────────────────────────
  {
    code: 'REC-ESTANDAR',
    name: 'Checklist de Recepción Estándar',
    category: 'RECEPTION' as const,
    items: [
      {
        code: 'REC-001',
        name: 'Documentos del vehículo (factura/tarjeta)',
        responseType: 'BOOLEAN' as const,
        isRequired: true,
        order: 1,
        options: [],
      },
      {
        code: 'REC-002',
        name: 'Nivel de combustible',
        responseType: 'SELECTION' as const,
        isRequired: true,
        order: 2,
        options: ['Lleno', '3/4', '1/2', '1/4', 'Reserva'],
      },
      {
        code: 'REC-003',
        name: 'Estado de carrocería exterior',
        responseType: 'SELECTION' as const,
        isRequired: false,
        order: 3,
        options: [
          'Sin daños',
          'Daños menores',
          'Daños moderados',
          'Daños severos',
        ],
      },
      {
        code: 'REC-004',
        name: 'Estado del interior',
        responseType: 'SELECTION' as const,
        isRequired: false,
        order: 4,
        options: ['Limpio', 'Sucio', 'Con daños'],
      },
      {
        code: 'REC-005',
        name: 'Kilometraje al ingreso',
        responseType: 'NUMBER' as const,
        isRequired: true,
        order: 5,
        options: [],
      },
      {
        code: 'REC-006',
        name: 'Objetos de valor declarados',
        responseType: 'BOOLEAN' as const,
        isRequired: false,
        order: 6,
        options: [],
      },
      {
        code: 'REC-007',
        name: 'Observaciones del cliente',
        responseType: 'TEXT' as const,
        isRequired: false,
        order: 7,
        options: [],
      },
    ],
  },
  // ── QUALITY CONTROL ───────────────────────────────────────────────────────
  {
    code: 'QC-ESTANDAR',
    name: 'Control de Calidad Estándar',
    category: 'QUALITY_CONTROL' as const,
    items: [
      {
        code: 'QC-001',
        name: 'Trabajos solicitados completados',
        responseType: 'BOOLEAN' as const,
        isRequired: true,
        order: 1,
        options: [],
      },
      {
        code: 'QC-002',
        name: 'Prueba de ruta realizada',
        responseType: 'BOOLEAN' as const,
        isRequired: true,
        order: 2,
        options: [],
      },
      {
        code: 'QC-003',
        name: 'Estado de limpieza del vehículo',
        responseType: 'SELECTION' as const,
        isRequired: true,
        order: 3,
        options: ['Limpio', 'Aceptable', 'Requiere limpieza'],
      },
      {
        code: 'QC-004',
        name: 'Fluidos revisados (aceite, agua, frenos)',
        responseType: 'BOOLEAN' as const,
        isRequired: true,
        order: 4,
        options: [],
      },
      {
        code: 'QC-005',
        name: 'Herramientas retiradas del vehículo',
        responseType: 'BOOLEAN' as const,
        isRequired: true,
        order: 5,
        options: [],
      },
      {
        code: 'QC-006',
        name: 'Observaciones finales',
        responseType: 'TEXT' as const,
        isRequired: false,
        order: 6,
        options: [],
      },
    ],
  },
  // ── DIAGNOSIS ─────────────────────────────────────────────────────────────
  {
    code: 'DIAG-MAINT-PREVENTIVO',
    name: 'Diagnóstico - Mantenimiento Preventivo',
    category: 'DIAGNOSIS' as const,
    items: [
      {
        code: 'DI-001',
        name: 'Estado del motor (ruidos, vibraciones)',
        responseType: 'SELECTION' as const,
        isRequired: true,
        order: 1,
        options: ['Normal', 'Ruido menor', 'Ruido importante', 'Vibración'],
      },
      {
        code: 'DI-002',
        name: 'Nivel de aceite',
        responseType: 'SELECTION' as const,
        isRequired: true,
        order: 2,
        options: ['Óptimo', 'Bajo', 'Muy bajo'],
      },
      {
        code: 'DI-003',
        name: 'Estado de filtro aire',
        responseType: 'SELECTION' as const,
        isRequired: false,
        order: 3,
        options: ['Limpio', 'Moderado', 'Sucio', 'Muy sucio'],
      },
      {
        code: 'DI-004',
        name: 'Funcionamiento del A/C',
        responseType: 'SELECTION' as const,
        isRequired: false,
        order: 4,
        options: ['Óptimo', 'Débil', 'No funciona'],
      },
      {
        code: 'DI-005',
        name: 'Presión de llantas',
        responseType: 'NUMBER' as const,
        isRequired: false,
        order: 5,
        options: [],
      },
      {
        code: 'DI-006',
        name: 'Estado de pastillas freno',
        responseType: 'SELECTION' as const,
        isRequired: true,
        order: 6,
        options: ['Nuevas', 'Buenas', 'Desgastadas', 'Críticas'],
      },
      {
        code: 'DI-007',
        name: 'Observaciones adicionales',
        responseType: 'TEXT' as const,
        isRequired: false,
        order: 7,
        options: [],
      },
    ],
  },
  {
    code: 'DIAG-FRENOS',
    name: 'Diagnóstico - Sistema de Frenos',
    category: 'DIAGNOSIS' as const,
    items: [
      {
        code: 'DI-101',
        name: 'Sensibilidad del pedal',
        responseType: 'SELECTION' as const,
        isRequired: true,
        order: 1,
        options: ['Normal', 'Blanda', 'Dura', 'Pulsante'],
      },
      {
        code: 'DI-102',
        name: 'Ruido al frenar',
        responseType: 'BOOLEAN' as const,
        isRequired: false,
        order: 2,
        options: [],
      },
      {
        code: 'DI-103',
        name: 'Vibraciones al frenar',
        responseType: 'BOOLEAN' as const,
        isRequired: false,
        order: 3,
        options: [],
      },
      {
        code: 'DI-104',
        name: 'Estado pastillas delanteras',
        responseType: 'SELECTION' as const,
        isRequired: true,
        order: 4,
        options: ['Nuevas', 'Buenas', 'Desgastadas', 'Críticas'],
      },
      {
        code: 'DI-105',
        name: 'Estado pastillas traseras',
        responseType: 'SELECTION' as const,
        isRequired: true,
        order: 5,
        options: ['Nuevas', 'Buenas', 'Desgastadas', 'Críticas'],
      },
      {
        code: 'DI-106',
        name: 'Estado discos/tambores',
        responseType: 'SELECTION' as const,
        isRequired: false,
        order: 6,
        options: [
          'Óptimo',
          'Desgaste moderado',
          'Desgaste importante',
          'Crítico',
        ],
      },
      {
        code: 'DI-107',
        name: 'Fugas de líquido de frenos',
        responseType: 'BOOLEAN' as const,
        isRequired: true,
        order: 7,
        options: [],
      },
      {
        code: 'DI-108',
        name: 'Color del líquido de frenos',
        responseType: 'SELECTION' as const,
        isRequired: false,
        order: 8,
        options: ['Transparente', 'Amarillento', 'Oscuro', 'Café'],
      },
    ],
  },
  {
    code: 'DIAG-SUSPENSION',
    name: 'Diagnóstico - Sistema de Suspensión',
    category: 'DIAGNOSIS' as const,
    items: [
      {
        code: 'DI-201',
        name: 'Ruido en curvas',
        responseType: 'BOOLEAN' as const,
        isRequired: false,
        order: 1,
        options: [],
      },
      {
        code: 'DI-202',
        name: 'Ruido en baches',
        responseType: 'BOOLEAN' as const,
        isRequired: false,
        order: 2,
        options: [],
      },
      {
        code: 'DI-203',
        name: 'Inclinación del vehículo (cabeceo)',
        responseType: 'SELECTION' as const,
        isRequired: true,
        order: 3,
        options: ['Normal', 'Leve', 'Moderado', 'Severo'],
      },
      {
        code: 'DI-204',
        name: 'Amortiguadores (rebote)',
        responseType: 'SELECTION' as const,
        isRequired: true,
        order: 4,
        options: ['Normal', 'Leve rebote', 'Rebote excesivo'],
      },
      {
        code: 'DI-205',
        name: 'Estado de espirales/muelles',
        responseType: 'SELECTION' as const,
        isRequired: false,
        order: 5,
        options: ['Óptimo', 'Deformación leve', 'Fracturado'],
      },
      {
        code: 'DI-206',
        name: 'Estado de barras estabilizadoras',
        responseType: 'SELECTION' as const,
        isRequired: false,
        order: 6,
        options: ['Óptimo', 'Desgaste leve', 'Roto'],
      },
      {
        code: 'DI-207',
        name: 'Alineación (rasguños neumáticos)',
        responseType: 'BOOLEAN' as const,
        isRequired: false,
        order: 7,
        options: [],
      },
    ],
  },
  {
    code: 'DIAG-MOTOR',
    name: 'Diagnóstico - Motor',
    category: 'DIAGNOSIS' as const,
    items: [
      {
        code: 'DI-301',
        name: 'Lecturas de scanner',
        responseType: 'TEXT' as const,
        isRequired: false,
        order: 1,
        options: [],
      },
      {
        code: 'DI-302',
        name: 'Luz de verificación motor',
        responseType: 'BOOLEAN' as const,
        isRequired: true,
        order: 2,
        options: [],
      },
      {
        code: 'DI-303',
        name: 'Arranque (dificultad)',
        responseType: 'SELECTION' as const,
        isRequired: true,
        order: 3,
        options: ['Normal', 'Lento', 'Muy lento', 'No arranca'],
      },
      {
        code: 'DI-304',
        name: 'Fumarola al arranque',
        responseType: 'SELECTION' as const,
        isRequired: false,
        order: 4,
        options: ['No', 'Blanca', 'Azul', 'Negra'],
      },
      {
        code: 'DI-305',
        name: 'Rendimiento de combustible',
        responseType: 'SELECTION' as const,
        isRequired: false,
        order: 5,
        options: ['Normal', 'Consumo aumentado', 'Consumo muy alto'],
      },
      {
        code: 'DI-306',
        name: 'Ruidos del motor',
        responseType: 'SELECTION' as const,
        isRequired: false,
        order: 6,
        options: ['Normal', 'Golpeteo leve', 'Golpeteo fuerte', 'Otros ruidos'],
      },
      {
        code: 'DI-307',
        name: 'Vibraciones anormales',
        responseType: 'BOOLEAN' as const,
        isRequired: false,
        order: 7,
        options: [],
      },
      {
        code: 'DI-308',
        name: 'Nivel de aceite',
        responseType: 'SELECTION' as const,
        isRequired: true,
        order: 8,
        options: ['Óptimo', 'Bajo', 'Muy bajo', 'Sucio'],
      },
    ],
  },
  {
    code: 'DIAG-TRANSMISION',
    name: 'Diagnóstico - Transmisión',
    category: 'DIAGNOSIS' as const,
    items: [
      {
        code: 'DI-401',
        name: 'Cambios suaves',
        responseType: 'SELECTION' as const,
        isRequired: true,
        order: 1,
        options: ['Normal', 'Algo duros', 'Muy duros', 'Golpeados'],
      },
      {
        code: 'DI-402',
        name: 'Demoras en cambios',
        responseType: 'BOOLEAN' as const,
        isRequired: false,
        order: 2,
        options: [],
      },
      {
        code: 'DI-403',
        name: 'Ruidos en transmisión',
        responseType: 'BOOLEAN' as const,
        isRequired: false,
        order: 3,
        options: [],
      },
      {
        code: 'DI-404',
        name: 'Pérdidas de aceite',
        responseType: 'BOOLEAN' as const,
        isRequired: true,
        order: 4,
        options: [],
      },
      {
        code: 'DI-405',
        name: 'Nivel de aceite de transmisión',
        responseType: 'SELECTION' as const,
        isRequired: true,
        order: 5,
        options: ['Óptimo', 'Bajo', 'Muy bajo', 'Sucio'],
      },
      {
        code: 'DI-406',
        name: 'Color del aceite',
        responseType: 'SELECTION' as const,
        isRequired: false,
        order: 6,
        options: ['Rojo', 'Rosa', 'Marrón', 'Negro'],
      },
      {
        code: 'DI-407',
        name: 'Patinaje en aceleración',
        responseType: 'BOOLEAN' as const,
        isRequired: false,
        order: 7,
        options: [],
      },
    ],
  },
  {
    code: 'DIAG-ELECTRICO',
    name: 'Diagnóstico - Sistema Eléctrico',
    category: 'DIAGNOSIS' as const,
    items: [
      {
        code: 'DI-501',
        name: 'Batería (voltaje)',
        responseType: 'NUMBER' as const,
        isRequired: false,
        order: 1,
        options: [],
      },
      {
        code: 'DI-502',
        name: 'Luces delanteras',
        responseType: 'SELECTION' as const,
        isRequired: false,
        order: 2,
        options: ['OK', 'Débiles', 'No encienden', 'Intermitentes'],
      },
      {
        code: 'DI-503',
        name: 'Luces traseras',
        responseType: 'SELECTION' as const,
        isRequired: false,
        order: 3,
        options: ['OK', 'Débiles', 'No encienden', 'Intermitentes'],
      },
      {
        code: 'DI-504',
        name: 'Limpiaparabrisas',
        responseType: 'SELECTION' as const,
        isRequired: false,
        order: 4,
        options: ['OK', 'Débil', 'No funciona'],
      },
      {
        code: 'DI-505',
        name: 'Levantavidrios',
        responseType: 'SELECTION' as const,
        isRequired: false,
        order: 5,
        options: ['OK', 'Lento', 'No funciona'],
      },
      {
        code: 'DI-506',
        name: 'Cierre centralizado',
        responseType: 'SELECTION' as const,
        isRequired: false,
        order: 6,
        options: ['OK', 'Parcial', 'No funciona'],
      },
      {
        code: 'DI-507',
        name: 'Tablero de instrumentos',
        responseType: 'SELECTION' as const,
        isRequired: false,
        order: 7,
        options: ['OK', 'Luces débiles', 'No enciende'],
      },
    ],
  },
  {
    code: 'DIAG-AIRE-ACONDICIONADO',
    name: 'Diagnóstico - Aire Acondicionado',
    category: 'DIAGNOSIS' as const,
    items: [
      {
        code: 'DI-601',
        name: 'Compresor (activación)',
        responseType: 'BOOLEAN' as const,
        isRequired: true,
        order: 1,
        options: [],
      },
      {
        code: 'DI-602',
        name: 'Enfriamiento',
        responseType: 'SELECTION' as const,
        isRequired: true,
        order: 2,
        options: ['Normal', 'Débil', 'No enfría'],
      },
      {
        code: 'DI-603',
        name: 'Temperatura mínima',
        responseType: 'NUMBER' as const,
        isRequired: false,
        order: 3,
        options: [],
      },
      {
        code: 'DI-604',
        name: 'Flujo de aire',
        responseType: 'SELECTION' as const,
        isRequired: false,
        order: 4,
        options: ['Normal', 'Débil', 'No hay flujo'],
      },
      {
        code: 'DI-605',
        name: 'Ruidos extraños',
        responseType: 'BOOLEAN' as const,
        isRequired: false,
        order: 5,
        options: [],
      },
      {
        code: 'DI-606',
        name: 'Fugas de refrigerante',
        responseType: 'BOOLEAN' as const,
        isRequired: true,
        order: 6,
        options: [],
      },
      {
        code: 'DI-607',
        name: 'Olor desagradable',
        responseType: 'BOOLEAN' as const,
        isRequired: false,
        order: 7,
        options: [],
      },
    ],
  },
  {
    code: 'DIAG-ALINEO-BALANCEO',
    name: 'Diagnóstico - Alineación y Balanceo',
    category: 'DIAGNOSIS' as const,
    items: [
      {
        code: 'DI-701',
        name: 'Desgaste uniforme de llantas',
        responseType: 'BOOLEAN' as const,
        isRequired: true,
        order: 1,
        options: [],
      },
      {
        code: 'DI-702',
        name: 'Rastro o tendencia de dirección',
        responseType: 'SELECTION' as const,
        isRequired: true,
        order: 2,
        options: ['Normal', 'Leve', 'Importante'],
      },
      {
        code: 'DI-703',
        name: 'Vibraciones en volante',
        responseType: 'SELECTION' as const,
        isRequired: true,
        order: 3,
        options: ['No', 'Baja velocidad', 'Alta velocidad', 'Continua'],
      },
      {
        code: 'DI-704',
        name: 'Estado de rótulas',
        responseType: 'SELECTION' as const,
        isRequired: false,
        order: 4,
        options: ['Óptimo', 'Juego leve', 'Juego importante'],
      },
      {
        code: 'DI-705',
        name: 'Estado de bujes',
        responseType: 'SELECTION' as const,
        isRequired: false,
        order: 5,
        options: ['Óptimo', 'Desgaste leve', 'Desgaste importante'],
      },
    ],
  },
  {
    code: 'DIAG-LLANTAS',
    name: 'Diagnóstico - Llantas',
    category: 'DIAGNOSIS' as const,
    items: [
      {
        code: 'DI-801',
        name: 'Presión actual',
        responseType: 'NUMBER' as const,
        isRequired: true,
        order: 1,
        options: [],
      },
      {
        code: 'DI-802',
        name: 'Espesor del dibujo (pulgas)',
        responseType: 'NUMBER' as const,
        isRequired: true,
        order: 2,
        options: [],
      },
      {
        code: 'DI-803',
        name: 'Desgaste irregular',
        responseType: 'BOOLEAN' as const,
        isRequired: false,
        order: 3,
        options: [],
      },
      {
        code: 'DI-804',
        name: 'Cortes o llagas',
        responseType: 'BOOLEAN' as const,
        isRequired: false,
        order: 4,
        options: [],
      },
      {
        code: 'DI-805',
        name: 'Abultamientos',
        responseType: 'BOOLEAN' as const,
        isRequired: false,
        order: 5,
        options: [],
      },
      {
        code: 'DI-806',
        name: 'Condición de flancos',
        responseType: 'SELECTION' as const,
        isRequired: false,
        order: 6,
        options: ['OK', 'Desgaste leve', 'Grietas'],
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// SEED FUNCTION
// ---------------------------------------------------------------------------

export default async function seedWorkshop(
  prisma: PrismaClient,
  empresaId: string
) {
  console.log('🌱 Starting workshop seed...\n')

  try {
    // 1. Service Types
    console.log('  → Service Types')
    for (const st of SERVICE_TYPES) {
      await (prisma as any).serviceType.upsert({
        where: { empresaId_code: { empresaId, code: st.code } },
        update: { name: st.name, isActive: true },
        create: { code: st.code, name: st.name, isActive: true, empresaId },
      })
      console.log(`     ✅ ${st.code}`)
    }

    // 2. Workshop Shifts
    console.log('  → Workshop Shifts')
    for (const s of SHIFTS) {
      await (prisma as any).workshopShift.upsert({
        where: { empresaId_code: { empresaId, code: s.code } },
        update: {
          name: s.name,
          startTime: s.startTime,
          endTime: s.endTime,
          workDays: s.workDays,
          isActive: true,
        },
        create: {
          code: s.code,
          name: s.name,
          startTime: s.startTime,
          endTime: s.endTime,
          workDays: s.workDays,
          isActive: true,
          empresaId,
          createdBy: 'SYSTEM',
        },
      })
      console.log(`     ✅ ${s.code}`)
    }

    // 4. Ingress Motives
    console.log('  → Ingress Motives')
    for (const m of INGRESS_MOTIVES) {
      await (prisma as any).ingressMotive.upsert({
        where: { empresaId_code: { empresaId, code: m.code } },
        update: { name: m.name, description: m.description, isActive: true },
        create: {
          code: m.code,
          name: m.name,
          description: m.description,
          isActive: true,
          empresaId,
          createdBy: 'SYSTEM',
        },
      })
      console.log(`     ✅ ${m.code}`)
    }

    // 5. Technician Specialties
    console.log('  → Technician Specialties')
    for (const sp of TECHNICIAN_SPECIALTIES) {
      await (prisma as any).technicianSpecialty.upsert({
        where: { empresaId_code: { empresaId, code: sp.code } },
        update: { name: sp.name, description: sp.description, isActive: true },
        create: {
          code: sp.code,
          name: sp.name,
          description: sp.description,
          isActive: true,
          empresaId,
          createdBy: 'SYSTEM',
        },
      })
      console.log(`     ✅ ${sp.code}`)
    }

    // 6. Workshop Bays
    console.log('  → Workshop Bays')
    for (const bay of BAYS) {
      await (prisma as any).workshopBay.upsert({
        where: { empresaId_code: { empresaId, code: bay.code } },
        update: {
          name: bay.name,
          description: bay.description,
          isActive: true,
        },
        create: {
          code: bay.code,
          name: bay.name,
          description: bay.description,
          isActive: true,
          empresaId,
        },
      })
      console.log(`     ✅ ${bay.code}`)
    }

    // 7. Workshop Operations (depends on ServiceTypes + TechnicianSpecialties)
    console.log('  → Workshop Operations')
    const serviceTypes = await (prisma as any).serviceType.findMany({
      where: { empresaId },
      select: { id: true, code: true },
    })
    const stMap = new Map<string, string>(
      serviceTypes.map((st: any) => [st.code, st.id])
    )

    const specialties = await (prisma as any).technicianSpecialty.findMany({
      where: { empresaId },
      select: { id: true, code: true },
    })
    const spMap = new Map<string, string>(
      specialties.map((sp: any) => [sp.code, sp.id])
    )

    for (const op of OPERATIONS) {
      const serviceTypeId = stMap.get(op.serviceTypeCode) ?? null
      const requiredSpecialtyId = spMap.get(op.requiredSpecialtyCode) ?? null
      await (prisma as any).workshopOperation.upsert({
        where: { empresaId_code: { empresaId, code: op.code } },
        update: {
          name: op.name,
          description: op.description,
          difficulty: op.difficulty,
          requiredSpecialtyId,
          serviceTypeId,
          standardMinutes: op.standardMinutes,
          minMinutes: op.minMinutes,
          maxMinutes: op.maxMinutes,
          listPrice: op.listPrice,
          costPrice: op.costPrice,
          warrantyDays: op.warrantyDays ?? null,
          warrantyKm: op.warrantyKm ?? null,
          requiredEquipment: op.requiredEquipment ?? null,
          tags: op.tags,
          isActive: true,
        },
        create: {
          code: op.code,
          name: op.name,
          description: op.description,
          difficulty: op.difficulty,
          requiredSpecialtyId,
          serviceTypeId,
          standardMinutes: op.standardMinutes,
          minMinutes: op.minMinutes,
          maxMinutes: op.maxMinutes,
          listPrice: op.listPrice,
          costPrice: op.costPrice,
          warrantyDays: op.warrantyDays ?? null,
          warrantyKm: op.warrantyKm ?? null,
          requiredEquipment: op.requiredEquipment ?? null,
          tags: op.tags,
          isActive: true,
          empresaId,
        },
      })
      console.log(`     ✅ ${op.code}`)
    }

    // 8. Checklist Templates + Items
    console.log('  → Checklist Templates')
    for (const tmpl of CHECKLIST_TEMPLATES) {
      const existing = await (prisma as any).checklistTemplate.findFirst({
        where: { empresaId, code: tmpl.code },
      })

      if (existing) {
        console.log(`     ⏭️  ${tmpl.code} (already exists)`)
        continue
      }

      await (prisma as any).checklistTemplate.create({
        data: {
          code: tmpl.code,
          name: tmpl.name,
          category: tmpl.category,
          isActive: true,
          empresaId,
          createdBy: 'SYSTEM',
          items: {
            create: tmpl.items.map((item) => ({
              code: item.code,
              name: item.name,
              responseType: item.responseType,
              isRequired: item.isRequired,
              order: item.order,
              options: item.options.length > 0 ? item.options : undefined,
              isActive: true,
              empresaId,
            })),
          },
        },
      })
      console.log(`     ✅ ${tmpl.code} (${tmpl.items.length} items)`)
    }

    console.log('\n✅ Workshop seed completed successfully!')
  } catch (error) {
    console.error('❌ Error in workshop seed:', error)
    throw error
  }
}
