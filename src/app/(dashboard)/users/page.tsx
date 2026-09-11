import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { UsersClient } from "./users-client";

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  // Run auth + DB query in parallel
  const [session, users] = await Promise.all([
    auth(),
    sql`SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC`,
  ]);

  if (session?.user?.role !== "Admin") {
    redirect("/");
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Manage Users</h1>
        <p className="text-gray-500 mt-1">Add, edit, and manage system access for users.</p>
      </div>

      <UsersClient users={users || []} />
    </div>
  );
}
