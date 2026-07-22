import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ReportsClient } from "./reports-client";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function ReportsPage() {
  const session = await auth();
  
  if (session?.user?.role !== "Admin") {
    redirect("/");
  }

  // Mock data since we can't seed DB easily here
  const mockEntries = [
    {
      id: "1",
      dmr_number: "DMR-2026-000001",
      supplier: { supplier_name: "UltraTech Cement" },
      material_name: "Cement",
      quantity: 500,
      unit: "Bags",
      rate_per_unit: 350,
      final_bill_amount: 175000,
      payment_status: "Paid",
      arrival_date: "2026-07-22",
      vehicle_number: "MH-12-AB-1234"
    },
    {
      id: "2",
      dmr_number: "DMR-2026-000002",
      supplier: { supplier_name: "Tata Steel" },
      material_name: "Steel",
      quantity: 1000,
      unit: "Kg",
      rate_per_unit: 65,
      final_bill_amount: 65000,
      payment_status: "Not Paid",
      arrival_date: "2026-07-22",
      vehicle_number: "MH-14-CD-5678"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Reports Module</h1>
        <p className="text-gray-500">View, filter, and export detailed material reports.</p>
      </div>
      
      <ReportsClient entries={mockEntries} />
    </div>
  );
}
