import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { SuppliersClient } from "./suppliers-client";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
  const session = await auth();
  
  if (session?.user?.role !== "Admin") {
    redirect("/");
  }

  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Manage Suppliers</h1>
          <p className="text-gray-500">Add, edit, and manage supplier master data.</p>
        </div>
      </div>
      
      <SuppliersClient suppliers={suppliers || []} />
    </div>
  );
}
