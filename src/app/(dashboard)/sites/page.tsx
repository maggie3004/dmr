import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAllSitesAdmin } from "@/app/actions/sites";
import { SitesClient } from "./sites-client";

export const dynamic = 'force-dynamic';

export default async function SitesPage() {
  const session = await auth();

  if (session?.user?.role !== "Admin") {
    redirect("/");
  }

  const result = await getAllSitesAdmin();
  const sites = result.success ? result.sites || [] : [];

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Manage Construction Sites</h1>
        <p className="text-gray-500 mt-1">Add, edit, and manage project sites and location addresses.</p>
      </div>

      <SitesClient initialSites={sites} />
    </div>
  );
}
