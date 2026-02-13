import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';
export default defineConfig({
    schema: 'prisma/schema.prisma',
    datasource: {
        url: env('DIRECT_URL'),
    },
    seed: 'prisma/seeds/index.ts',
});
//# sourceMappingURL=prisma.config.js.map