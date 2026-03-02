async function seedWarehouses(prisma, empresaId) {
    try {
        console.log('🌱 Starting warehouses seed...\n');
        // Almacén Principal
        await prisma.warehouse.upsert({
            where: { code: 'ALM-001' },
            update: {
                name: 'Almacén Principal',
                type: 'PRINCIPAL',
                address: 'Centro de operaciones',
                isActive: true,
                empresaId,
            },
            create: {
                code: 'ALM-001',
                name: 'Almacén Principal',
                type: 'PRINCIPAL',
                address: 'Centro de operaciones',
                isActive: true,
                empresaId,
            },
        });
        console.log('✅ Warehouse upserted: Almacén Principal');
        // Almacén de Tránsito
        await prisma.warehouse.upsert({
            where: { code: 'ALM-TRANSITO' },
            update: {
                name: 'Almacén Tránsito',
                type: 'TRANSITO',
                address: 'Virtual - Mercancía en tránsito',
                isActive: true,
                empresaId,
            },
            create: {
                code: 'ALM-TRANSITO',
                name: 'Almacén Tránsito',
                type: 'TRANSITO',
                address: 'Virtual - Mercancía en tránsito',
                isActive: true,
                empresaId,
            },
        });
        console.log('✅ Warehouse upserted: Almacén Tránsito');
        // Almacén Sucursal
        await prisma.warehouse.upsert({
            where: { code: 'ALM-SUCURSAL' },
            update: {
                name: 'Almacén Sucursal',
                type: 'SUCURSAL',
                address: 'Sucursal Zona Este',
                isActive: true,
                empresaId,
            },
            create: {
                code: 'ALM-SUCURSAL',
                name: 'Almacén Sucursal',
                type: 'SUCURSAL',
                address: 'Sucursal Zona Este',
                isActive: true,
                empresaId,
            },
        });
        console.log('✅ Warehouse upserted: Almacén Sucursal');
        console.log('\n✅ All warehouses seeded successfully!');
    }
    catch (error) {
        console.error('❌ Error seeding warehouses:', error);
        throw error;
    }
}
export default seedWarehouses;
//# sourceMappingURL=warehouses.seed.js.map