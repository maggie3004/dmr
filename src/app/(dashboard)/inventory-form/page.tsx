import { InventoryFormClient } from "./inventory-form-client";
import { sql } from "@/lib/db";

export const dynamic = 'force-dynamic';

export default async function InventoryFormPage() {
  // Single round-trip to database for all 3 datasets
  const [data] = await sql`
    SELECT
      COALESCE((SELECT json_agg(s) FROM (SELECT id, supplier_name FROM suppliers WHERE deleted_at IS NULL ORDER BY supplier_name ASC) s), '[]'::json) as suppliers,
      COALESCE((SELECT json_agg(m) FROM (SELECT id, material_name, default_unit, default_rate FROM materials WHERE deleted_at IS NULL ORDER BY material_name ASC) m), '[]'::json) as materials,
      COALESCE((SELECT json_agg(si) FROM (SELECT id, site_name FROM sites WHERE deleted_at IS NULL ORDER BY site_name ASC) si), '[]'::json) as sites
  `;

  return (
    <div className="max-w-4xl mx-auto">
      <InventoryFormClient
        suppliers={(data?.suppliers as any[]) || []}
        materials={(data?.materials as any[]) || []}
        sites={(data?.sites as any[]) || []}
      />
    </div>
  );
}
