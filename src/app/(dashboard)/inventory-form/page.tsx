import { auth } from "@/auth";
import { InventoryFormClient } from "./inventory-form-client";
import { sql } from "@/lib/db";

export const dynamic = 'force-dynamic';

export default async function InventoryFormPage() {
  await auth();

  const [suppliers, materials, sites] = await Promise.all([
    sql`SELECT id, supplier_name FROM suppliers WHERE deleted_at IS NULL ORDER BY supplier_name ASC`,
    sql`SELECT id, material_name, default_unit, default_rate FROM materials WHERE deleted_at IS NULL ORDER BY material_name ASC`,
    sql`SELECT id, site_name FROM sites WHERE deleted_at IS NULL ORDER BY site_name ASC`,
  ]);

  return (
    <div className="max-w-4xl mx-auto">
      <InventoryFormClient suppliers={suppliers} materials={materials} sites={sites} />
    </div>
  );
}
