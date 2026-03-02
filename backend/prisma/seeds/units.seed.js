async function seedUnits(prisma, empresaId) {
    try {
        console.log('🌱 Starting units seed...\n');
        // Unidad (Contable)
        await prisma.unit.upsert({
            where: { empresaId_code: { empresaId, code: 'UND' } },
            update: {
                name: 'Unidad',
                abbreviation: 'und',
                type: 'COUNTABLE',
                isActive: true,
            },
            create: {
                code: 'UND',
                name: 'Unidad',
                abbreviation: 'und',
                type: 'COUNTABLE',
                isActive: true,
                empresaId,
            },
        });
        console.log('✅ Unit upserted: Unidad');
        // Litro (Volumen)
        await prisma.unit.upsert({
            where: { empresaId_code: { empresaId, code: 'LTR' } },
            update: {
                name: 'Litro',
                abbreviation: 'L',
                type: 'VOLUME',
                isActive: true,
            },
            create: {
                code: 'LTR',
                name: 'Litro',
                abbreviation: 'L',
                type: 'VOLUME',
                isActive: true,
                empresaId,
            },
        });
        console.log('✅ Unit upserted: Litro');
        // Kilogramo (Peso)
        await prisma.unit.upsert({
            where: { empresaId_code: { empresaId, code: 'KG' } },
            update: {
                name: 'Kilogramo',
                abbreviation: 'kg',
                type: 'WEIGHT',
                isActive: true,
            },
            create: {
                code: 'KG',
                name: 'Kilogramo',
                abbreviation: 'kg',
                type: 'WEIGHT',
                isActive: true,
                empresaId,
            },
        });
        console.log('✅ Unit upserted: Kilogramo');
        // Gramo (Peso)
        await prisma.unit.upsert({
            where: { empresaId_code: { empresaId, code: 'GR' } },
            update: {
                name: 'Gramo',
                abbreviation: 'gr',
                type: 'WEIGHT',
                isActive: true,
            },
            create: {
                code: 'GR',
                name: 'Gramo',
                abbreviation: 'gr',
                type: 'WEIGHT',
                isActive: true,
                empresaId,
            },
        });
        console.log('✅ Unit upserted: Gramo');
        // Metro (Longitud)
        await prisma.unit.upsert({
            where: { empresaId_code: { empresaId, code: 'MTR' } },
            update: {
                name: 'Metro',
                abbreviation: 'm',
                type: 'LENGTH',
                isActive: true,
            },
            create: {
                code: 'MTR',
                name: 'Metro',
                abbreviation: 'm',
                type: 'LENGTH',
                isActive: true,
                empresaId,
            },
        });
        console.log('✅ Unit upserted: Metro');
        // Caja (Contable - para empaques)
        await prisma.unit.upsert({
            where: { empresaId_code: { empresaId, code: 'CAJA' } },
            update: {
                name: 'Caja',
                abbreviation: 'caja',
                type: 'COUNTABLE',
                isActive: true,
            },
            create: {
                code: 'CAJA',
                name: 'Caja',
                abbreviation: 'caja',
                type: 'COUNTABLE',
                isActive: true,
                empresaId,
            },
        });
        console.log('✅ Unit upserted: Caja');
        // Paquete (Contable)
        await prisma.unit.upsert({
            where: { empresaId_code: { empresaId, code: 'PKT' } },
            update: {
                name: 'Paquete',
                abbreviation: 'pkt',
                type: 'COUNTABLE',
                isActive: true,
            },
            create: {
                code: 'PKT',
                name: 'Paquete',
                abbreviation: 'pkt',
                type: 'COUNTABLE',
                isActive: true,
                empresaId,
            },
        });
        console.log('✅ Unit upserted: Paquete');
        console.log('\n✅ All units seeded successfully!');
    }
    catch (error) {
        console.error('❌ Error seeding units:', error);
        throw error;
    }
}
export default seedUnits;
//# sourceMappingURL=units.seed.js.map