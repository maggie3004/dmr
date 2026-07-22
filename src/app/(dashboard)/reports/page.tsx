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

  const { data: entries } = await supabase
    .from('dmr_entries')
    .select('*, suppliers(supplier_name)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Reports Module</h1>
        <p className="text-gray-500">View, filter, and export detailed material reports.</p>
      </div>
      
      <ReportsClient entries={entries || []} />
    </div>
  );
}
