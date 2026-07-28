"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function addSupplier(data: { supplier_name: string; contact_number?: string; address?: string; gst_number?: string }) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Check for duplicates (case-insensitive)
    const { data: existing } = await supabase
      .from('suppliers')
      .select('id')
      .ilike('supplier_name', data.supplier_name)
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "A supplier with this name already exists." };
    }

    const { data: newSupplier, error } = await supabase
      .from('suppliers')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    
    revalidatePath("/suppliers");
    revalidatePath("/inventory-form");
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
    const { data: existing } = await supabase
      .from('suppliers')
      .select('id')
      .ilike('supplier_name', data.supplier_name)
      .neq('id', id)
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "A supplier with this name already exists." };
    }

    const { error } = await supabase
      .from('suppliers')
      .update({ ...data, updated_at: new Date().toISOString(), updated_by: session.user.id })
      .eq('id', id);

    if (error) throw error;
    
    revalidatePath("/suppliers");
    revalidatePath("/inventory-form");
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
    // Soft Delete
    const { error } = await supabase
      .from('suppliers')
      .update({ deleted_at: new Date().toISOString(), deleted_by: session.user.id })
      .eq('id', id);

    if (error) throw error;
    
    revalidatePath("/suppliers");
    return { success: true };
  } catch (error: any) {
    console.error("Suppliers Action Error:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}
