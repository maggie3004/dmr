"use server";

import { auth } from "@/auth";
import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function uploadToCloudinary(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "dmr_portal" },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload failed:", error);
          resolve(null);
        } else {
          resolve(result?.secure_url || null);
        }
      }
    ).end(buffer);
  });
}

export async function submitInventoryForm(formData: FormData): Promise<{ success: boolean, error?: string, dmrNumber?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Process files
    const materialPhoto = formData.get("materialPhoto") as File | null;
    const vehiclePhoto = formData.get("vehiclePhoto") as File | null;
    const challanPhoto = formData.get("challanPhoto") as File | null;
    const billPhoto = formData.get("billPhoto") as File | null;

    const [material_image, vehicle_photo, challan_image, bill_image] = await Promise.all([
      uploadToCloudinary(materialPhoto),
      uploadToCloudinary(vehiclePhoto),
      uploadToCloudinary(challanPhoto),
      uploadToCloudinary(billPhoto),
    ]);

    // Generate DMR Number
    const { data: latestEntry } = await supabase
      .from('dmr_entries')
      .select('dmr_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let nextNumber = 1;
    const currentYear = new Date().getFullYear();
    
    if (latestEntry && latestEntry.dmr_number.startsWith(`DMR-${currentYear}-`)) {
      const parts = latestEntry.dmr_number.split('-');
      if (parts.length === 3) {
        nextNumber = parseInt(parts[2], 10) + 1;
      }
    }
    
    const dmr_number = `DMR-${currentYear}-${nextNumber.toString().padStart(6, '0')}`;

    // Prepare payload
    const payload = {
      dmr_number,
      arrival_date: formData.get("dateOfArrival"),
      supplier_id: formData.get("supplierId"),
      material_id: formData.get("materialId"),
      site_id: formData.get("siteId"),
      quantity: parseFloat(formData.get("quantity") as string),
      unit: formData.get("unit"),
      vehicle_number: formData.get("vehicleNumber"),
      invoice_number: formData.get("invoiceNumber"),
      material_image,
      vehicle_photo,
      challan_image,
      bill_image,
      rate_per_unit: parseFloat(formData.get("ratePerUnit") as string),
      gst_applicable: formData.get("gstApplicable") === "true",
      gst_type: formData.get("gstType") || null,
      gst_percentage: formData.get("gstPercentage") ? parseFloat(formData.get("gstPercentage") as string) : null,
      gst_amount: formData.get("gstAmount") ? parseFloat(formData.get("gstAmount") as string) : null,
      final_bill_amount: parseFloat(formData.get("finalBillAmount") as string),
      payment_status: formData.get("paymentStatus"),
      payment_date: formData.get("paymentDate") || null,
      remarks: formData.get("remarks") || null,
      created_by: session.user.id,
    };

    // Insert into DB
    const { error } = await supabase
      .from("dmr_entries")
      .insert(payload);

    if (error) {
      console.error("Supabase insert error:", error, "Payload:", payload);
      return { success: false, error: `Database error: ${error.message} ${error.details || ''}` };
    }

    revalidatePath("/", "layout");
    return { success: true, dmrNumber: dmr_number };
  } catch (error: any) {
    console.error("Action error:", error);
    console.error("Inventory Action Error:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function updatePaymentStatus(id: string, paymentStatus: string, paymentDate?: string) {
  const session = await auth();
  if (session?.user?.role !== "Admin" && session?.user?.role !== "Supervisor") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const { error } = await supabase
      .from("dmr_entries")
      .update({
        payment_status: paymentStatus,
        payment_date: paymentDate || null,
        updated_at: new Date().toISOString(),
        updated_by: session.user.id,
      })
      .eq("id", id);

    if (error) throw error;
    
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Inventory Action Error:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function updateDmrEntry(id: string, formData: FormData): Promise<{ success: boolean, error?: string, dmrNumber?: string }> {
  const session = await auth();
  if (!session?.user?.role || session.user.role !== "Admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Process files if any new ones are uploaded
    const materialPhoto = formData.get("materialPhoto") as File | null;
    const vehiclePhoto = formData.get("vehiclePhoto") as File | null;
    const challanPhoto = formData.get("challanPhoto") as File | null;
    const billPhoto = formData.get("billPhoto") as File | null;

    const updates: any = {
      arrival_date: formData.get("dateOfArrival"),
      supplier_id: formData.get("supplierId"),
      material_id: formData.get("materialId"),
      site_id: formData.get("siteId"),
      quantity: parseFloat(formData.get("quantity") as string),
      unit: formData.get("unit"),
      vehicle_number: formData.get("vehicleNumber"),
      invoice_number: formData.get("invoiceNumber"),
      rate_per_unit: parseFloat(formData.get("ratePerUnit") as string),
      gst_applicable: formData.get("gstApplicable") === "true",
      gst_type: formData.get("gstType") || null,
      gst_percentage: formData.get("gstPercentage") ? parseFloat(formData.get("gstPercentage") as string) : null,
      gst_amount: formData.get("gstAmount") ? parseFloat(formData.get("gstAmount") as string) : null,
      final_bill_amount: parseFloat(formData.get("finalBillAmount") as string),
      payment_status: formData.get("paymentStatus"),
      payment_date: formData.get("paymentDate") || null,
      remarks: formData.get("remarks") || null,
      updated_at: new Date().toISOString(),
      updated_by: session.user.id,
    };

    if (materialPhoto && materialPhoto.size > 0) {
      updates.material_image = await uploadToCloudinary(materialPhoto);
    }
    if (vehiclePhoto && vehiclePhoto.size > 0) {
      updates.vehicle_photo = await uploadToCloudinary(vehiclePhoto);
    }
    if (challanPhoto && challanPhoto.size > 0) {
      updates.challan_image = await uploadToCloudinary(challanPhoto);
    }
    if (billPhoto && billPhoto.size > 0) {
      updates.bill_image = await uploadToCloudinary(billPhoto);
    }

    const { error } = await supabase
      .from("dmr_entries")
      .update(updates)
      .eq("id", id);

    if (error) throw error;
    
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Inventory Action Error:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function deleteDmrEntry(id: string) {
  const session = await auth();
  if (session?.user?.role !== "Admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const { error } = await supabase
      .from("dmr_entries")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: session.user.id,
      })
      .eq("id", id);

    if (error) throw error;
    
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Inventory Action Error:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function bulkUploadInventory(entries: any[]): Promise<{ success: boolean, error?: string, insertedCount?: number }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Process all entries to find unique suppliers and materials
    const uniqueSuppliers = Array.from(new Set(entries.map(e => e["Supplier Name"]).filter(Boolean))) as string[];
    const uniqueMaterials = Array.from(new Set(entries.map(e => e["Material Name"]).filter(Boolean))) as string[];
    const uniqueSites = Array.from(new Set(entries.map(e => e["Site Name"]).filter(Boolean))) as string[];

    // Fetch existing suppliers, materials, and sites
    const { data: existingSuppliers } = await supabase.from('suppliers').select('id, supplier_name');
    const { data: existingMaterials } = await supabase.from('materials').select('id, material_name');
    const { data: existingSites } = await supabase.from('sites').select('id, site_name');

    const supplierMap = new Map((existingSuppliers || []).map(s => [s.supplier_name.toLowerCase().trim(), s.id]));
    const materialMap = new Map((existingMaterials || []).map(m => [m.material_name.toLowerCase().trim(), m.id]));
    const siteMap = new Map((existingSites || []).map(s => [s.site_name.toLowerCase().trim(), s.id]));

    // Helper to get or create supplier
    const getOrCreateSupplier = async (name: string) => {
      const key = name.toLowerCase().trim();
      if (supplierMap.has(key)) return supplierMap.get(key);
      
      const { data, error } = await supabase.from('suppliers').insert({ supplier_name: name, created_by: session.user.id }).select('id').single();
      if (error) throw new Error(`Failed to create supplier ${name}`);
      supplierMap.set(key, data.id);
      return data.id;
    };

    // Helper to get or create material
    const getOrCreateMaterial = async (name: string, unit: string, rate: number) => {
      const key = name.toLowerCase().trim();
      if (materialMap.has(key)) return materialMap.get(key);

      const { data, error } = await supabase.from('materials').insert({ 
        material_name: name, 
        default_unit: unit || null,
        default_rate: rate || null,
        created_by: session.user.id 
      }).select('id').single();
      
      if (error) throw new Error(`Failed to create material ${name}`);
      materialMap.set(key, data.id);
      return data.id;
    };

    // Helper to get or create site
    const getOrCreateSite = async (name: string) => {
      const key = name.toLowerCase().trim();
      if (siteMap.has(key)) return siteMap.get(key);

      const { data, error } = await supabase.from('sites').insert({ 
        site_name: name,
        created_by: session.user.id 
      }).select('id').single();
      
      if (error) throw new Error(`Failed to create site ${name}`);
      siteMap.set(key, data.id);
      return data.id;
    };

    const currentYear = new Date().getFullYear();
    const payload = [];

    for (let i = 0; i < entries.length; i++) {
      const row = entries[i];
      if (!row["Arrival Date"] || !row["Supplier Name"] || !row["Material Name"] || !row["Quantity"]) continue;

      const supplier_id = await getOrCreateSupplier(row["Supplier Name"]);
      const material_id = await getOrCreateMaterial(row["Material Name"], row["Unit"], parseFloat(row["Rate Per Unit"] || "0"));
      const site_id = row["Site Name"] ? await getOrCreateSite(row["Site Name"]) : null;

      // Get next DMR number (generate a random-ish one for bulk to avoid collision or query for each)
      // For bulk, a timestamp suffix is safer
      const timestampSuffix = Date.now().toString().slice(-6) + i;
      const dmr_number = `DMR-${currentYear}-B${timestampSuffix}`;

      payload.push({
        dmr_number,
        arrival_date: row["Arrival Date"],
        supplier_id,
        material_id,
        site_id,
        quantity: parseFloat(row["Quantity"]),
        unit: row["Unit"] || "Nos",
        vehicle_number: row["Vehicle Number"] || null,
        invoice_number: row["Invoice Number"] || null,
        rate_per_unit: row["Rate Per Unit"] ? parseFloat(row["Rate Per Unit"]) : null,
        final_bill_amount: row["Final Bill Amount"] ? parseFloat(row["Final Bill Amount"]) : null,
        payment_status: row["Payment Status"] === "Paid" ? "Paid" : "Not Paid",
        remarks: row["Remarks"] || null,
        created_by: session.user.id,
      });
    }

    if (payload.length > 0) {
      const { error } = await supabase.from('dmr_entries').insert(payload);
      if (error) {
        console.error("Bulk insert error:", error);
        return { success: false, error: "Database error during bulk insert." };
      }
    }

    revalidatePath("/", "layout");
    return { success: true, insertedCount: payload.length };
  } catch (error: any) {
    console.error("Bulk Upload Error:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}
