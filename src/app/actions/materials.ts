"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function addMaterial(data: { material_name: string; default_unit?: string; default_rate?: number }) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Check for duplicates (case-insensitive)
    const { data: existing } = await supabase
      .from('materials')
      .select('id')
      .ilike('material_name', data.material_name)
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "A material with this name already exists." };
    }

    const { data: newMaterial, error } = await supabase
      .from('materials')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    
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
    const { data: existing } = await supabase
      .from('materials')
      .select('id')
      .ilike('material_name', data.material_name)
      .neq('id', id)
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "A material with this name already exists." };
    }

    const { error } = await supabase
      .from('materials')
      .update({ ...data, updated_at: new Date().toISOString(), updated_by: session.user.id })
      .eq('id', id);

    if (error) throw error;
    
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
    // Soft Delete
    const { error } = await supabase
      .from('materials')
      .update({ deleted_at: new Date().toISOString(), deleted_by: session.user.id })
      .eq('id', id);

    if (error) throw error;
    
    revalidatePath("/", "layout");
    revalidatePath("/inventory-form");
    return { success: true };
  } catch (error: any) {
    console.error("Materials Action Error:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}
