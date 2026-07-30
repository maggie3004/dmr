import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { InventoryFormClient } from "../../../inventory-form/inventory-form-client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export default async function EditEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  
  if (session?.user?.role !== "Admin") {
    redirect("/");
  }

  const { id } = await params;

  // Fetch the entry
  const { data: entry } = await supabase
    .from('dmr_entries')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (!entry) {
    notFound();
  }

  // Fetch materials and suppliers for form
  const { data: suppliersData } = await supabase.from('suppliers').select('id, supplier_name').is('deleted_at', null);
  const suppliers = suppliersData || [];

  const { data: materialsData } = await supabase.from('materials').select('id, material_name, default_unit, default_rate').is('deleted_at', null).order('material_name');
  const materials = materialsData || [];

  const { data: sitesData } = await supabase.from('sites').select('id, site_name').is('deleted_at', null).order('site_name');
  const sites = sitesData || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
      <div className="flex items-center justify-center relative mb-6 md:mb-8">
        <Link href="/entries" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Edit Entry: {entry.dmr_number}</h1>
          <p className="text-gray-500">Update details for this Daily Material Report.</p>
        </div>
      </div>
      
      <InventoryFormClient 
        suppliers={suppliers} 
        materials={materials} 
        sites={sites}
        initialData={entry} 
      />
    </div>
  );
}
