import { auth } from "@/auth";
import { InventoryFormClient } from "./inventory-form-client";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin client to fetch lookup data
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export default async function InventoryFormPage() {
  const session = await auth();
  
  const { data: suppliersData } = await supabase.from('suppliers').select('id, supplier_name');
  const suppliers = suppliersData?.map(s => ({ id: s.id, name: s.supplier_name })) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Inventory Form</h1>
        <p className="text-gray-500">Submit a Daily Material Report (DMR).</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <InventoryFormClient suppliers={suppliers || []} />
      </div>
    </div>
  );
}
