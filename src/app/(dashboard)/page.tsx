import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package2, Truck, Users, Clock, CheckCircle, BarChart3 } from "lucide-react";
import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  // In a real app, you would fetch these from Supabase
  const stats = [
    { title: "Total DMRs", value: "2,543", icon: Package2, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Today's Entries", value: "14", icon: Truck, color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Total Suppliers", value: "48", icon: Users, color: "text-indigo-600", bg: "bg-indigo-100" },
    { title: "Total Materials", value: "156", icon: Package2, color: "text-purple-600", bg: "bg-purple-100" },
    { title: "Pending Payments", value: "₹4.2L", icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
    { title: "Paid Bills", value: "₹28.5L", icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back, {session?.user?.name}. Here is what's happening today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Recent DMR Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Table placeholder */}
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Truck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">DMR-2026-00000{i}</p>
                    <p className="text-sm text-gray-500 truncate">UltraTech Cement • 500 Bags</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-gray-900">₹1,75,000</p>
                    <p className="text-xs text-green-600 font-medium">Paid</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Material Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[300px]">
            {/* Chart placeholder */}
            <div className="text-gray-400 text-sm flex flex-col items-center">
              <BarChart3 className="h-10 w-10 mb-2 opacity-20" />
              Chart Area (Recharts)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
