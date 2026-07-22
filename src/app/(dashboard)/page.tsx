import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package2, Truck, Users, Clock, CheckCircle, BarChart3 } from "lucide-react";
import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();

  // Fetch stats concurrently
  const [
    { count: totalDmrCount },
    { count: todayDmrCount },
    { count: totalSuppliersCount },
    { count: totalMaterialsCount },
    { data: allDmrs },
    { data: recentDmrs }
  ] = await Promise.all([
    supabase.from('dmr_entries').select('*', { count: 'exact', head: true }),
    supabase.from('dmr_entries').select('*', { count: 'exact', head: true }).eq('arrival_date', new Date().toISOString().split('T')[0]),
    supabase.from('suppliers').select('*', { count: 'exact', head: true }),
    supabase.from('materials').select('*', { count: 'exact', head: true }),
    supabase.from('dmr_entries').select('payment_status, final_bill_amount'),
    supabase.from('dmr_entries').select('id, dmr_number, material_name, quantity, unit, final_bill_amount, payment_status, suppliers(supplier_name)').order('created_at', { ascending: false }).limit(5)
  ]);

  let pendingPayments = 0;
  let paidBills = 0;
  
  if (allDmrs) {
    for (const dmr of allDmrs) {
      if (dmr.payment_status === "Paid") {
        paidBills += Number(dmr.final_bill_amount) || 0;
      } else {
        pendingPayments += Number(dmr.final_bill_amount) || 0;
      }
    }
  }

  const formatCurrency = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${val}`;
  };

  const stats = [
    { title: "Total DMRs", value: totalDmrCount || 0, icon: Package2, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Today's Entries", value: todayDmrCount || 0, icon: Truck, color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Total Suppliers", value: totalSuppliersCount || 0, icon: Users, color: "text-indigo-600", bg: "bg-indigo-100" },
    { title: "Total Materials", value: totalMaterialsCount || 0, icon: Package2, color: "text-purple-600", bg: "bg-purple-100" },
    { title: "Pending Payments", value: formatCurrency(pendingPayments), icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
    { title: "Paid Bills", value: formatCurrency(paidBills), icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100" },
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
            <div className="space-y-4">
              {recentDmrs && recentDmrs.length > 0 ? recentDmrs.map((dmr) => (
                <div key={dmr.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Truck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{dmr.dmr_number}</p>
                    <p className="text-sm text-gray-500 truncate">{((dmr.suppliers as any)?.supplier_name) || 'Unknown'} • {dmr.quantity} {dmr.unit}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-gray-900">₹{Number(dmr.final_bill_amount || 0).toLocaleString()}</p>
                    <p className={`text-xs font-medium ${dmr.payment_status === 'Paid' ? 'text-green-600' : 'text-amber-600'}`}>
                      {dmr.payment_status}
                    </p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-500 p-4 text-center">No entries found yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Material Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[300px]">
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
