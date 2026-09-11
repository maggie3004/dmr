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
      SELECT * FROM sites
      WHERE is_active = true AND deleted_at IS NULL
      ORDER BY site_name ASC
    `;

    return { success: true, sites };
  } catch (error: any) {
    console.error("Action error:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function addSite(data: { site_name: string }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const [newSite] = await sql`
      INSERT INTO sites (site_name, created_by)
      VALUES (${data.site_name}, ${session.user.id}::uuid)
      RETURNING *
    `;

    revalidatePath("/", "layout");
    return { success: true, site: newSite };
  } catch (error: any) {
    console.error("Action error:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
