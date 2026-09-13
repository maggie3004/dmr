"use server";

import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getSites() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const sites = await sql`
      SELECT 
        s.*,
        COUNT(d.id)::int as entry_count
      FROM sites s
      LEFT JOIN dmr_entries d ON d.site_id = s.id AND d.deleted_at IS NULL
      WHERE s.is_active = true AND s.deleted_at IS NULL
      GROUP BY s.id
      ORDER BY s.site_name ASC
    `;

    return { success: true, sites };
  } catch (error: any) {
    console.error("Action error in getSites:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function getAllSitesAdmin() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "Admin") {
      return { success: false, error: "Unauthorized" };
    }

    const sites = await sql`
      SELECT 
        s.*,
        COUNT(d.id)::int as entry_count
      FROM sites s
      LEFT JOIN dmr_entries d ON d.site_id = s.id AND d.deleted_at IS NULL
      WHERE s.deleted_at IS NULL
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `;

    return { success: true, sites };
  } catch (error: any) {
    console.error("Action error in getAllSitesAdmin:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function addSite(data: { site_name: string; site_address?: string; contact_person?: string }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "Admin") {
      return { success: false, error: "Unauthorized" };
    }

    if (!data.site_name || !data.site_name.trim()) {
      return { success: false, error: "Site name is required." };
    }

    // Check for duplicate active site name
    const existing = await sql`
      SELECT id FROM sites 
      WHERE LOWER(site_name) = ${data.site_name.trim().toLowerCase()} 
      AND deleted_at IS NULL 
      LIMIT 1
    `;

    if (existing.length > 0) {
      return { success: false, error: "A construction site with this name already exists." };
    }

    const [newSite] = await sql`
      INSERT INTO sites (
        site_name, 
        site_address, 
        contact_person, 
        created_by, 
        is_active
      )
      VALUES (
        ${data.site_name.trim()}, 
        ${data.site_address?.trim() || null}, 
        ${data.contact_person?.trim() || null}, 
        ${session.user.id}::uuid, 
        true
      )
      RETURNING *
    `;

    revalidatePath("/", "layout");
    return { success: true, site: newSite };
  } catch (error: any) {
    console.error("Action error in addSite:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function updateSite(data: { 
  id: string; 
  site_name: string; 
  site_address?: string; 
  contact_person?: string; 
  is_active?: boolean 
}) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "Admin") {
      return { success: false, error: "Unauthorized" };
    }

    if (!data.site_name || !data.site_name.trim()) {
      return { success: false, error: "Site name is required." };
    }

    // Check duplicate site name for another site
    const existing = await sql`
      SELECT id FROM sites 
      WHERE LOWER(site_name) = ${data.site_name.trim().toLowerCase()} 
      AND id != ${data.id}::uuid 
      AND deleted_at IS NULL 
      LIMIT 1
    `;

    if (existing.length > 0) {
      return { success: false, error: "Another construction site with this name already exists." };
    }

    await sql`
      UPDATE sites 
      SET 
        site_name = ${data.site_name.trim()},
        site_address = ${data.site_address?.trim() || null},
        contact_person = ${data.contact_person?.trim() || null},
        is_active = ${data.is_active ?? true},
        updated_at = NOW(),
        updated_by = ${session.user.id}::uuid
      WHERE id = ${data.id}::uuid AND deleted_at IS NULL
    `;

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Action error in updateSite:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function deleteSite(siteId: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "Admin") {
      return { success: false, error: "Unauthorized" };
    }

    await sql`
      UPDATE sites 
      SET 
        deleted_at = NOW(),
        deleted_by = ${session.user.id}::uuid,
        is_active = false
      WHERE id = ${siteId}::uuid
    `;

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Action error in deleteSite:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
