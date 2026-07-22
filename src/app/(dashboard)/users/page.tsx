import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { UsersClient } from "./users-client";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function UsersPage() {
  const session = await auth();
  
  if (session?.user?.role !== "Admin") {
    redirect("/");
  }

  // In a real app we'd fetch users from Supabase
  const mockUsers = [
    {
      id: "1",
      name: "Admin User",
      email: "admin@dmr.com",
      role: "Admin",
      status: "Active",
      created_at: "2026-07-22"
    },
    {
      id: "2",
      name: "Site Supervisor",
      email: "supervisor@dmr.com",
      role: "Supervisor",
      status: "Active",
      created_at: "2026-07-22"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Manage Users</h1>
          <p className="text-gray-500">Add, edit, and manage system access for users.</p>
        </div>
      </div>
      
      <UsersClient users={mockUsers} />
    </div>
  );
}
