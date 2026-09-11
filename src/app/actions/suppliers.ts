"use server";

import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function addSupplier(data: { supplier_name: string; contact_number?: string; address?: string; gst_number?: string }) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Check for duplicates (case-insensitive)
    const existing = await sql`
      SELECT id FROM suppliers
      WHERE LOWER(supplier_name) = LOWER(${data.supplier_name})
        AND deleted_at IS NULL
      LIMIT 1
    `;

    if (existing.length > 0) {
      return { success: false, error: "A supplier with this name already exists." };
    }

    const [newSupplier] = await sql`
      INSERT INTO suppliers (supplier_name, contact_number, address, gst_number, created_by)
      VALUES (
        ${data.supplier_name},
        ${data.contact_number ?? null},
        ${data.address ?? null},
        ${data.gst_number ?? null},
        ${session.user.id}
      )
      RETURNING *
    `;

    revalidatePath("/", "layout");
    return { success: true, supplier: newSupplier };
  } catch (error: any) {
    console.error("Suppliers Action Error:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function updateSupplier(id: string, data: { supplier_name: string; contact_number?: string; address?: string; gst_number?: string }) {
  const session = await auth();
  if (session?.user?.role !== "Admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const existing = await sql`
      SELECT id FROM suppliers
      WHERE LOWER(supplier_name) = LOWER(${data.supplier_name})
        AND id != ${id}::uuid
        AND deleted_at IS NULL
      LIMIT 1
    `;

    if (existing.length > 0) {
      return { success: false, error: "A supplier with this name already exists." };
    }

    await sql`
      UPDATE suppliers
      SET
        supplier_name  = ${data.supplier_name},
        contact_number = ${data.contact_number ?? null},
        address        = ${data.address ?? null},
        gst_number     = ${data.gst_number ?? null},
        updated_at     = NOW(),
        updated_by     = ${session.user.id}::uuid
      WHERE id = ${id}::uuid
    `;

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Suppliers Action Error:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function deleteSupplier(id: string) {
  const session = await auth();
  if (session?.user?.role !== "Admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await sql`
      UPDATE suppliers
      SET deleted_at = NOW(), deleted_by = ${session.user.id}::uuid
      WHERE id = ${id}::uuid
    `;

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Suppliers Action Error:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}
