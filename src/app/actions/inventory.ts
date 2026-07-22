"use server";

import { auth } from "@/auth";
import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@supabase/supabase-js";

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
  if (!file) return null;
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

export async function submitInventoryForm(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Process files
    const materialPhoto = formData.get("materialPhoto") as File | null;
    const challanPhoto = formData.get("challanPhoto") as File | null;
    const billPhoto = formData.get("billPhoto") as File | null;

    const [material_image, challan_image, bill_image] = await Promise.all([
      uploadToCloudinary(materialPhoto),
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

    let finalMaterialName = formData.get("materialName") as string;
    const otherMaterial = formData.get("otherMaterialName") as string;
    const unit = formData.get("unit") as string;

    if (finalMaterialName === "Other" && otherMaterial) {
      finalMaterialName = otherMaterial;
      
      // Check if material already exists (case insensitive)
      const { data: existingMaterial } = await supabase
        .from('materials')
        .select('id')
        .ilike('material_name', otherMaterial)
        .maybeSingle();
        
      if (!existingMaterial) {
        // Insert new material to database
        await supabase.from('materials').insert({
          material_name: otherMaterial,
          default_unit: unit
        });
      }
    }

    // Prepare payload
    const payload = {
      dmr_number,
      arrival_date: formData.get("dateOfArrival"),
      supplier_id: formData.get("supplierId"),
      material_name: finalMaterialName,
      other_material: null,
      quantity: parseFloat(formData.get("quantity") as string),
      unit: unit,
      vehicle_number: formData.get("vehicleNumber"),
      invoice_number: formData.get("invoiceNumber"),
      material_image,
      challan_image,
      bill_image,
      rate_per_unit: parseFloat(formData.get("ratePerUnit") as string),
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
      console.error("Supabase insert error:", error);
      return { success: false, error: "Database error" };
    }

    return { success: true, dmrNumber: dmr_number };
  } catch (error: any) {
    console.error("Action error:", error);
    return { success: false, error: error.message || "Internal server error" };
  }
}
