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
  
  const { data: suppliersData } = await supabase.from('suppliers').select('id, supplier_name').is('deleted_at', null);
  const suppliers = suppliersData || [];

  const { data: materialsData } = await supabase.from('materials').select('id, material_name, default_unit, default_rate').is('deleted_at', null).order('material_name');
  const materials = materialsData || [];

  const { data: sitesData } = await supabase.from('sites').select('id, site_name').is('deleted_at', null).order('site_name');
  const sites = sitesData || [];

  return (
    <div className="max-w-4xl mx-auto">
      <InventoryFormClient suppliers={suppliers} materials={materials} sites={sites} />
    </div>
  );
}
