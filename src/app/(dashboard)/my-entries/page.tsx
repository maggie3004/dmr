import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { MyEntriesClient } from "./my-entries-client";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export default async function MyEntriesPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  // Fetch only DMR entries created by this user
  const { data: entries } = await supabase
    .from('dmr_entries')
    .select(`
      *,
      suppliers ( supplier_name ),
      materials ( material_name )
    `)
    .eq('created_by', session.user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">My Entries</h1>
        <p className="text-gray-500 mt-1">View DMR entries created by you.</p>
      </div>
      
      <MyEntriesClient entries={entries || []} />
    </div>
  );
}
