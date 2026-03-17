import type { PrismaClient } from '../../src/generated/prisma/client.js'

// ─── Tipos ──────────────────────────────────────────────────────
interface CategoryChild {
  code: string
  name: string
}

interface CategoryDef {
  code: string
  name: string
  margin: number
  children: CategoryChild[]
}

// ─── Árbol de categorías IVECO (normalizado) ────────────────────
// 16 categorías padre, 163 subcategorías
const CATEGORY_TREE: CategoryDef[] = [
  {
    code: 'MOT',
    name: 'Motor',
    margin: 30.0,
    children: [
      { code: 'MOT_PISTONES_Y_COMPONENTES', name: 'Pistones y Componentes' },
      { code: 'MOT_VALVULAS_Y_DISTRIBUCION', name: 'Válvulas y Distribución' },
      { code: 'MOT_JUNTAS_Y_SELLOS', name: 'Juntas y Sellos' },
      { code: 'MOT_SISTEMA_DE_LUBRICACION', name: 'Sistema de Lubricación' },
      { code: 'MOT_DISTRIBUCION_DEL_MOTOR', name: 'Distribución del Motor' },
      { code: 'MOT_RETENES_Y_SELLOS', name: 'Retenes y Sellos' },
      { code: 'MOT_INYECCION_Y_COMBUSTIBLE', name: 'Inyección y Combustible' },
      { code: 'MOT_COJINETES_DE_MOTOR', name: 'Cojinetes de Motor' },
      { code: 'MOT_BLOQUE_DE_MOTOR', name: 'Bloque de Motor' },
      { code: 'MOT_COMPONENTES_INTERNOS', name: 'Componentes Internos' },
      { code: 'MOT_CIG_ENAL_Y_BIELAS', name: 'Cigüeñal y Bielas' },
      { code: 'MOT_TREN_ALTERNATIVO', name: 'Tren Alternativo' },
      { code: 'MOT_CULATA_Y_VALVULAS', name: 'Culata y Válvulas' },
      { code: 'MOT_FILTRACION_DEL_MOTOR', name: 'Filtración del Motor' },
      {
        code: 'MOT_ADMISION_Y_SOBREALIMENTACI',
        name: 'Admisión y Sobrealimentación',
      },
      { code: 'MOT_SOPORTES_DE_MOTOR', name: 'Soportes de Motor' },
      { code: 'MOT_CONTROL_DE_ACELERACION', name: 'Control de Aceleración' },
      { code: 'MOT_REFRIGERACION_DEL_MOTOR', name: 'Refrigeración del Motor' },
      {
        code: 'MOT_SISTEMA_DE_AIRE_COMPRIMIDO',
        name: 'Sistema de Aire Comprimido',
      },
      { code: 'MOT_FRENO_MOTOR', name: 'Freno Motor' },
      { code: 'MOT_ACCESORIOS_Y_CORREAS', name: 'Accesorios y Correas' },
      { code: 'MOT_VENTILACION_DEL_CARTER', name: 'Ventilación del Cárter' },
      {
        code: 'MOT_SISTEMA_DE_ARRANQUE_Y_ENCE',
        name: 'Sistema de Arranque y Encendido',
      },
      { code: 'MOT_CONDUCCION_DE_FLUIDOS', name: 'Conducción de Fluidos' },
      { code: 'MOT_TRANSMISION_AUXILIAR', name: 'Transmisión Auxiliar' },
    ],
  },
  {
    code: 'TRANS',
    name: 'Transmisión y Tren Motriz',
    margin: 32.0,
    children: [
      { code: 'TRANS_MANDO_DE_CAMBIOS', name: 'Mando de Cambios' },
      { code: 'TRANS_CAJA_DE_CAMBIOS', name: 'Caja de Cambios' },
      {
        code: 'TRANS_RODAMIENTOS_DE_TRANSMISI',
        name: 'Rodamientos de Transmisión',
      },
      { code: 'TRANS_DIFERENCIAL', name: 'Diferencial' },
      {
        code: 'TRANS_JUNTAS_Y_SELLOS_DE_TRANS',
        name: 'Juntas y Sellos de Transmisión',
      },
      { code: 'TRANS_ARBOL_DE_TRANSMISION', name: 'Árbol de Transmisión' },
      { code: 'TRANS_EMBRAGUE', name: 'Embrague' },
      { code: 'TRANS_KITS_DE_REPARACION', name: 'Kits de Reparación' },
      {
        code: 'TRANS_FIJACION_DE_TRANSMISION',
        name: 'Fijación de Transmisión',
      },
      { code: 'TRANS_ENGRANAJES', name: 'Engranajes' },
      {
        code: 'TRANS_LUBRICACION_DE_TRANSMISI',
        name: 'Lubricación de Transmisión',
      },
      { code: 'TRANS_SINCRONIZADORES', name: 'Sincronizadores' },
      { code: 'TRANS_CARCASAS_Y_TAPAS', name: 'Carcasas y Tapas' },
      { code: 'TRANS_ACOPLAMIENTOS', name: 'Acoplamientos' },
      { code: 'TRANS_TOMA_DE_FUERZA', name: 'Toma de Fuerza' },
    ],
  },
  {
    code: 'CHAS',
    name: 'Chasis y Suspensión',
    margin: 28.0,
    children: [
      { code: 'CHAS_SUSPENSION_GENERAL', name: 'Suspensión General' },
      { code: 'CHAS_ACCESORIOS_DE_CHASIS', name: 'Accesorios de Chasis' },
      { code: 'CHAS_ESTRUCTURA_DE_CHASIS', name: 'Estructura de Chasis' },
      { code: 'CHAS_SOPORTES_DE_CHASIS', name: 'Soportes de Chasis' },
      { code: 'CHAS_AMORTIGUADORES', name: 'Amortiguadores' },
      { code: 'CHAS_CONEXIONES_Y_FLUIDOS', name: 'Conexiones y Fluidos' },
      { code: 'CHAS_EJE_DELANTERO', name: 'Eje Delantero' },
      { code: 'CHAS_RODAMIENTOS_DE_RUEDA', name: 'Rodamientos de Rueda' },
      { code: 'CHAS_BALLESTAS_Y_MUELLES', name: 'Ballestas y Muelles' },
      { code: 'CHAS_CUBOS_Y_BUJES', name: 'Cubos y Bujes' },
      { code: 'CHAS_EJE_TRASERO', name: 'Eje Trasero' },
      { code: 'CHAS_BARRA_ESTABILIZADORA', name: 'Barra Estabilizadora' },
      { code: 'CHAS_FIJACION_DE_CHASIS', name: 'Fijación de Chasis' },
      { code: 'CHAS_PROTECCION_DE_CHASIS', name: 'Protección de Chasis' },
    ],
  },
  {
    code: 'DIR',
    name: 'Dirección',
    margin: 30.0,
    children: [
      {
        code: 'DIR_ARTICULACIONES_Y_ROTULAS',
        name: 'Articulaciones y Rótulas',
      },
      { code: 'DIR_BARRAS_Y_TERMINALES', name: 'Barras y Terminales' },
      { code: 'DIR_COMPONENTES_MECANICOS', name: 'Componentes Mecánicos' },
      { code: 'DIR_COLUMNA_DE_DIRECCION', name: 'Columna de Dirección' },
      {
        code: 'DIR_SERVODIRECCION_DIRECCION_A',
        name: 'Servodirección / Dirección Asistida',
      },
      { code: 'DIR_CAJA_DE_DIRECCION', name: 'Caja de Dirección' },
    ],
  },
  {
    code: 'FREN',
    name: 'Sistema de Frenos',
    margin: 35.0,
    children: [
      { code: 'FREN_CILINDROS_Y_CAMARAS', name: 'Cilindros y Cámaras' },
      {
        code: 'FREN_SISTEMA_NEUMATICO_DE_FREN',
        name: 'Sistema Neumático de Frenos',
      },
      {
        code: 'FREN_FRENO_DE_ESTACIONAMIENTO',
        name: 'Freno de Estacionamiento',
      },
      {
        code: 'FREN_SISTEMA_HIDRAULICO_DE_FRE',
        name: 'Sistema Hidráulico de Frenos',
      },
      { code: 'FREN_PASTILLAS_Y_ZAPATAS', name: 'Pastillas y Zapatas' },
      { code: 'FREN_PINZAS_Y_MORDAZAS', name: 'Pinzas y Mordazas' },
      {
        code: 'FREN_SISTEMA_DE_FRENADO_GENERA',
        name: 'Sistema de Frenado General',
      },
      { code: 'FREN_FRENO_DE_DISCO', name: 'Freno de Disco' },
      { code: 'FREN_FRENO_DE_TAMBOR', name: 'Freno de Tambor' },
      { code: 'FREN_FRENOS_DE_EJE', name: 'Frenos de Eje' },
      {
        code: 'FREN_TUBERIAS_Y_CONEXIONES_DE_',
        name: 'Tuberías y Conexiones de Freno',
      },
    ],
  },
  {
    code: 'ELEC',
    name: 'Sistema Eléctrico y Electrónica',
    margin: 28.0,
    children: [
      { code: 'ELEC_FAROS', name: 'Faros' },
      { code: 'ELEC_INTERRUPTORES_Y_RELES', name: 'Interruptores y Relés' },
      { code: 'ELEC_ALTERNADOR', name: 'Alternador' },
      {
        code: 'ELEC_UNIDADES_DE_CONTROL_ELECT',
        name: 'Unidades de Control Electrónico',
      },
      { code: 'ELEC_MOTOR_DE_ARRANQUE', name: 'Motor de Arranque' },
      { code: 'ELEC_CABLEADO_Y_CONECTORES', name: 'Cableado y Conectores' },
      {
        code: 'ELEC_SISTEMA_ELECTRICO_GENERAL',
        name: 'Sistema Eléctrico General',
      },
      { code: 'ELEC_CONTROL_ELECTRICO', name: 'Control Eléctrico' },
      { code: 'ELEC_ILUMINACION', name: 'Iluminación' },
      { code: 'ELEC_BATERIA_Y_CARGA', name: 'Batería y Carga' },
      { code: 'ELEC_SENSORES', name: 'Sensores' },
      { code: 'ELEC_INSTRUMENTACION', name: 'Instrumentación' },
      { code: 'ELEC_SENALIZACION', name: 'Señalización' },
      { code: 'ELEC_PROTECCION_ELECTRICA', name: 'Protección Eléctrica' },
    ],
  },
  {
    code: 'CARR',
    name: 'Carrocería e Interior',
    margin: 25.0,
    children: [
      { code: 'CARR_PARACHOQUES_Y_DEFENSAS', name: 'Parachoques y Defensas' },
      { code: 'CARR_ACCESORIOS_DE_CABINA', name: 'Accesorios de Cabina' },
      { code: 'CARR_ACCESORIOS_EXTERIORES', name: 'Accesorios Exteriores' },
      {
        code: 'CARR_PROTECCION_DE_CARROCERIA',
        name: 'Protección de Carrocería',
      },
      { code: 'CARR_PUERTAS_Y_CERRADURAS', name: 'Puertas y Cerraduras' },
      { code: 'CARR_SISTEMAS_DE_CABINA', name: 'Sistemas de Cabina' },
      { code: 'CARR_ESTRUCTURA_DE_CABINA', name: 'Estructura de Cabina' },
      { code: 'CARR_ESTRIBOS_Y_ACCESOS', name: 'Estribos y Accesos' },
      { code: 'CARR_CRISTALES_Y_VENTANAS', name: 'Cristales y Ventanas' },
      { code: 'CARR_PANELES_EXTERIORES', name: 'Paneles Exteriores' },
      { code: 'CARR_GUARDABARROS', name: 'Guardabarros' },
      {
        code: 'CARR_REVESTIMIENTOS_INTERIORES',
        name: 'Revestimientos Interiores',
      },
      { code: 'CARR_PANEL_DE_INSTRUMENTOS', name: 'Panel de Instrumentos' },
      { code: 'CARR_LIMPIAPARABRISAS', name: 'Limpiaparabrisas' },
      { code: 'CARR_ASIENTOS_Y_CONFORT', name: 'Asientos y Confort' },
      { code: 'CARR_ESPEJOS_Y_RETROVISORES', name: 'Espejos y Retrovisores' },
      {
        code: 'CARR_ACABADOS_Y_ELEMENTOS_DECO',
        name: 'Acabados y Elementos Decorativos',
      },
      {
        code: 'CARR_AISLAMIENTO_E_INSONORIZAC',
        name: 'Aislamiento e Insonorización',
      },
      { code: 'CARR_CAPO_Y_CALANDRA', name: 'Capó y Calandra' },
      {
        code: 'CARR_ILUMINACION_DE_CARROCERIA',
        name: 'Iluminación de Carrocería',
      },
    ],
  },
  {
    code: 'REFR',
    name: 'Refrigeración y Climatización',
    margin: 27.0,
    children: [
      {
        code: 'REFR_SISTEMA_DE_REFRIGERACION',
        name: 'Sistema de Refrigeración',
      },
      { code: 'REFR_RADIADORES', name: 'Radiadores' },
      { code: 'REFR_VENTILACION', name: 'Ventilación' },
      { code: 'REFR_AIRE_ACONDICIONADO', name: 'Aire Acondicionado' },
      { code: 'REFR_BOMBA_DE_AGUA', name: 'Bomba de Agua' },
      { code: 'REFR_CALEFACCION', name: 'Calefacción' },
      { code: 'REFR_CLIMATIZACION', name: 'Climatización' },
    ],
  },
  {
    code: 'COMB',
    name: 'Alimentación de Combustible',
    margin: 22.0,
    children: [
      { code: 'COMB_SISTEMA_DE_INYECCION', name: 'Sistema de Inyección' },
      { code: 'COMB_SISTEMA_DE_ALIMENTACION', name: 'Sistema de Alimentación' },
      { code: 'COMB_BOMBA_DE_ALIMENTACION', name: 'Bomba de Alimentación' },
      { code: 'COMB_DEPOSITO_DE_COMBUSTIBLE', name: 'Depósito de Combustible' },
      {
        code: 'COMB_SENSORES_E_INSTRUMENTACIO',
        name: 'Sensores e Instrumentación',
      },
      {
        code: 'COMB_FILTRACION_DE_COMBUSTIBLE',
        name: 'Filtración de Combustible',
      },
    ],
  },
  {
    code: 'ESC',
    name: 'Sistema de Escape y Postratamiento',
    margin: 30.0,
    children: [
      { code: 'ESC_FIJACION_Y_MONTAJE', name: 'Fijación y Montaje' },
      { code: 'ESC_SISTEMA_DE_ESCAPE', name: 'Sistema de Escape' },
      { code: 'ESC_TUBERIAS_DE_ESCAPE', name: 'Tuberías de Escape' },
    ],
  },
  {
    code: 'HIDN',
    name: 'Sistema Hidráulico y Neumático',
    margin: 28.0,
    children: [
      { code: 'HIDN_RACORES_Y_CONECTORES', name: 'Racores y Conectores' },
      { code: 'HIDN_COMPRESOR_DE_AIRE', name: 'Compresor de Aire' },
      { code: 'HIDN_CONEXIONES', name: 'Conexiones' },
      { code: 'HIDN_SISTEMA_NEUMATICO', name: 'Sistema Neumático' },
      { code: 'HIDN_TUBERIAS_Y_CONDUCCIONES', name: 'Tuberías y Conducciones' },
      { code: 'HIDN_ACTUADORES', name: 'Actuadores' },
      { code: 'HIDN_MANGUERAS', name: 'Mangueras' },
      { code: 'HIDN_VALVULAS', name: 'Válvulas' },
      { code: 'HIDN_CILINDROS', name: 'Cilindros' },
    ],
  },
  {
    code: 'NEUM',
    name: 'Neumáticos y Ruedas',
    margin: 25.0,
    children: [
      { code: 'NEUM_CUBOS_Y_BUJES_DE_RUEDA', name: 'Cubos y Bujes de Rueda' },
      { code: 'NEUM_LLANTAS', name: 'Llantas' },
      { code: 'NEUM_RUEDAS_Y_NEUMATICOS', name: 'Ruedas y Neumáticos' },
      { code: 'NEUM_FIJACION_DE_RUEDA', name: 'Fijación de Rueda' },
    ],
  },
  {
    code: 'FILT',
    name: 'Filtros y Mantenimiento Preventivo',
    margin: 30.0,
    children: [
      { code: 'FILT_FILTRO_DE_AIRE', name: 'Filtro de Aire' },
      { code: 'FILT_FILTRO_DE_DIRECCION', name: 'Filtro de Dirección' },
      { code: 'FILT_FILTRO_DE_COMBUSTIBLE', name: 'Filtro de Combustible' },
      { code: 'FILT_ELEMENTOS_DE_SELLADO', name: 'Elementos de Sellado' },
      { code: 'FILT_KITS_DE_MANTENIMIENTO', name: 'Kits de Mantenimiento' },
      { code: 'FILT_HERRAMIENTAS', name: 'Herramientas' },
      { code: 'FILT_DESLIZANTES_Y_FRICCION', name: 'Deslizantes y Fricción' },
    ],
  },
  {
    code: 'LUBR',
    name: 'Lubricantes y Fluidos',
    margin: 20.0,
    children: [
      { code: 'LUBR_DEPOSITOS_Y_VACIADO', name: 'Depósitos y Vaciado' },
      {
        code: 'LUBR_FLUIDOS_DE_REFRIGERACION',
        name: 'Fluidos de Refrigeración',
      },
    ],
  },
  {
    code: 'FIJA',
    name: 'Fijaciones y Tornillería',
    margin: 40.0,
    children: [
      { code: 'FIJA_ESPARRAGOS_Y_PASADORES', name: 'Espárragos y Pasadores' },
      { code: 'FIJA_ABRAZADERAS_Y_CLIPS', name: 'Abrazaderas y Clips' },
      { code: 'FIJA_TORNILLOS', name: 'Tornillos' },
      { code: 'FIJA_ARANDELAS', name: 'Arandelas' },
      { code: 'FIJA_TUERCAS', name: 'Tuercas' },
      { code: 'FIJA_CASQUILLOS_Y_COJINETES', name: 'Casquillos y Cojinetes' },
      { code: 'FIJA_ELEMENTOS_DE_FIJACION', name: 'Elementos de Fijación' },
      { code: 'FIJA_ANILLOS_DE_RETENCION', name: 'Anillos de Retención' },
      { code: 'FIJA_SUJECION_GENERAL', name: 'Sujeción General' },
      { code: 'FIJA_CONECTORES_Y_RACORES', name: 'Conectores y Racores' },
      { code: 'FIJA_ELEMENTOS_DE_APOYO', name: 'Elementos de Apoyo' },
      { code: 'FIJA_SOPORTES_Y_GUIAS', name: 'Soportes y Guías' },
      { code: 'FIJA_TAPONES_Y_SELLOS', name: 'Tapones y Sellos' },
      { code: 'FIJA_ELEMENTOS_DE_AJUSTE', name: 'Elementos de Ajuste' },
      { code: 'FIJA_CUBIERTAS_Y_CIERRES', name: 'Cubiertas y Cierres' },
    ],
  },
  {
    code: 'ACCS',
    name: 'Accesorios y Seguridad',
    margin: 35.0,
    children: [
      { code: 'ACCS_COMPONENTES_GENERICOS', name: 'Componentes Genéricos' },
      { code: 'ACCS_CONEXIONES_Y_CONDUCTOS', name: 'Conexiones y Conductos' },
      { code: 'ACCS_PROTECCION_Y_SEGURIDAD', name: 'Protección y Seguridad' },
      { code: 'ACCS_ALMACENAMIENTO', name: 'Almacenamiento' },
      { code: 'ACCS_AJUSTE_Y_CALIBRACION', name: 'Ajuste y Calibración' },
    ],
  },
]

