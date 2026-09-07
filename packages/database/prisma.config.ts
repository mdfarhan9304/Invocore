import { loadConfig } from "@invocore/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    url: loadConfig().databaseUrl
  },
  migrations: {
    path: "prisma/migrations"
  },
  schema: "prisma/schema.prisma"
});
