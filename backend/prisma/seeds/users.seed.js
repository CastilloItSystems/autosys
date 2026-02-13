import 'dotenv/config';
import { PrismaClient } from '../../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
async function seedUsers() {
    try {
        // Hash para las contraseñas de prueba
        const adminPassword = await bcrypt.hash('admin123', 10);
        const userPassword = await bcrypt.hash('user123', 10);
        // Crear usuario admin
        const adminUser = await prisma.user.create({
            data: {
                nombre: 'Admin User',
                correo: 'admin@test.com',
                password: adminPassword,
                rol: 'SUPER_ADMIN',
                estado: 'activo',
                departamento: ['administración', 'inventario', 'ventas'],
                acceso: 'completo',
                eliminado: false,
            },
        });
        console.log(`✅ Admin user created: ${adminUser.correo}`);
        // Crear usuario gerente
        const gerenteUser = await prisma.user.create({
            data: {
                nombre: 'Gerente User',
                correo: 'gerente@test.com',
                password: userPassword,
                rol: 'GERENTE',
                estado: 'activo',
                departamento: ['ventas', 'inventario'],
                acceso: 'completo',
                eliminado: false,
            },
        });
        console.log(`✅ Gerente user created: ${gerenteUser.correo}`);
        // Crear usuario vendedor
        const vendedorUser = await prisma.user.create({
            data: {
                nombre: 'Vendedor User',
                correo: 'vendedor@test.com',
                password: userPassword,
                rol: 'VENDEDOR',
                estado: 'activo',
                departamento: ['ventas'],
                acceso: 'limitado',
                eliminado: false,
            },
        });
        console.log(`✅ Vendedor user created: ${vendedorUser.correo}`);
        // Crear usuario almacenista
        const almacenistaUser = await prisma.user.create({
            data: {
                nombre: 'Almacenista User',
                correo: 'almacenista@test.com',
                password: userPassword,
                rol: 'ALMACENISTA',
                estado: 'activo',
                departamento: ['inventario'],
                acceso: 'limitado',
                eliminado: false,
            },
        });
        console.log(`✅ Almacenista user created: ${almacenistaUser.correo}`);
        // Crear usuario viewer
        const viewerUser = await prisma.user.create({
            data: {
                nombre: 'Viewer User',
                correo: 'viewer@test.com',
                password: userPassword,
                rol: 'VIEWER',
                estado: 'activo',
                departamento: [],
                acceso: 'ninguno',
                eliminado: false,
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