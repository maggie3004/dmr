import { auth } from "@/auth";

export default async function SettingsPage() {
  const session = await auth();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your account and preferences.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <div className="mt-1 p-2 bg-gray-50 border rounded-md text-gray-900">{session?.user?.name}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <div className="mt-1 p-2 bg-gray-50 border rounded-md text-gray-900">{session?.user?.email}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <div className="mt-1 p-2 bg-gray-50 border rounded-md text-gray-900">{session?.user?.role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
