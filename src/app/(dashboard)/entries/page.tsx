import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { EntriesClient } from "./entries-client";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export default async function EntriesPage() {
  const session = await auth();
  
  if (session?.user?.role !== "Admin") {
    redirect("/");
  }

  // Fetch all DMR entries with supplier and user info
  const { data: entries } = await supabase
    .from('dmr_entries')
    .select(`
      *,
      suppliers ( supplier_name ),
      materials ( material_name )
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">All Entries</h1>
          <p className="text-gray-500">View and manage all Daily Material Reports.</p>
        </div>
      </div>
      
      <EntriesClient 
        entries={entries || []} 
      />
    </div>
  );
}
