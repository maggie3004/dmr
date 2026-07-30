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
      materials ( material_name ),
      sites ( site_name )
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6 md:space-y-8 w-full max-w-full overflow-hidden">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">All Entries</h1>
        <p className="text-gray-500 mt-1">View and manage all Daily Material Reports.</p>
      </div>
      
      <EntriesClient 
        entries={entries || []} 
      />
    </div>
  );
}
