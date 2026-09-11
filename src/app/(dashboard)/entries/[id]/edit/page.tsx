import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { InventoryFormClient } from "../../../inventory-form/inventory-form-client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function EditEntryPage({ params }: { params: Promise<{ id: string }> }) {
  // Run auth + params resolution concurrently, then fire all DB queries at once
  const [session, { id }] = await Promise.all([
    auth(),
    params,
  ]);

  if (session?.user?.role !== "Admin") {
    redirect("/");
  }

  const [entryRows, suppliers, materials, sites] = await Promise.all([
    sql`SELECT * FROM dmr_entries WHERE id = ${id}::uuid AND deleted_at IS NULL LIMIT 1`,
    sql`SELECT id, supplier_name FROM suppliers WHERE deleted_at IS NULL ORDER BY supplier_name ASC`,
    sql`SELECT id, material_name, default_unit, default_rate FROM materials WHERE deleted_at IS NULL ORDER BY material_name ASC`,
    sql`SELECT id, site_name FROM sites WHERE deleted_at IS NULL ORDER BY site_name ASC`,
  ]);

  const entry = entryRows[0];
  if (!entry) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
      <div className="flex items-center justify-center relative mb-6 md:mb-8">
        <Link href="/entries" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Edit Entry: {entry.dmr_number}</h1>
          <p className="text-gray-500">Update details for this Daily Material Report.</p>
        </div>
      </div>

      <InventoryFormClient
        suppliers={suppliers}
        materials={materials}
        sites={sites}
        initialData={entry}
      />
    </div>
  );
}
