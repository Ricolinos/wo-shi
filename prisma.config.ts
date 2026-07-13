import { config } from "dotenv"
config({ path: ".env.local" })
import { defineConfig } from "prisma/config"

export default defineConfig({
  datasource: {
    // Comandos CLI (db push, studio) usan la conexión directa de Supabase;
    // el runtime usa DATABASE_URL (pooler) en src/lib/prisma.ts.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
})
