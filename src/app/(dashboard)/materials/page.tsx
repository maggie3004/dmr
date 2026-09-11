import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { MaterialsClient } from "./materials-client";

export const dynamic = 'force-dynamic';

export default async function MaterialsPage() {
  const session = await auth();

  if (session?.user?.role !== "Admin") {
    redirect("/");
  }

  const materials = await sql`
    SELECT * FROM materials
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
  `;

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Manage Materials</h1>
        <p className="text-gray-500 mt-1">Add, edit, and manage construction materials.</p>
      </div>

      <MaterialsClient materials={materials || []} />
    </div>
  );
}
