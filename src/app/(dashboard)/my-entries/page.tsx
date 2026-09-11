import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { MyEntriesClient } from "./my-entries-client";

export const dynamic = 'force-dynamic';

export default async function MyEntriesPage() {
  // auth must resolve first — we need session.user.id for the WHERE filter
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const entries = await sql`
    SELECT
      d.*,
      json_build_object('supplier_name', s.supplier_name) AS suppliers,
      m.material_name
    FROM dmr_entries d
    LEFT JOIN suppliers s ON d.supplier_id = s.id
    LEFT JOIN materials m ON d.material_id = m.id
    WHERE d.created_by = ${session.user.id}::uuid
      AND d.deleted_at IS NULL
    ORDER BY d.created_at DESC
  `;

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">My Entries</h1>
        <p className="text-gray-500 mt-1">View DMR entries created by you.</p>
      </div>

      <MyEntriesClient entries={entries || []} />
    </div>
  );
}
