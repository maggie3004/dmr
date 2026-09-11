"use server";

import { auth } from "@/auth";
import { sql } from "@/lib/db";

export type NotificationType = {
  id: string;
  title: string;
  description: string;
  date: string;
  read: boolean;
  link: string;
  category?: string;
};

export async function getNotifications(): Promise<NotificationType[]> {
  try {
    const session = await auth();
    if (!session?.user) {
      return [];
    }

    // Fetch the 10 most recent DMR entries with supplier name
    const entries = await sql`
      SELECT
        d.id,
        d.dmr_number,
        d.created_at,
        s.supplier_name
      FROM dmr_entries d
      LEFT JOIN suppliers s ON d.supplier_id = s.id
      WHERE d.deleted_at IS NULL
      ORDER BY d.created_at DESC
      LIMIT 10
    `;

    return entries.map((entry: any) => ({
      id: entry.id,
      title: `New DMR: ${entry.dmr_number}`,
      description: `Material received from ${entry.supplier_name || "Unknown Supplier"}.`,
      date: new Date(entry.created_at).toISOString(),
      read: false,
      link: `/entries`,
    }));
  } catch (error) {
    console.error("Error in getNotifications:", error);
    return [];
  }
}
