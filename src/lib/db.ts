import { neon, neonConfig } from "@neondatabase/serverless";

// Cache HTTP connections across requests in the same serverless instance.
// This significantly reduces cold-connection overhead (~100-200ms savings).
neonConfig.fetchConnectionCache = true;

// Single shared SQL client — reused across all server actions and pages
export const sql = neon(process.env.DATABASE_URL!);
