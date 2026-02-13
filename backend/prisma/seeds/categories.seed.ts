import 'dotenv/config'
import { PrismaClient } from '../../src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined')
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function seedCategories() {
  try {
    console.log('🌱 Starting categories seed...\n')
    
    // Crear categorías raíz (sin padre)
    const electronics = await prisma.category.upsert({
      where: { code: 'ELEC' },
      update: {
        name: 'Electrónica',
        description: 'Productos electrónicos y accesorios',
        defaultMargin: 25.0,
        isActive: true,
      },
      create: {
        code: 'ELEC',
        name: 'Electrónica',
        description: 'Productos electrónicos y accesorios',
        defaultMargin: 25.0,
        isActive: true,
      },
    })
    console.log(`✅ Category upserted: ${electronics.name}`)

    const clothing = await prisma.category.upsert({
      where: { code: 'ROPA' },
      update: {
        name: 'Ropa',
        description: 'Prendas de vestir',
        defaultMargin: 40.0,
        isActive: true,
      },
      create: {
        code: 'ROPA',
        name: 'Ropa',
        description: 'Prendas de vestir',
        defaultMargin: 40.0,
        isActive: true,
      },
    })
    console.log(`✅ Category upserted: ${clothing.name}`)

    const furniture = await prisma.category.upsert({
      where: { code: 'MUEBL' },
      update: {
        name: 'Muebles',
        description: 'Muebles para hogar y oficina',
        defaultMargin: 35.0,
        isActive: true,
      },
      create: {
        code: 'MUEBL',
        name: 'Muebles',
        description: 'Muebles para hogar y oficina',
        defaultMargin: 35.0,
        isActive: true,
      },
    })
    console.log(`✅ Category upserted: ${furniture.name}`)

    const sports = await prisma.category.upsert({
      where: { code: 'DEPO' },
      update: {
        name: 'Deportes',
        description: 'Artículos deportivos',
        defaultMargin: 30.0,
        isActive: true,
      },
      create: {
        code: 'DEPO',
        name: 'Deportes',
        description: 'Artículos deportivos',
        defaultMargin: 30.0,
        isActive: true,
      },
    })
    console.log(`✅ Category upserted: ${sports.name}`)

    // Subcategorías de Electrónica
    const computers = await prisma.category.upsert({
      where: { code: 'COMP' },
      update: {
        name: 'Computadoras',
        description: 'Computadoras y componentes',
        parentId: electronics.id,
        defaultMargin: 28.0,
        isActive: true,
      },
      create: {
        code: 'COMP',
        name: 'Computadoras',
        description: 'Computadoras y componentes',
        parentId: electronics.id,
        defaultMargin: 28.0,
        isActive: true,
      },
    })
    console.log(`✅ Subcategory upserted: ${computers.name}`)

    const phones = await prisma.category.upsert({
      where: { code: 'TELF' },
      update: {
        name: 'Teléfonos',
        description: 'Teléfonos móviles y accesorios',
        parentId: electronics.id,
        defaultMargin: 22.0,
        isActive: true,
      },
      create: {
        code: 'TELF',
        name: 'Teléfonos',
        description: 'Teléfonos móviles y accesorios',
        parentId: electronics.id,
        defaultMargin: 22.0,
        isActive: true,
      },
    })
    console.log(`✅ Subcategory upserted: ${phones.name}`)

    const audio = await prisma.category.upsert({
      where: { code: 'AUDIO' },
      update: {
        name: 'Audio',
        description: 'Equipos de audio y sonido',
        parentId: electronics.id,
        defaultMargin: 32.0,
        isActive: true,
      },
      create: {
        code: 'AUDIO',
        name: 'Audio',
        description: 'Equipos de audio y sonido',
        parentId: electronics.id,
        defaultMargin: 32.0,
        isActive: true,
      },
    })
    console.log(`✅ Subcategory upserted: ${audio.name}`)

    // Sub-subcategorías de Computadoras
    await prisma.category.upsert({
      where: { code: 'LAPTOP' },
      update: {
        name: 'Laptops',
        description: 'Computadoras portátiles',
        parentId: computers.id,
        defaultMargin: 20.0,
        isActive: true,
      },
      create: {
        code: 'LAPTOP',
        name: 'Laptops',
        description: 'Computadoras portátiles',
        parentId: computers.id,
        defaultMargin: 20.0,
        isActive: true,
      },
    })
    console.log(`✅ Sub-subcategory upserted: Laptops`)

    await prisma.category.upsert({
      where: { code: 'DESK' },
      update: {
        name: 'Desktops',
        description: 'Computadoras de escritorio',
        parentId: computers.id,
        defaultMargin: 25.0,
        isActive: true,
      },
      create: {
        code: 'DESK',
        name: 'Desktops',
        description: 'Computadoras de escritorio',
        parentId: computers.id,
        defaultMargin: 25.0,
        isActive: true,
      },
    })
    console.log(`✅ Sub-subcategory upserted: Desktops`)

    // Subcategorías de Ropa
    const menClothing = await prisma.category.upsert({
      where: { code: 'HOMBRE' },
      update: {
        name: 'Ropa Hombre',
        description: 'Ropa para hombres',
        parentId: clothing.id,
        defaultMargin: 38.0,
        isActive: true,
      },
      create: {
        code: 'HOMBRE',
        name: 'Ropa Hombre',
        description: 'Ropa para hombres',
        parentId: clothing.id,
        defaultMargin: 38.0,
        isActive: true,
      },
    })
    console.log(`✅ Subcategory upserted: ${menClothing.name}`)

    const womenClothing = await prisma.category.upsert({
      where: { code: 'MUJER' },
      update: {
        name: 'Ropa Mujer',
        description: 'Ropa para mujeres',
        parentId: clothing.id,
        defaultMargin: 42.0,
        isActive: true,
      },
      create: {
        code: 'MUJER',
        name: 'Ropa Mujer',
        description: 'Ropa para mujeres',
        parentId: clothing.id,
        defaultMargin: 42.0,
        isActive: true,
      },
    })
    console.log(`✅ Subcategory upserted: ${womenClothing.name}`)

    const kids = await prisma.category.upsert({
      where: { code: 'NIÑOS' },
      update: {
        name: 'Ropa Niños',
        description: 'Ropa para niños',
        parentId: clothing.id,
        defaultMargin: 40.0,
        isActive: true,
      },
      create: {
        code: 'NIÑOS',
        name: 'Ropa Niños',
        description: 'Ropa para niños',
        parentId: clothing.id,
        defaultMargin: 40.0,
        isActive: true,
      },
    })
    console.log(`✅ Subcategory upserted: ${kids.name}`)

    // Sub-subcategorías de Ropa Hombre
    await prisma.category.upsert({
      where: { code: 'CAMISAS' },
      update: {
        name: 'Camisas',
        description: 'Camisas para hombres',
        parentId: menClothing.id,
        defaultMargin: 35.0,
        isActive: true,
      },
      create: {
        code: 'CAMISAS',
        name: 'Camisas',
        description: 'Camisas para hombres',
        parentId: menClothing.id,
        defaultMargin: 35.0,
        isActive: true,
      },
    })
    console.log(`✅ Sub-subcategory upserted: Camisas`)

    await prisma.category.upsert({
      where: { code: 'PANTALONES' },
      update: {
        name: 'Pantalones',
        description: 'Pantalones para hombres',
        parentId: menClothing.id,
        defaultMargin: 40.0,
        isActive: true,
      },
      create: {
        code: 'PANTALONES',
        name: 'Pantalones',
        description: 'Pantalones para hombres',
        parentId: menClothing.id,
        defaultMargin: 40.0,
        isActive: true,
      },
    })
    console.log(`✅ Sub-subcategory upserted: Pantalones`)

    // Subcategorías de Muebles
    const furniture_home = await prisma.category.upsert({
      where: { code: 'MUE_CASA' },
      update: {
        name: 'Muebles para Casa',
        description: 'Muebles para el hogar',
        parentId: furniture.id,
        defaultMargin: 35.0,
        isActive: true,
      },
      create: {
        code: 'MUE_CASA',
        name: 'Muebles para Casa',
        description: 'Muebles para el hogar',
        parentId: furniture.id,
        defaultMargin: 35.0,
        isActive: true,
      },
    })
    console.log(`✅ Subcategory upserted: ${furniture_home.name}`)

    const furniture_office = await prisma.category.upsert({
      where: { code: 'MUE_OFICI' },
      update: {
        name: 'Muebles para Oficina',
        description: 'Muebles para espacios de trabajo',
        parentId: furniture.id,
        defaultMargin: 38.0,
        isActive: true,
      },
      create: {
        code: 'MUE_OFICI',
        name: 'Muebles para Oficina',
        description: 'Muebles para espacios de trabajo',
        parentId: furniture.id,
        defaultMargin: 38.0,
        isActive: true,
      },
    })
    console.log(`✅ Subcategory upserted: ${furniture_office.name}`)

    // Sub-subcategorías de Muebles Casa
    await prisma.category.upsert({
      where: { code: 'SOFAS' },
      update: {
        name: 'Sofás',
        description: 'Sofás y asientos',
        parentId: furniture_home.id,
        defaultMargin: 32.0,
        isActive: true,
      },
      create: {
        code: 'SOFAS',
        name: 'Sofás',
        description: 'Sofás y asientos',
        parentId: furniture_home.id,
        defaultMargin: 32.0,
        isActive: true,
      },
    })
    console.log(`✅ Sub-subcategory upserted: Sofás`)

    await prisma.category.upsert({
      where: { code: 'MESAS' },
      update: {
        name: 'Mesas',
        description: 'Mesas de comedor y centro',
        parentId: furniture_home.id,
        defaultMargin: 35.0,
        isActive: true,
      },
      create: {
        code: 'MESAS',
        name: 'Mesas',
        description: 'Mesas de comedor y centro',
        parentId: furniture_home.id,
        defaultMargin: 35.0,
        isActive: true,
      },
    })
    console.log(`✅ Sub-subcategory upserted: Mesas`)

    // Subcategorías de Deportes
    const sports_outdoor = await prisma.category.upsert({
      where: { code: 'OUTDOOR' },
      update: {
        name: 'Deportes Outdoor',
        description: 'Equipos para deportes al aire libre',
        parentId: sports.id,
        defaultMargin: 30.0,
        isActive: true,
      },
      create: {
        code: 'OUTDOOR',
        name: 'Deportes Outdoor',
        description: 'Equipos para deportes al aire libre',
        parentId: sports.id,
        defaultMargin: 30.0,
        isActive: true,
      },
    })
    console.log(`✅ Subcategory upserted: ${sports_outdoor.name}`)

    const sports_gym = await prisma.category.upsert({
      where: { code: 'GIMNASIA' },
      update: {
        name: 'Gimnasia',
        description: 'Equipos de gimnasia y fitness',
        parentId: sports.id,
        defaultMargin: 28.0,
        isActive: true,
      },
      create: {
        code: 'GIMNASIA',
        name: 'Gimnasia',
        description: 'Equipos de gimnasia y fitness',
        parentId: sports.id,
        defaultMargin: 28.0,
        isActive: true,
      },
    })
    console.log(`✅ Subcategory upserted: ${sports_gym.name}`)

    // Sub-subcategorías de Deportes Outdoor
    await prisma.category.upsert({
      where: { code: 'CICLISMO' },
      update: {
        name: 'Ciclismo',
        description: 'Bicicletas y accesorios',
        parentId: sports_outdoor.id,
        defaultMargin: 28.0,
        isActive: true,
      },
      create: {
        code: 'CICLISMO',
        name: 'Ciclismo',
        description: 'Bicicletas y accesorios',
        parentId: sports_outdoor.id,
        defaultMargin: 28.0,
        isActive: true,
      },
    })
    console.log(`✅ Sub-subcategory upserted: Ciclismo`)

    await prisma.category.upsert({
      where: { code: 'CAMPISMO' },
      update: {
        name: 'Campismo',
        description: 'Equipos de campismo y acampada',
        parentId: sports_outdoor.id,
        defaultMargin: 32.0,
        isActive: true,
      },
      create: {
        code: 'CAMPISMO',
        name: 'Campismo',
        description: 'Equipos de campismo y acampada',
        parentId: sports_outdoor.id,
        defaultMargin: 32.0,
        isActive: true,
      },
    })
    console.log(`✅ Sub-subcategory upserted: Campismo`)

    console.log('\n✅ All test categories seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding categories:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si el archivo se llama directamente
seedCategories().catch(error => {
  console.error(error)
  process.exit(1)
})

export default seedCategories
