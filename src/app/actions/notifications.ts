"use server";

import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";

export type NotificationType = {
  id: string;
  title: string;
  description: string;
  date: string;
  read: boolean;
  link: string;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getNotifications(): Promise<NotificationType[]> {
  try {
    const session = await auth();
    if (!session?.user) {
      return [];
    }

    // Fetch the 10 most recent DMR entries
    const { data: entries, error } = await supabase
      .from('dmr_entries')
      .select('id, dmr_number, created_at, suppliers(supplier_name)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error || !entries) {
      console.error("Error fetching notifications:", error);
      return [];
    }

    // Format them as notifications
    return entries.map((entry: any) => ({
      id: entry.id,
      title: `New DMR: ${entry.dmr_number}`,
      description: `Material received from ${entry.suppliers?.supplier_name || 'Unknown Supplier'}.`,
      date: new Date(entry.created_at).toISOString(),
      read: false, // Default to unread for this derived view
      link: `/entries` // Simple link to entries page
    }));

  } catch (error) {
    console.error("Error in getNotifications:", error);
    return [];
  }
}
