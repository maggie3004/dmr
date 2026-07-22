"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

// Mock form submission action
import { submitInventoryForm } from "@/app/actions/inventory";

const materialUnits: Record<string, string> = {
  Cement: "Bags",
  Steel: "Kg",
  Sand: "Brass",
  Aggregate: "Brass",
  Bricks: "Nos",
  Paint: "Cans",
  Tiles: "Boxes",
  Pipes: "Pieces",
  Electrical: "Pieces",
  Plumbing: "Pieces",
};

const formSchema = z.object({
  dateOfArrival: z.string().min(1, "Date is required"),
  supplierId: z.string().min(1, "Supplier is required"),
  materialName: z.string().min(1, "Material name is required"),
  otherMaterialName: z.string().optional(),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  vehicleNumber: z.string().min(1, "Vehicle number is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  ratePerUnit: z.coerce.number().min(0, "Rate must be positive"),
  finalBillAmount: z.coerce.number().min(0, "Bill amount must be positive"),
  paymentStatus: z.enum(["Paid", "Not Paid"]),
  paymentDate: z.string().optional(),
  remarks: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function InventoryFormClient({ suppliers }: { suppliers: any[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [materialPhoto, setMaterialPhoto] = useState<File | null>(null);
  const [challanPhoto, setChallanPhoto] = useState<File | null>(null);
  const [billPhoto, setBillPhoto] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentStatus: "Not Paid",
      materialName: "",
    },
  });

  const watchMaterial = watch("materialName");
  const watchPaymentStatus = watch("paymentStatus");
  const watchQuantity = watch("quantity");
  const watchRate = watch("ratePerUnit");

  // Auto calculate final bill amount
  if (watchQuantity && watchRate) {
    const calculated = watchQuantity * watchRate;
    const current = watch("finalBillAmount");
    if (calculated !== current) {
      setValue("finalBillAmount", calculated);
    }
  }

  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setValue("materialName", val);
    if (val && val !== "Other") {
      setValue("unit", materialUnits[val] || "");
    } else {
      setValue("unit", "");
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setSuccess(false);

    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) formData.append(key, value.toString());
      });
      
      if (materialPhoto) formData.append("materialPhoto", materialPhoto);
      if (challanPhoto) formData.append("challanPhoto", challanPhoto);
      if (billPhoto) formData.append("billPhoto", billPhoto);

      const result = await submitInventoryForm(formData);
      
      if (result.success) {
        setSuccess(true);
        reset();
        setMaterialPhoto(null);
        setChallanPhoto(null);
        setBillPhoto(null);
        alert("DMR Entry saved successfully! DMR Number: " + result.dmrNumber);
      } else {
        alert("Error saving form: " + result.error);
      }
    } catch (error) {
      alert("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
          Form submitted successfully!
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">DMR Number</label>
          <input 
            type="text" 
            disabled 
            placeholder="Auto-generated on save" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Date of Arrival *</label>
          <input 
            type="date" 
            {...register("dateOfArrival")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          {errors.dateOfArrival && <p className="text-red-500 text-xs">{errors.dateOfArrival.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Supplier Name *</label>
          <select 
            {...register("supplierId")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="">Select Supplier</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {errors.supplierId && <p className="text-red-500 text-xs">{errors.supplierId.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Material Name *</label>
          <select 
            {...register("materialName")}
            onChange={handleMaterialChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="">Select Material</option>
            {Object.keys(materialUnits).map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
            <option value="Other">Other</option>
          </select>
          {errors.materialName && <p className="text-red-500 text-xs">{errors.materialName.message}</p>}
        </div>

        {watchMaterial === "Other" && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Other Material Name *</label>
            <input 
              type="text" 
              {...register("otherMaterialName")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Quantity *</label>
          <input 
            type="number"
            step="any"
            {...register("quantity")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {errors.quantity && <p className="text-red-500 text-xs">{errors.quantity.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Unit *</label>
          <input 
            type="text"
            {...register("unit")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {errors.unit && <p className="text-red-500 text-xs">{errors.unit.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Vehicle Number *</label>
          <input 
            type="text"
            {...register("vehicleNumber")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {errors.vehicleNumber && <p className="text-red-500 text-xs">{errors.vehicleNumber.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Invoice Number *</label>
          <input 
            type="text"
            {...register("invoiceNumber")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {errors.invoiceNumber && <p className="text-red-500 text-xs">{errors.invoiceNumber.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Rate Per Unit *</label>
          <input 
            type="number"
            step="any"
            {...register("ratePerUnit")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {errors.ratePerUnit && <p className="text-red-500 text-xs">{errors.ratePerUnit.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Final Bill Amount *</label>
          <input 
            type="number"
            step="any"
            {...register("finalBillAmount")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
            readOnly
          />
          {errors.finalBillAmount && <p className="text-red-500 text-xs">{errors.finalBillAmount.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-200">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Material Photo</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => setMaterialPhoto(e.target.files?.[0] || null)}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Challan Photo</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => setChallanPhoto(e.target.files?.[0] || null)}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Bill Photo</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => setBillPhoto(e.target.files?.[0] || null)}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 block">Payment Status *</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="radio" value="Paid" {...register("paymentStatus")} className="text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-gray-900">Paid</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" value="Not Paid" {...register("paymentStatus")} className="text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-gray-900">Not Paid</span>
            </label>
          </div>
        </div>

        {watchPaymentStatus === "Paid" && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Payment Date *</label>
            <input 
              type="date"
              {...register("paymentDate")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        )}

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-gray-700">Remarks</label>
          <textarea
            {...register("remarks")}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none resize-y"
            placeholder="Add any additional notes here..."
          ></textarea>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => reset()}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center min-w-[120px] disabled:opacity-70"
        >
          {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : "Save Entry"}
        </button>
      </div>
    </form>
  );
}
