"use server";

import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function addMaterial(data: { material_name: string; default_unit?: string; default_rate?: number }) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Check for duplicates (case-insensitive)
    const existing = await sql`
      SELECT id FROM materials
      WHERE LOWER(material_name) = LOWER(${data.material_name})
        AND deleted_at IS NULL
      LIMIT 1
    `;

    if (existing.length > 0) {
      return { success: false, error: "A material with this name already exists." };
    }

    const [newMaterial] = await sql`
      INSERT INTO materials (material_name, default_unit, default_rate, created_by)
      VALUES (
        ${data.material_name},
        ${data.default_unit ?? null},
        ${data.default_rate ?? null},
        ${session.user.id}::uuid
      )
      RETURNING *
    `;

    revalidatePath("/", "layout");
    return { success: true, material: newMaterial };
  } catch (error: any) {
    console.error("Materials Action Error:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function updateMaterial(id: string, data: { material_name: string; default_unit?: string; default_rate?: number }) {
  const session = await auth();
  if (session?.user?.role !== "Admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const existing = await sql`
      SELECT id FROM materials
      WHERE LOWER(material_name) = LOWER(${data.material_name})
        AND id != ${id}::uuid
        AND deleted_at IS NULL
      LIMIT 1
    `;

    if (existing.length > 0) {
      return { success: false, error: "A material with this name already exists." };
    }

    await sql`
      UPDATE materials
      SET
        material_name = ${data.material_name},
        default_unit  = ${data.default_unit ?? null},
        default_rate  = ${data.default_rate ?? null},
        updated_at    = NOW(),
        updated_by    = ${session.user.id}::uuid
      WHERE id = ${id}::uuid
    `;

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Materials Action Error:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function deleteMaterial(id: string) {
  const session = await auth();
  if (session?.user?.role !== "Admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await sql`
      UPDATE materials
      SET deleted_at = NOW(), deleted_by = ${session.user.id}::uuid
      WHERE id = ${id}::uuid
    `;

    revalidatePath("/", "layout");
    revalidatePath("/inventory-form");
    return { success: true };
  } catch (error: any) {
    console.error("Materials Action Error:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}
