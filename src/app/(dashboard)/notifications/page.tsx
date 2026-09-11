import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getNotifications } from "@/app/actions/notifications";
import { NotificationsClient } from "./notifications-client";

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const notifications = await getNotifications();

  return (
    <div className="space-y-6 md:space-y-8 max-w-4xl mx-auto">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Notifications</h1>
        <p className="text-gray-500 mt-1">View recent updates, inventory entries, and activity alerts.</p>
      </div>

      <NotificationsClient initialNotifications={notifications} />
    </div>
  );
}
