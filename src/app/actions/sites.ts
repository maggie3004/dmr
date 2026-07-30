"use server";

import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getSites() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("sites")
      .select("*")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("site_name");

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, sites: data };
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

    const payload = {
      site_name: data.site_name,
      created_by: session.user.id,
    };

    const { data: newSite, error } = await supabase
      .from("sites")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/", "layout");
    return { success: true, site: newSite };
  } catch (error: any) {
    console.error("Action error:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