// ─── Seed principal ─────────────────────────────────────────────
async function seedCategories(prisma: PrismaClient, empresaId: string) {
  try {
    console.log('🌱 Starting categories seed...\n')

    const totalChildren = CATEGORY_TREE.reduce(
      (acc, c) => acc + c.children.length,
      0
    )
    console.log(
      `📊 ${CATEGORY_TREE.length} categorías padre, ${totalChildren} subcategorías\n`
    )

    let parentCount = 0
    let childCount = 0

    for (const parent of CATEGORY_TREE) {
      // Upsert categoría padre
      const parentCat = await prisma.category.upsert({
        where: { empresaId_code: { empresaId, code: parent.code } },
        update: {
          name: parent.name,
          defaultMargin: parent.margin,
          isActive: true,
        },
        create: {
          code: parent.code,
          name: parent.name,
          defaultMargin: parent.margin,
          isActive: true,
          empresaId,
        },
      })
      parentCount++
      console.log(`✅ ${parent.name} (${parent.children.length} hijos)`)

      // Upsert subcategorías
      for (const child of parent.children) {
        await prisma.category.upsert({
          where: { empresaId_code: { empresaId, code: child.code } },
          update: {
            name: child.name,
            parentId: parentCat.id,
            defaultMargin: parent.margin,
            isActive: true,
          },
          create: {
            code: child.code,
            name: child.name,
            parentId: parentCat.id,
            defaultMargin: parent.margin,
            isActive: true,
            empresaId,
          },
        })
        childCount++
      }
    }

    console.log('\n' + '═'.repeat(50))
    console.log(`✅ Categories seed completed!`)
    console.log(`   📂 Padres: ${parentCount}`)
    console.log(`   📁 Hijos: ${childCount}`)
    console.log(`   📊 Total: ${parentCount + childCount}`)
    console.log('═'.repeat(50))
  } catch (error) {
    console.error('❌ Error seeding categories:', error)
    throw error
  }
}

export default seedCategories
