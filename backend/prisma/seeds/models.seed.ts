import type { PrismaClient } from '../../src/generated/prisma/client.js'

// ─── Tipos internos ────────────────────────────────────────────────
interface ModelSeed {
  name: string
  yearStart: number | null
  yearEnd: number | null // null = en producción
  segment: string
  engine: string
  fuelType: 'Diesel' | 'GNC' | 'Eléctrico' | 'Diesel/GNC'
  family: string
  aliases?: string[] // nombres alternativos que el usuario podría usar
}

// ─── Base de datos normalizada de modelos IVECO ────────────────────
const IVECO_MODELS: ModelSeed[] = [
  // ════════════════════════════════════════════════════════════════
  // DAILY
  // ════════════════════════════════════════════════════════════════
  {
    name: 'Daily I',
    yearStart: 1978,
    yearEnd: 1990,
    segment: 'LCV',
    engine: 'Sofim 8140',
    fuelType: 'Diesel',
    family: 'Daily',
    aliases: ['Daily E-I', 'Daily EI', 'Daily Euro I'],
  },
  {
    name: 'Daily II',
    yearStart: 1990,
    yearEnd: 2000,
    segment: 'LCV',
    engine: 'Sofim 8140.x7',
    fuelType: 'Diesel',
    family: 'Daily',
    aliases: ['Daily E-II', 'Daily EII', 'Daily Euro II'],
  },
  {
    name: 'Daily III',
    yearStart: 2000,
    yearEnd: 2006,
    segment: 'LCV',
    engine: 'F1A 2.3L / F1C 3.0L',
    fuelType: 'Diesel',
    family: 'Daily',
  },
  {
    name: 'Daily IV',
    yearStart: 2006,
    yearEnd: 2011,
    segment: 'LCV',
    engine: 'F1A 2.3L / F1C 3.0L',
    fuelType: 'Diesel',
    family: 'Daily',
  },
  {
    name: 'Daily V',
    yearStart: 2011,
    yearEnd: 2014,
    segment: 'LCV',
    engine: 'F1A 2.3L / F1C 3.0L',
    fuelType: 'Diesel',
    family: 'Daily',
  },
  {
    name: 'Daily VI',
    yearStart: 2014,
    yearEnd: 2019,
    segment: 'LCV',
    engine: 'F1A 2.3L / F1C 3.0L HI-SCR',
    fuelType: 'Diesel',
    family: 'Daily',
  },
  {
    name: 'Daily VII',
    yearStart: 2019,
    yearEnd: null,
    segment: 'LCV',
    engine: 'F1A 2.3L / F1C 3.0L',
    fuelType: 'Diesel',
    family: 'Daily',
  },

  // Daily - Variantes por peso/motor (Serie II)
  {
    name: 'Daily 35C13',
    yearStart: 2000,
    yearEnd: 2006,
    segment: 'LCV',
    engine: 'F1A 2.3L',
    fuelType: 'Diesel',
    family: 'Daily',
  },
  {
    name: 'Daily 40-10',
    yearStart: 1990,
    yearEnd: 2000,
    segment: 'LCV',
    engine: 'Sofim 8140.27 2.5L',
    fuelType: 'Diesel',
    family: 'Daily',
    aliases: [
      'Daily 40.10 WM',
      'Daily 40-10 EI',
      'Daily 40-10 EII',
      'Daily 40-10 Euro II',
    ],
  },
  {
    name: 'Daily 40.12',
    yearStart: 1996,
    yearEnd: 2000,
    segment: 'LCV',
    engine: 'Sofim 8140.43 2.8L',
    fuelType: 'Diesel',
    family: 'Daily',
    aliases: ['40-12'],
  },
  {
    name: 'Daily 49-10',
    yearStart: 1990,
    yearEnd: 2000,
    segment: 'LCV',
    engine: 'Sofim 8140.27 2.5L',
    fuelType: 'Diesel',
    family: 'Daily',
    aliases: ['Daily 49.10', '49.10'],
  },
  {
    name: 'Daily 49.12',
    yearStart: 1996,
    yearEnd: 2000,
    segment: 'LCV',
    engine: 'Sofim 8140.43 2.8L',
    fuelType: 'Diesel',
    family: 'Daily',
  },
  {
    name: 'Daily 59-12',
    yearStart: 1990,
    yearEnd: 2000,
    segment: 'LCV',
    engine: 'Sofim 8140.43 2.8L',
    fuelType: 'Diesel',
    family: 'Daily',
    aliases: [
      'Daily 59.12',
      'Daily 59-12 Euro I',
      'Daily 59-12 Euro II',
      '59-12',
    ],
  },
  {
    name: 'Daily 60-12',
    yearStart: 1990,
    yearEnd: 2000,
    segment: 'LCV',
    engine: 'Sofim 8140.43 2.8L',
    fuelType: 'Diesel',
    family: 'Daily',
    aliases: ['Daily 60.12', '60-12'],
  },
  {
    name: 'Daily 70-12',
    yearStart: 1996,
    yearEnd: 2000,
    segment: 'LCV',
    engine: 'Sofim 8140.43 2.8L',
    fuelType: 'Diesel',
    family: 'Daily',
    aliases: ['Daily 70.12'],
  },
  {
    name: 'Daily 70C16',
    yearStart: 2006,
    yearEnd: 2014,
    segment: 'LCV',
    engine: 'F1C 3.0L 160hp',
    fuelType: 'Diesel',
    family: 'Daily',
  },

  // Daily - Variantes especiales
  {
    name: 'Daily 4x4',
    yearStart: 2000,
    yearEnd: null,
    segment: 'LCV',
    engine: 'F1C 3.0L',
    fuelType: 'Diesel',
    family: 'Daily',
  },
  {
    name: 'Daily Furgón',
    yearStart: 1990,
    yearEnd: null,
    segment: 'LCV',
    engine: 'Varios',
    fuelType: 'Diesel',
    family: 'Daily',
    aliases: ['Daily Van'],
  },
  {
    name: 'Daily GNC',
    yearStart: 2006,
    yearEnd: null,
    segment: 'LCV',
    engine: 'F1C 3.0L CNG',
    fuelType: 'GNC',
    family: 'Daily',
    aliases: ['Daily Natural Power'],
  },
  {
    name: 'Daily Mercosur',
    yearStart: 2000,
    yearEnd: 2006,
    segment: 'LCV',
    engine: 'F1A 2.3L',
    fuelType: 'Diesel',
    family: 'Daily',
  },
  {
    name: 'Daily Scudato 70C16',
    yearStart: 2007,
    yearEnd: 2014,
    segment: 'LCV',
    engine: 'F1C 3.0L',
    fuelType: 'Diesel',
    family: 'Daily',
    aliases: ['Scudato', 'Scudato 70C16'],
  },
  {
    name: 'Daily Minibus',
    yearStart: 2000,
    yearEnd: null,
    segment: 'LCV',
    engine: 'F1C 3.0L',
    fuelType: 'Diesel',
    family: 'Daily',
  },
  {
    name: 'Daily Blue Power',
    yearStart: 2019,
    yearEnd: null,
    segment: 'LCV',
    engine: 'F1A/F1C',
    fuelType: 'Diesel',
    family: 'Daily',
  },
  {
    name: 'eDaily',
    yearStart: 2023,
    yearEnd: null,
    segment: 'LCV',
    engine: 'Eléctrico',
    fuelType: 'Eléctrico',
    family: 'Daily',
  },

  // ════════════════════════════════════════════════════════════════
  // ZETA / TURBOZETA
  // ════════════════════════════════════════════════════════════════
  {
    name: 'Zeta',
    yearStart: 1977,
    yearEnd: 1991,
    segment: 'Mediano',
    engine: 'Sofim 8060',
    fuelType: 'Diesel',
    family: 'Zeta',
  },
  {
    name: 'TurboZeta',
    yearStart: 1985,
    yearEnd: 1995,
    segment: 'Mediano',
    engine: 'Sofim 8060 Turbo',
    fuelType: 'Diesel',
    family: 'Zeta',
  },
  {
    name: 'TurboZeta 135',
    yearStart: 1985,
    yearEnd: 1995,
    segment: 'Mediano',
    engine: '8060.25 5.9L',
    fuelType: 'Diesel',
    family: 'Zeta',
    aliases: ['135-17'],
  },
  {
    name: 'TurboZeta 175',
    yearStart: 1985,
    yearEnd: 1995,
    segment: 'Mediano',
    engine: '8060.25 5.9L',
    fuelType: 'Diesel',
    family: 'Zeta',
    aliases: ['175', '175-24'],
  },

  // ════════════════════════════════════════════════════════════════
  // TURBOCARGO
  // ════════════════════════════════════════════════════════════════
  {
    name: 'TurboCargo',
    yearStart: 1985,
    yearEnd: 1992,
    segment: 'Mediano',
    engine: '8060 Turbo',
    fuelType: 'Diesel',
    family: 'TurboCargo',
  },

  // ════════════════════════════════════════════════════════════════
  // EUROCARGO
  // ════════════════════════════════════════════════════════════════
  {
    name: 'Eurocargo',
    yearStart: 1991,
    yearEnd: null,
    segment: 'Mediano',
    engine: 'Tector',
    fuelType: 'Diesel',
    family: 'Eurocargo',
  },
  {
    name: 'Eurocargo 100E18',
    yearStart: 1991,
    yearEnd: 2008,
    segment: 'Mediano',
    engine: 'Tector 4 cil 3.9L',
    fuelType: 'Diesel',
    family: 'Eurocargo',
    aliases: [
      'Eurocargo 100E18H',
      'Eurocargo 100',
      '100E18',
      '100E18H',
      '100E21',
    ],
  },
  {
    name: 'Eurocargo 115',
    yearStart: 2003,
    yearEnd: 2015,
    segment: 'Mediano',
    engine: 'Tector 4 cil 3.9L',
    fuelType: 'Diesel',
    family: 'Eurocargo',
  },
  {
    name: 'Eurocargo 120E18',
    yearStart: 1991,
    yearEnd: 2008,
    segment: 'Mediano',
    engine: 'Tector 6 cil 5.9L',
    fuelType: 'Diesel',
    family: 'Eurocargo',
    aliases: [
      'Eurocargo 120E18H',
      'Eurocargo 120',
      '120E18',
      '120E18H',
      '120E21',
    ],
  },
  {
    name: 'Eurocargo 130E18',
    yearStart: 1991,
    yearEnd: 2003,
    segment: 'Mediano',
    engine: 'Tector 4 cil',
    fuelType: 'Diesel',
    family: 'Eurocargo',
    aliases: ['130E18'],
  },
  {
    name: 'Eurocargo 135-17',
    yearStart: 1991,
    yearEnd: 2003,
    segment: 'Mediano',
    engine: '8060.45 5.9L',
    fuelType: 'Diesel',
    family: 'Eurocargo',
  },
  {
    name: 'Eurocargo 150E18',
    yearStart: 1991,
    yearEnd: 2008,
    segment: 'Mediano',
    engine: 'Tector 6 cil 5.9L',
    fuelType: 'Diesel',
    family: 'Eurocargo',
    aliases: [
      'Eurocargo 150E18H',
      'Eurocargo 150',
      'Eurocargo 150E',
      '150E18',
      '150E18H',
    ],
  },
  {
    name: 'Eurocargo 150E21',
    yearStart: 2003,
    yearEnd: 2015,
    segment: 'Mediano',
    engine: 'Tector 6 cil 5.9L',
    fuelType: 'Diesel',
    family: 'Eurocargo',
    aliases: ['Eurocargo 150E21H', '150E21', '150E21H'],
  },
  {
    name: 'Eurocargo 170E22',
    yearStart: 2003,
    yearEnd: 2015,
    segment: 'Mediano',
    engine: 'Tector 6 cil 5.9L',
    fuelType: 'Diesel',
    family: 'Eurocargo',
  },
  {
    name: 'Eurocargo 440E37H',
    yearStart: 2002,
    yearEnd: 2012,
    segment: 'Mediano',
    engine: 'Cursor 13',
    fuelType: 'Diesel',
    family: 'Eurocargo',
  },
  {
    name: 'Eurocargo ML100E18',
    yearStart: 1991,
    yearEnd: 2008,
    segment: 'Mediano',
    engine: 'Tector 4 cil',
    fuelType: 'Diesel',
    family: 'Eurocargo',
  },
  {
    name: 'Eurocargo 4x4',
    yearStart: 2003,
    yearEnd: null,
    segment: 'Mediano',
    engine: 'Tector 6 cil',
    fuelType: 'Diesel',
    family: 'Eurocargo',
  },
  {
    name: 'Eurocargo GNC',
    yearStart: 2008,
    yearEnd: null,
    segment: 'Mediano',
    engine: 'Tector CNG',
    fuelType: 'GNC',
    family: 'Eurocargo',
    aliases: ['Eurocargo Natural Power'],
  },
  {
    name: 'Eurocargo Cargo',
    yearStart: 2003,
    yearEnd: 2015,
    segment: 'Mediano',
    engine: 'Tector',
    fuelType: 'Diesel',
    family: 'Eurocargo',
  },
  {
    name: 'Eurocargo Tech',
    yearStart: 2008,
    yearEnd: null,
    segment: 'Mediano',
    engine: 'Tector 6 cil',
    fuelType: 'Diesel',
    family: 'Eurocargo',
  },
  {
    name: 'Eurocargo Tector',
    yearStart: 2008,
    yearEnd: null,
    segment: 'Mediano',
    engine: 'Tector 6 cil',
    fuelType: 'Diesel',
    family: 'Eurocargo',
    aliases: ['Eurocargo Tector 170E22'],
  },

  // ════════════════════════════════════════════════════════════════
  // TECTOR (línea independiente LATAM)
  // ════════════════════════════════════════════════════════════════
  {
    name: 'Tector',
    yearStart: 2008,
    yearEnd: null,
    segment: 'Mediano',
    engine: 'FPT NEF',
    fuelType: 'Diesel',
    family: 'Tector',
  },
  {
    name: 'Tector 150',
    yearStart: 2012,
    yearEnd: null,
    segment: 'Mediano',
    engine: 'FPT NEF 4 cil 3.9L',
    fuelType: 'Diesel',
    family: 'Tector',
  },
  {
    name: 'Tector 170',
    yearStart: 2008,
    yearEnd: null,
    segment: 'Mediano',
    engine: 'FPT NEF 6 cil 5.9L',
    fuelType: 'Diesel',
    family: 'Tector',
    aliases: ['Tector 170E22'],
  },
  {
    name: 'Tector L70E22',
    yearStart: 2012,
    yearEnd: null,
    segment: 'Mediano',
    engine: 'FPT NEF 6 cil 5.9L',
    fuelType: 'Diesel',
    family: 'Tector',
  },
  {
    name: 'Tector Attack',
    yearStart: 2018,
    yearEnd: null,
    segment: 'Mediano',
    engine: 'FPT NEF',
    fuelType: 'Diesel',
    family: 'Tector',
  },

  // ════════════════════════════════════════════════════════════════
  // VERTIS
  // ════════════════════════════════════════════════════════════════
  {
    name: 'Vertis',
    yearStart: 2012,
    yearEnd: null,
    segment: 'Mediano',
    engine: 'FPT NEF',
    fuelType: 'Diesel',
    family: 'Vertis',
  },
  {
    name: 'Vertis 90V16',
    yearStart: 2012,
    yearEnd: null,
    segment: 'Mediano',
    engine: 'FPT NEF 4 cil 3.9L',
    fuelType: 'Diesel',
    family: 'Vertis',
  },
  {
    name: 'Vertis 130V18',
    yearStart: 2012,
    yearEnd: null,
    segment: 'Mediano',
    engine: 'FPT NEF 4 cil 3.9L',
    fuelType: 'Diesel',
    family: 'Vertis',
  },
  {
    name: 'Vertis 260V28',
    yearStart: 2015,
    yearEnd: null,
    segment: 'Mediano',
    engine: 'FPT NEF',
    fuelType: 'Diesel',
    family: 'Vertis',
  },

  // ════════════════════════════════════════════════════════════════
  // EUROTECH / TURBOTECH
  // ════════════════════════════════════════════════════════════════
  {
    name: 'TurboTech',
    yearStart: 1992,
    yearEnd: 1998,
    segment: 'Pesado',
    engine: '8210 Turbo',
    fuelType: 'Diesel',
    family: 'EuroTech',
  },
  {
    name: 'EuroTech',
    yearStart: 1992,
    yearEnd: 2000,
    segment: 'Pesado',
    engine: 'Cursor 8 7.8L',
    fuelType: 'Diesel',
    family: 'EuroTech',
    aliases: ['Eurotech'],
  },
  {
    name: 'EuroTech 2',
    yearStart: 2000,
    yearEnd: 2004,
    segment: 'Pesado',
    engine: 'Cursor 8/10',
    fuelType: 'Diesel',
    family: 'EuroTech',
  },
  {
    name: 'EuroTech 400',
    yearStart: 1992,
    yearEnd: 2004,
    segment: 'Pesado',
    engine: 'Cursor 10 9.5L',
    fuelType: 'Diesel',
    family: 'EuroTech',
  },
  {
    name: 'EuroTech 440',
    yearStart: 1992,
    yearEnd: 2004,
    segment: 'Pesado',
    engine: 'Cursor 13 12.9L',
    fuelType: 'Diesel',
    family: 'EuroTech',
  },

  // ════════════════════════════════════════════════════════════════
  // EUROSTAR / TURBOSTAR
  // ════════════════════════════════════════════════════════════════
  {
    name: 'TurboStar',
    yearStart: 1984,
    yearEnd: 1993,
    segment: 'Pesado Ruta',
    engine: '8210/8280',
    fuelType: 'Diesel',
    family: 'EuroStar',
  },
  {
    name: 'TurboStar 190',
    yearStart: 1984,
    yearEnd: 1993,
    segment: 'Pesado Ruta',
    engine: '8210 6 cil',
    fuelType: 'Diesel',
    family: 'EuroStar',
  },
  {
    name: 'TurboStar 360',
    yearStart: 1984,
    yearEnd: 1993,
    segment: 'Pesado Ruta',
    engine: '8280 V8 17.2L',
    fuelType: 'Diesel',
    family: 'EuroStar',
  },
  {
    name: 'EuroStar',
    yearStart: 1993,
    yearEnd: 2002,
    segment: 'Pesado Ruta',
    engine: 'Cursor 13 12.9L',
    fuelType: 'Diesel',
    family: 'EuroStar',
  },

  // ════════════════════════════════════════════════════════════════
  // STRALIS
  // ════════════════════════════════════════════════════════════════
  {
    name: 'Stralis',
    yearStart: 2002,
    yearEnd: 2019,
    segment: 'Pesado Ruta',
    engine: 'Cursor 8/10/13',
    fuelType: 'Diesel',
    family: 'Stralis',
  },
  {
    name: 'Stralis 190',
    yearStart: 2002,
    yearEnd: 2019,
    segment: 'Pesado Ruta',
    engine: 'Cursor 8 7.8L',
    fuelType: 'Diesel',
    family: 'Stralis',
  },
  {
    name: 'Stralis 330',
    yearStart: 2002,
    yearEnd: 2019,
    segment: 'Pesado Ruta',
    engine: 'Cursor 10 9.5L',
    fuelType: 'Diesel',
    family: 'Stralis',
    aliases: ['330-30', '330-25', '330.30'],
  },
  {
    name: 'Stralis 380',
    yearStart: 2002,
    yearEnd: 2019,
    segment: 'Pesado Ruta',
    engine: 'Cursor 10 9.5L',
    fuelType: 'Diesel',
    family: 'Stralis',
  },
  {
    name: 'Stralis 450',
    yearStart: 2007,
    yearEnd: 2019,
    segment: 'Pesado Ruta',
    engine: 'Cursor 10/13',
    fuelType: 'Diesel',
    family: 'Stralis',
  },
  {
    name: 'Stralis AD/AT',
    yearStart: 2002,
    yearEnd: 2019,
    segment: 'Pesado Ruta',
    engine: 'Cursor 8/10/13',
    fuelType: 'Diesel',
    family: 'Stralis',
  },
  {
    name: 'Stralis AS440',
    yearStart: 2002,
    yearEnd: 2019,
    segment: 'Pesado Ruta',
    engine: 'Cursor 13 12.9L',
    fuelType: 'Diesel',
    family: 'Stralis',
  },
  {
    name: 'Stralis Hi-Road',
    yearStart: 2012,
    yearEnd: 2019,
    segment: 'Pesado Ruta',
    engine: 'Cursor 8/10/13',
    fuelType: 'Diesel',
    family: 'Stralis',
  },
  {
    name: 'Stralis Hi-Way',
    yearStart: 2012,
    yearEnd: 2019,
    segment: 'Pesado Ruta',
    engine: 'Cursor 8/10/13',
    fuelType: 'Diesel',
    family: 'Stralis',
  },
  {
    name: 'Stralis GNC',
    yearStart: 2012,
    yearEnd: 2019,
    segment: 'Pesado Ruta',
    engine: 'Cursor 8 CNG/LNG',
    fuelType: 'GNC',
    family: 'Stralis',
    aliases: ['Stralis Natural Power'],
  },
  {
    name: 'Stralis Power',
    yearStart: 2007,
    yearEnd: 2019,
    segment: 'Pesado Ruta',
    engine: 'Cursor 13',
    fuelType: 'Diesel',
    family: 'Stralis',
    aliases: ['Stralis PowerStar'],
  },
  {
    name: 'Stralis Tech',
    yearStart: 2007,
    yearEnd: 2019,
    segment: 'Pesado Ruta',
    engine: 'Cursor 8/10',
    fuelType: 'Diesel',
    family: 'Stralis',
  },
  {
    name: 'Stralis X-Way',
    yearStart: 2017,
    yearEnd: 2019,
    segment: 'Pesado Mixto',
    engine: 'Cursor 8/10/13',
    fuelType: 'Diesel',
    family: 'Stralis',
  },

  // ════════════════════════════════════════════════════════════════
  // S-WAY
  // ════════════════════════════════════════════════════════════════
  {
    name: 'S-Way',
    yearStart: 2019,
    yearEnd: null,
    segment: 'Pesado Ruta',
    engine: 'Cursor 11/13',
    fuelType: 'Diesel',
    family: 'S-Way',
  },
  {
    name: 'S-Way NP',
    yearStart: 2019,
    yearEnd: null,
    segment: 'Pesado Ruta',
    engine: 'Cursor 13 LNG/CNG',
    fuelType: 'GNC',
    family: 'S-Way',
  },
  {
    name: 'S-eWay',
    yearStart: 2023,
    yearEnd: null,
    segment: 'Pesado Ruta',
    engine: 'Eléctrico',
    fuelType: 'Eléctrico',
    family: 'S-Way',
  },

  // ════════════════════════════════════════════════════════════════
  // TRAKKER / EUROTRAKKER
  // ════════════════════════════════════════════════════════════════
  {
    name: 'EuroTrakker',
    yearStart: 1993,
    yearEnd: 2004,
    segment: 'Pesado Obra',
    engine: 'Cursor 8/10/13',
    fuelType: 'Diesel',
    family: 'Trakker',
    aliases: ['Eurotrakker', 'EuroTrakker 330'],
  },
  {
    name: 'Trakker',
    yearStart: 2004,
    yearEnd: 2019,
    segment: 'Pesado Obra',
    engine: 'Cursor 8/10/13',
    fuelType: 'Diesel',
    family: 'Trakker',
  },
  {
    name: 'Trakker 330',
    yearStart: 2004,
    yearEnd: 2019,
    segment: 'Pesado Obra',
    engine: 'Cursor 10',
    fuelType: 'Diesel',
    family: 'Trakker',
  },
  {
    name: 'Trakker 4x2',
    yearStart: 2004,
    yearEnd: 2019,
    segment: 'Pesado Obra',
    engine: 'Cursor 8/10',
    fuelType: 'Diesel',
    family: 'Trakker',
  },
  {
    name: 'Trakker 720',
    yearStart: 2004,
    yearEnd: 2019,
    segment: 'Pesado Obra',
    engine: 'Cursor 13',
    fuelType: 'Diesel',
    family: 'Trakker',
  },
  {
    name: 'Trakker 740',
    yearStart: 2004,
    yearEnd: 2019,
    segment: 'Pesado Obra',
    engine: 'Cursor 13',
    fuelType: 'Diesel',
    family: 'Trakker',
    aliases: ['740'],
  },
  {
    name: 'Trakker AD/AT',
    yearStart: 2004,
    yearEnd: 2019,
    segment: 'Pesado Obra',
    engine: 'Cursor 8/10/13',
    fuelType: 'Diesel',
    family: 'Trakker',
  },
  {
    name: 'Trakker Power',
    yearStart: 2012,
    yearEnd: 2019,
    segment: 'Pesado Obra',
    engine: 'Cursor 13',
    fuelType: 'Diesel',
    family: 'Trakker',
  },
  {
    name: 'Trakker Tech',
    yearStart: 2012,
    yearEnd: 2019,
    segment: 'Pesado Obra',
    engine: 'Cursor 8/10',
    fuelType: 'Diesel',
    family: 'Trakker',
  },

  // ════════════════════════════════════════════════════════════════
  // T-WAY
  // ════════════════════════════════════════════════════════════════
  {
    name: 'T-Way',
    yearStart: 2019,
    yearEnd: null,
    segment: 'Pesado Obra',
    engine: 'Cursor 11/13',
    fuelType: 'Diesel',
    family: 'T-Way',
  },

  // ════════════════════════════════════════════════════════════════
  // X-WAY
  // ════════════════════════════════════════════════════════════════
  {
    name: 'X-Way',
    yearStart: 2018,
    yearEnd: null,
    segment: 'Pesado Mixto',
    engine: 'Cursor 11/13',
    fuelType: 'Diesel',
    family: 'X-Way',
  },

  // ════════════════════════════════════════════════════════════════
  // POWERSTAR / CAVALLINO
  // ════════════════════════════════════════════════════════════════
  {
    name: 'Powerstar',
    yearStart: 2006,
    yearEnd: 2019,
    segment: 'Pesado Ruta',
    engine: 'Cursor 13 12.9L',
    fuelType: 'Diesel',
    family: 'Powerstar',
  },
  {
    name: 'Cavallino',
    yearStart: 1997,
    yearEnd: 2004,
    segment: 'Pesado Ruta',
    engine: 'Cursor 8/13',
    fuelType: 'Diesel',
    family: 'Cavallino',
  },

  // ════════════════════════════════════════════════════════════════
  // CURSOR (Motores — no son camiones)
  // ════════════════════════════════════════════════════════════════
  {
    name: 'Cursor 8',
    yearStart: 2000,
    yearEnd: null,
    segment: 'Motor',
    engine: 'F2C/F2B 7.8L 6 cil',
    fuelType: 'Diesel',
    family: 'Cursor',
  },
  {
    name: 'Cursor 10',
    yearStart: 2000,
    yearEnd: null,
    segment: 'Motor',
    engine: 'F2C 9.5L 6 cil',
    fuelType: 'Diesel',
    family: 'Cursor',
  },
  {
    name: 'Cursor 11',
    yearStart: 2012,
    yearEnd: null,
    segment: 'Motor',
    engine: '11.1L 6 cil',
    fuelType: 'Diesel',
    family: 'Cursor',
  },
  {
    name: 'Cursor 13',
    yearStart: 2000,
    yearEnd: null,
    segment: 'Motor',
    engine: 'F3B 12.9L 6 cil',
    fuelType: 'Diesel',
    family: 'Cursor',
  },
  {
    name: 'Cursor 16',
    yearStart: 2019,
    yearEnd: null,
    segment: 'Motor',
    engine: '15.9L 6 cil',
    fuelType: 'Diesel',
    family: 'Cursor',
  },

  // ════════════════════════════════════════════════════════════════
  // BUSES
  // ════════════════════════════════════════════════════════════════
  {
    name: 'Eurorider',
    yearStart: 1995,
    yearEnd: 2010,
    segment: 'Bus',
    engine: 'Cursor 10',
    fuelType: 'Diesel',
    family: 'Buses',
  },
  {
    name: 'Crossway',
    yearStart: 2006,
    yearEnd: null,
    segment: 'Bus',
    engine: 'Cursor 9',
    fuelType: 'Diesel',
    family: 'Buses',
  },
  {
    name: 'Urbanway',
    yearStart: 2013,
    yearEnd: null,
    segment: 'Bus',
    engine: 'Cursor 9 / CNG',
    fuelType: 'Diesel/GNC',
    family: 'Buses',
  },
  {
    name: 'Magelys',
    yearStart: 2012,
    yearEnd: null,
    segment: 'Bus',
    engine: 'Cursor 9',
    fuelType: 'Diesel',
    family: 'Buses',
  },

  // ════════════════════════════════════════════════════════════════
  // MARCAS HISTÓRICAS
  // ════════════════════════════════════════════════════════════════
  {
    name: 'Magirus',
    yearStart: 1864,
    yearEnd: 1980,
    segment: 'Histórico',
    engine: 'Deutz air-cooled',
    fuelType: 'Diesel',
    family: 'Históricos',
  },
  {
    name: 'Magirus-Deutz',
    yearStart: 1936,
    yearEnd: 1980,
    segment: 'Histórico',
    engine: 'Deutz air-cooled',
    fuelType: 'Diesel',
    family: 'Históricos',
  },
  {
    name: 'Pegaso',
    yearStart: 1946,
    yearEnd: 1994,
    segment: 'Histórico',
    engine: 'Varios',
    fuelType: 'Diesel',
    family: 'Históricos',
  },
  {
    name: 'Pegaso 1089',
    yearStart: 1970,
    yearEnd: 1990,
    segment: 'Histórico',
    engine: 'Pegaso 9200',
    fuelType: 'Diesel',
    family: 'Históricos',
  },
  {
    name: 'Pegaso 1217',
    yearStart: 1970,
    yearEnd: 1990,
    segment: 'Histórico',
    engine: 'Pegaso 9200',
    fuelType: 'Diesel',
    family: 'Históricos',
  },

  // ════════════════════════════════════════════════════════════════
  // MODELOS NUMÉRICOS LEGACY (referencias que apuntan a modelos reales)
  // ════════════════════════════════════════════════════════════════
  {
    name: '65-9',
    yearStart: 1985,
    yearEnd: 1992,
    segment: 'Mediano',
    engine: '8060',
    fuelType: 'Diesel',
    family: 'Zeta',
    aliases: ['65.9'],
  },
  {
    name: '90.17',
    yearStart: 1985,
    yearEnd: 1992,
    segment: 'Mediano',
    engine: '8060',
    fuelType: 'Diesel',
    family: 'Zeta',
  },
  {
    name: '170',
    yearStart: 2003,
    yearEnd: 2015,
    segment: 'Mediano',
    engine: 'Tector',
    fuelType: 'Diesel',
    family: 'Eurocargo',
  },
  {
    name: '135',
    yearStart: 1991,
    yearEnd: 2003,
    segment: 'Mediano',
    engine: '8060',
    fuelType: 'Diesel',
    family: 'Eurocargo',
    aliases: ['135-17', '135.17'],
  },
]

