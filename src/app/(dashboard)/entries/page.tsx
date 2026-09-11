import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { EntriesClient } from "./entries-client";

export const dynamic = 'force-dynamic';

export default async function EntriesPage() {
  // Run auth + DB query in parallel
  const [session, entries] = await Promise.all([
    auth(),
    sql`
      SELECT
        d.*,
        json_build_object('supplier_name', s.supplier_name) AS suppliers,
        json_build_object('material_name', m.material_name) AS materials,
        json_build_object('site_name',     si.site_name)    AS sites
      FROM dmr_entries d
      LEFT JOIN suppliers s  ON d.supplier_id = s.id
      LEFT JOIN materials m  ON d.material_id = m.id
      LEFT JOIN sites     si ON d.site_id     = si.id
      WHERE d.deleted_at IS NULL
      ORDER BY d.created_at DESC
    `,
  ]);

  if (session?.user?.role !== "Admin") {
    redirect("/");
  }

  return (
    <div className="space-y-6 md:space-y-8 w-full max-w-full overflow-hidden">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">All Entries</h1>
        <p className="text-gray-500 mt-1">View and manage all Daily Material Reports.</p>
      </div>

      <EntriesClient entries={entries || []} />
    </div>
  );
}
