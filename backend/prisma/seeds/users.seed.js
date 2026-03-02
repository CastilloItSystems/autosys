import bcrypt from 'bcryptjs';
async function seedUsers(prisma, empresaId) {
    try {
        // Hash para las contraseñas de prueba
        const adminPassword = await bcrypt.hash('admin123', 10);
        const userPassword = await bcrypt.hash('user123', 10);
        // Crear usuario admin
        const adminUser = await prisma.user.upsert({
            where: { correo: 'admin@test.com' },
            update: { password: adminPassword },
            create: {
                nombre: 'Admin User',
                correo: 'admin@test.com',
                password: adminPassword,
                rol: 'SUPER_ADMIN',
                estado: 'activo',
                departamento: ['administración', 'inventario', 'ventas'],
                acceso: 'completo',
                eliminado: false,
                empresas: { connect: { id_empresa: empresaId } },
            },
        });
        console.log(`✅ Admin user created: ${adminUser.correo}`);
        // Crear usuario gerente
        const gerenteUser = await prisma.user.upsert({
            where: { correo: 'gerente@test.com' },
            update: { password: userPassword },
            create: {
                nombre: 'Gerente User',
                correo: 'gerente@test.com',
                password: userPassword,
                rol: 'GERENTE',
                estado: 'activo',
                departamento: ['ventas', 'inventario'],
                acceso: 'completo',
                eliminado: false,
                empresas: { connect: { id_empresa: empresaId } },
            },
        });
        console.log(`✅ Gerente user created: ${gerenteUser.correo}`);
        // Crear usuario vendedor
        const vendedorUser = await prisma.user.upsert({
            where: { correo: 'vendedor@test.com' },
            update: { password: userPassword },
            create: {
                nombre: 'Vendedor User',
                correo: 'vendedor@test.com',
                password: userPassword,
                rol: 'VENDEDOR',
                estado: 'activo',
                departamento: ['ventas'],
                acceso: 'limitado',
                eliminado: false,
                empresas: { connect: { id_empresa: empresaId } },
            },
        });
        console.log(`✅ Vendedor user created: ${vendedorUser.correo}`);
        // Crear usuario almacenista
        const almacenistaUser = await prisma.user.upsert({
            where: { correo: 'almacenista@test.com' },
            update: { password: userPassword },
            create: {
                nombre: 'Almacenista User',
                correo: 'almacenista@test.com',
                password: userPassword,
                rol: 'ALMACENISTA',
                estado: 'activo',
                departamento: ['inventario'],
                acceso: 'limitado',
                eliminado: false,
                empresas: { connect: { id_empresa: empresaId } },
            },
        });
        console.log(`✅ Almacenista user created: ${almacenistaUser.correo}`);
        // Crear usuario viewer
        const viewerUser = await prisma.user.upsert({
            where: { correo: 'viewer@test.com' },
            update: { password: userPassword },
            create: {
                nombre: 'Viewer User',
                correo: 'viewer@test.com',
                password: userPassword,
                rol: 'VIEWER',
                estado: 'activo',
                departamento: [],
                acceso: 'ninguno',
                eliminado: false,
                empresas: { connect: { id_empresa: empresaId } },
            },
        });
        console.log(`✅ Viewer user created: ${viewerUser.correo}`);
        console.log('\n✅ All test users seeded successfully!');
    }
    catch (error) {
        console.error('❌ Error seeding users:', error);
        throw error;
    }
}
export default seedUsers;
//# sourceMappingURL=users.seed.js.map