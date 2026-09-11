import { neon } from "@neondatabase/serverless";

// Single shared SQL client — reused across all server actions and pages
export const sql = neon(process.env.DATABASE_URL!);
