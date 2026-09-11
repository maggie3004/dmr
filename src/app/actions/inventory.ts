"use server";

import { auth } from "@/auth";
import { v2 as cloudinary } from "cloudinary";
import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    const vehiclePhoto  = formData.get("vehiclePhoto")  as File | null;
    const challanPhoto  = formData.get("challanPhoto")  as File | null;
    const billPhoto     = formData.get("billPhoto")     as File | null;

    const [material_image, vehicle_photo, challan_image, bill_image] = await Promise.all([
      uploadToCloudinary(materialPhoto),
      uploadToCloudinary(vehiclePhoto),
      uploadToCloudinary(challanPhoto),
      uploadToCloudinary(billPhoto),
    ]);

    // Generate DMR Number — atomic via a single query
    const currentYear = new Date().getFullYear();
    const [latestEntry] = await sql`
      SELECT dmr_number FROM dmr_entries
      WHERE dmr_number LIKE ${"DMR-" + currentYear + "-%"}
        AND dmr_number NOT LIKE 'DMR-%-B%'
      ORDER BY created_at DESC
      LIMIT 1
    `;

    let nextNumber = 1;
    if (latestEntry) {
      const parts = latestEntry.dmr_number.split("-");
      if (parts.length === 3) {
        nextNumber = parseInt(parts[2], 10) + 1;
      }
    }

    const dmr_number = `DMR-${currentYear}-${nextNumber.toString().padStart(6, "0")}`;

    const quantity       = parseFloat(formData.get("quantity") as string);
    const rate_per_unit  = parseFloat(formData.get("ratePerUnit") as string);
    const gst_percentage = formData.get("gstPercentage") ? parseFloat(formData.get("gstPercentage") as string) : null;
    const gst_amount     = formData.get("gstAmount")     ? parseFloat(formData.get("gstAmount")     as string) : null;
    const final_bill     = parseFloat(formData.get("finalBillAmount") as string);

    await sql`
      INSERT INTO dmr_entries (
        dmr_number, arrival_date, supplier_id, material_id, site_id,
        quantity, unit, vehicle_number, invoice_number,
        material_image, vehicle_photo, challan_image, bill_image,
        rate_per_unit, gst_applicable, gst_type, gst_percentage, gst_amount,
        final_bill_amount, payment_status, payment_date, remarks, created_by
      ) VALUES (
        ${dmr_number},
        ${formData.get("dateOfArrival") as string},
        ${formData.get("supplierId") as string}::uuid,
        ${formData.get("materialId") as string}::uuid,
        ${formData.get("siteId") ? (formData.get("siteId") as string) : null}${formData.get("siteId") ? sql`::uuid` : sql``},
        ${isNaN(quantity)      ? null : quantity},
        ${formData.get("unit") || null},
        ${formData.get("vehicleNumber")  || null},
        ${formData.get("invoiceNumber")  || null},
        ${material_image},
        ${vehicle_photo},
        ${challan_image},
        ${bill_image},
        ${isNaN(rate_per_unit) ? null : rate_per_unit},
        ${formData.get("gstApplicable") === "true"},
        ${formData.get("gstType")    || null},
        ${gst_percentage},
        ${gst_amount},
        ${isNaN(final_bill)    ? null : final_bill},
        ${formData.get("paymentStatus") || "Not Paid"},
        ${formData.get("paymentDate")   || null},
        ${formData.get("remarks")       || null},
        ${session.user.id}::uuid
      )
    `;

    revalidatePath("/", "layout");
    return { success: true, dmrNumber: dmr_number };
  } catch (error: any) {
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
    await sql`
      UPDATE dmr_entries
      SET
        payment_status = ${paymentStatus},
        payment_date   = ${paymentDate || null},
        updated_at     = NOW(),
        updated_by     = ${session.user.id}::uuid
      WHERE id = ${id}::uuid
    `;

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
    const materialPhoto = formData.get("materialPhoto") as File | null;
    const vehiclePhoto  = formData.get("vehiclePhoto")  as File | null;
    const challanPhoto  = formData.get("challanPhoto")  as File | null;
    const billPhoto     = formData.get("billPhoto")     as File | null;

    const quantity       = parseFloat(formData.get("quantity") as string);
    const rate_per_unit  = parseFloat(formData.get("ratePerUnit") as string);
    const gst_percentage = formData.get("gstPercentage") ? parseFloat(formData.get("gstPercentage") as string) : null;
    const gst_amount     = formData.get("gstAmount")     ? parseFloat(formData.get("gstAmount")     as string) : null;
    const final_bill     = parseFloat(formData.get("finalBillAmount") as string);

    // Conditionally upload new photos
    const material_image = materialPhoto && materialPhoto.size > 0 ? await uploadToCloudinary(materialPhoto) : undefined;
    const vehicle_photo  = vehiclePhoto  && vehiclePhoto.size  > 0 ? await uploadToCloudinary(vehiclePhoto)  : undefined;
    const challan_image  = challanPhoto  && challanPhoto.size  > 0 ? await uploadToCloudinary(challanPhoto)  : undefined;
    const bill_image     = billPhoto     && billPhoto.size     > 0 ? await uploadToCloudinary(billPhoto)     : undefined;

    await sql`
      UPDATE dmr_entries SET
        arrival_date     = ${formData.get("dateOfArrival") as string},
        supplier_id      = ${formData.get("supplierId") as string}::uuid,
        material_id      = ${formData.get("materialId") as string}::uuid,
        site_id          = ${formData.get("siteId") ? (formData.get("siteId") as string) : null}${formData.get("siteId") ? sql`::uuid` : sql``},
        quantity         = ${isNaN(quantity)     ? null : quantity},
        unit             = ${formData.get("unit") || null},
        vehicle_number   = ${formData.get("vehicleNumber")  || null},
        invoice_number   = ${formData.get("invoiceNumber")  || null},
        rate_per_unit    = ${isNaN(rate_per_unit) ? null : rate_per_unit},
        gst_applicable   = ${formData.get("gstApplicable") === "true"},
        gst_type         = ${formData.get("gstType")    || null},
        gst_percentage   = ${gst_percentage},
        gst_amount       = ${gst_amount},
        final_bill_amount = ${isNaN(final_bill) ? null : final_bill},
        payment_status   = ${formData.get("paymentStatus") || null},
        payment_date     = ${formData.get("paymentDate")   || null},
        remarks          = ${formData.get("remarks")       || null},
        updated_at       = NOW(),
        updated_by       = ${session.user.id}::uuid,
        material_image   = COALESCE(${material_image ?? null}, material_image),
        vehicle_photo    = COALESCE(${vehicle_photo  ?? null}, vehicle_photo),
        challan_image    = COALESCE(${challan_image  ?? null}, challan_image),
        bill_image       = COALESCE(${bill_image     ?? null}, bill_image)
      WHERE id = ${id}::uuid
    `;

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
    await sql`
      UPDATE dmr_entries
      SET deleted_at = NOW(), deleted_by = ${session.user.id}::uuid
      WHERE id = ${id}::uuid
    `;

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

    // Fetch existing lookup data
    const [existingSuppliers, existingMaterials, existingSites] = await Promise.all([
      sql`SELECT id, supplier_name FROM suppliers WHERE deleted_at IS NULL`,
      sql`SELECT id, material_name FROM materials WHERE deleted_at IS NULL`,
      sql`SELECT id, site_name FROM sites WHERE deleted_at IS NULL`,
    ]);

    const supplierMap = new Map(existingSuppliers.map((s: any) => [s.supplier_name.toLowerCase().trim(), s.id]));
    const materialMap = new Map(existingMaterials.map((m: any) => [m.material_name.toLowerCase().trim(), m.id]));
    const siteMap     = new Map(existingSites.map((s: any) => [s.site_name.toLowerCase().trim(), s.id]));

    const getOrCreateSupplier = async (name: string) => {
      const key = name.toLowerCase().trim();
      if (supplierMap.has(key)) return supplierMap.get(key);
      const [row] = await sql`
        INSERT INTO suppliers (supplier_name, created_by)
        VALUES (${name}, ${session.user.id}::uuid)
        RETURNING id
      `;
      supplierMap.set(key, row.id);
      return row.id;
    };

    const getOrCreateMaterial = async (name: string, unit: string, rate: number) => {
      const key = name.toLowerCase().trim();
      if (materialMap.has(key)) return materialMap.get(key);
      const [row] = await sql`
        INSERT INTO materials (material_name, default_unit, default_rate, created_by)
        VALUES (${name}, ${unit || null}, ${rate || null}, ${session.user.id}::uuid)
        RETURNING id
      `;
      materialMap.set(key, row.id);
      return row.id;
    };

    const getOrCreateSite = async (name: string) => {
      const key = name.toLowerCase().trim();
      if (siteMap.has(key)) return siteMap.get(key);
      const [row] = await sql`
        INSERT INTO sites (site_name, created_by)
        VALUES (${name}, ${session.user.id}::uuid)
        RETURNING id
      `;
      siteMap.set(key, row.id);
      return row.id;
    };

    const currentYear = new Date().getFullYear();
    let insertedCount = 0;

    for (let i = 0; i < entries.length; i++) {
      const row = entries[i];
      if (!row["Arrival Date"] || !row["Supplier Name"] || !row["Material Name"] || !row["Quantity"]) continue;

      const supplier_id = await getOrCreateSupplier(row["Supplier Name"]);
      const material_id = await getOrCreateMaterial(row["Material Name"], row["Unit"], parseFloat(row["Rate Per Unit"] || "0"));
      const site_id     = row["Site Name"] ? await getOrCreateSite(row["Site Name"]) : null;

      const timestampSuffix = Date.now().toString().slice(-6) + i;
      const dmr_number = `DMR-${currentYear}-B${timestampSuffix}`;

      await sql`
        INSERT INTO dmr_entries (
          dmr_number, arrival_date, supplier_id, material_id, site_id,
          quantity, unit, vehicle_number, invoice_number,
          rate_per_unit, final_bill_amount, payment_status, remarks, created_by
        ) VALUES (
          ${dmr_number},
          ${row["Arrival Date"]},
          ${supplier_id}::uuid,
          ${material_id}::uuid,
          ${site_id ? site_id : null}${site_id ? sql`::uuid` : sql``},
          ${parseFloat(row["Quantity"])},
          ${row["Unit"] || "Nos"},
          ${row["Vehicle Number"] || null},
          ${row["Invoice Number"] || null},
          ${row["Rate Per Unit"] ? parseFloat(row["Rate Per Unit"]) : null},
          ${row["Final Bill Amount"] ? parseFloat(row["Final Bill Amount"]) : null},
          ${row["Payment Status"] === "Paid" ? "Paid" : "Not Paid"},
          ${row["Remarks"] || null},
          ${session.user.id}::uuid
        )
      `;
      insertedCount++;
    }

    revalidatePath("/", "layout");
    return { success: true, insertedCount };
  } catch (error: any) {
    console.error("Bulk Upload Error:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}