// ─── Generador de código normalizado ───────────────────────────────
function generateCode(name: string): string {
  return `IVC-${name
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 20)
    .toUpperCase()}`
}

// ─── Mapeo de segmento a categoría legible ─────────────────────────
function getCategory(segment: string): string {
  const map: Record<string, string> = {
    LCV: 'Vehículo Comercial Ligero',
    Mediano: 'Camión Mediano',
    Pesado: 'Camión Pesado',
    'Pesado Ruta': 'Camión Pesado - Ruta',
    'Pesado Obra': 'Camión Pesado - Obra',
    'Pesado Mixto': 'Camión Pesado - Mixto',
    Motor: 'Motor / Línea de Motorización',
    Bus: 'Bus / Transporte de Pasajeros',
    Histórico: 'Marca Histórica',
  }
  return map[segment] || segment
}

// ─── Seed principal ────────────────────────────────────────────────
async function seedModels(prisma: PrismaClient, empresaId: string) {
  try {
    console.log('🌱 Starting IVECO models seed...\n')

    // 1. Buscar marca IVECO
    const brand = await prisma.brand.findFirst({
      where: { empresaId, code: 'IVC' },
    })

    if (!brand) {
      console.error(
        '❌ Marca IVC no encontrada. Ejecuta el seed de marcas primero.'
      )
      return
    }

    const brandId = brand.id
    let created = 0
    let updated = 0
    let aliasesCreated = 0

    // 2. Insertar modelos principales
    for (const model of IVECO_MODELS) {
      const code = generateCode(model.name)
      const yearDisplay = model.yearEnd
        ? `${model.yearStart}–${model.yearEnd}`
        : `${model.yearStart}–presente`

      const data = {
        empresaId,
        brandId,
        code,
        name: model.name,
        year: model.yearStart,
        type:
          model.segment === 'Motor'
            ? ('GENERIC' as const)
            : ('VEHICLE' as const),
        description: `${getCategory(model.segment)} | ${model.family} | ${yearDisplay}`,
        specifications: {
          manufacturer: 'IVECO',
          family: model.family,
          segment: model.segment,
          category: getCategory(model.segment),
          engine: model.engine,
          fuelType: model.fuelType,
          yearStart: model.yearStart,
          yearEnd: model.yearEnd,
          yearRange: yearDisplay,
          aliases: model.aliases || [],
        },
        isActive: true,
      }

      const existing = await prisma.model.findFirst({
        where: {
          empresaId,
          brandId,
          code,
          name: model.name,
          year: model.yearStart,
          type: data.type,
        },
      })

      if (existing) {
        await prisma.model.update({
          where: { id: existing.id },
          data: {
            description: data.description,
            specifications: data.specifications,
            isActive: true,
          },
        })
        updated++
      } else {
        await prisma.model.create({ data })
        created++
      }

      console.log(
        `${existing ? '🔄' : '✅'} ${model.family.padEnd(14)} → ${model.name}`
      )

      // 3. Crear alias como modelos que referencian al principal
      if (model.aliases?.length) {
        for (const alias of model.aliases) {
          const aliasCode = generateCode(alias)

          const existingAlias = await prisma.model.findFirst({
            where: {
              empresaId,
              brandId,
              code: aliasCode,
              name: alias,
              year: model.yearStart,
              type: data.type,
            },
          })

          if (!existingAlias) {
            await prisma.model.create({
              data: {
                empresaId,
                brandId,
                code: aliasCode,
                name: alias,
                year: model.yearStart,
                type: data.type,
                description: `Alias de ${model.name} | ${yearDisplay}`,
                specifications: {
                  ...data.specifications,
                  isAlias: true,
                  canonicalName: model.name,
                  canonicalCode: code,
                },
                isActive: true,
              },
            })
            aliasesCreated++
            console.log(`   ↳ alias: ${alias}`)
          }
        }
      }
    }

    console.log('\n' + '═'.repeat(50))
    console.log(`✅ Models seed completed!`)
    console.log(`   📦 Creados: ${created}`)
    console.log(`   🔄 Actualizados: ${updated}`)
    console.log(`   🔗 Aliases creados: ${aliasesCreated}`)
    console.log(
      `   📊 Total modelos en DB: ${created + updated + aliasesCreated}`
    )
    console.log('═'.repeat(50))
  } catch (error) {
    console.error('❌ Error seeding models:', error)
    throw error
  }
}

export default seedModels
