"use client";

import { useState } from "react";
import { Search, Edit, MoreVertical, CreditCard } from "lucide-react";
import { updatePaymentStatus } from "@/app/actions/inventory";
import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function EntriesClient({ 
  entries
}: { 
  entries: any[];
}) {
  const [search, setSearch] = useState("");
  
  // Popover specific state
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [paymentDate, setPaymentDate] = useState("");

  const filteredEntries = entries.filter(e => {
    const s = search.toLowerCase();
    return (
      e.dmr_number?.toLowerCase().includes(s) ||
      e.suppliers?.supplier_name?.toLowerCase().includes(s) ||
      e.materials?.material_name?.toLowerCase().includes(s) ||
      e.vehicle_number?.toLowerCase().includes(s) ||
      e.invoice_number?.toLowerCase().includes(s)
    );
  });

  const handleUpdatePayment = async (id: string) => {
    setUpdatingId(id);
    try {
      const res = await updatePaymentStatus(id, paymentStatus, paymentDate);
      if (res.success) {
        window.location.reload();
      } else {
        alert(res.error);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search by DMR, Supplier, Material, Vehicle, Invoice..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto shadow-sm">
        <Table className="min-w-max">
          <TableHeader>
            <TableRow>
              <TableHead>DMR Number</TableHead>
              <TableHead>Arrival Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Qty/Unit</TableHead>
              <TableHead>Vehicle / Invoice</TableHead>
              <TableHead>Bill Amount</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center h-24 text-gray-500">
                  No entries found.
                </TableCell>
              </TableRow>
            ) : (
              filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium text-blue-600">{entry.dmr_number}</TableCell>
                  <TableCell suppressHydrationWarning>{new Date(entry.arrival_date).toLocaleDateString()}</TableCell>
                  <TableCell>{entry.suppliers?.supplier_name || "-"}</TableCell>
                  <TableCell>{entry.materials?.material_name || "-"}</TableCell>
                  <TableCell>{entry.quantity} {entry.unit}</TableCell>
                  <TableCell>
                    <div className="text-sm">{entry.vehicle_number || '-'}</div>
                    <div className="text-xs text-gray-500">{entry.invoice_number || '-'}</div>
                  </TableCell>
                  <TableCell className="font-medium">₹{entry.final_bill_amount}</TableCell>
                  <TableCell>
                    <Popover>
                      <PopoverTrigger
                        className="hover:opacity-80 transition cursor-pointer text-left"
                        onClick={() => {
                          setPaymentStatus(entry.payment_status);
                          setPaymentDate(entry.payment_date || "");
                        }}
                      >
                        <Badge variant="outline" className={entry.payment_status === 'Paid' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-amber-100 text-amber-800 border-amber-200'}>
                          {entry.payment_status}
                        </Badge>
                        {entry.payment_date && entry.payment_status === 'Paid' && (
                          <div suppressHydrationWarning className="text-[10px] text-gray-500 mt-1">{new Date(entry.payment_date).toLocaleDateString()}</div>
                        )}
                      </PopoverTrigger>
                      <PopoverContent className="w-72" align="center">
                        <div className="space-y-4">
                          <h4 className="font-medium text-sm border-b pb-2">Update Payment</h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input type="radio" value="Paid" checked={paymentStatus === "Paid"} onChange={(e) => setPaymentStatus(e.target.value)} />
                                Paid
                              </label>
                              <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input type="radio" value="Not Paid" checked={paymentStatus === "Not Paid"} onChange={(e) => setPaymentStatus(e.target.value)} />
                                Not Paid
                              </label>
                            </div>
                            {paymentStatus === "Paid" && (
                              <div className="space-y-1">
                                <Label className="text-xs">Payment Date</Label>
                                <Input type="date" className="h-8 text-sm" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                              </div>
                            )}
                            <Button 
                              size="sm" 
                              className="w-full" 
                              disabled={updatingId === entry.id}
                              onClick={() => handleUpdatePayment(entry.id)}
                            >
                              {updatingId === entry.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Payment"}
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                    <div suppressHydrationWarning>{new Date(entry.created_at).toLocaleDateString()}</div>
                    <div className="text-[10px] truncate max-w-[80px]" title={entry.created_by}>{entry.created_by}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/entries/${entry.id}/edit`}>
                      <button 
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                        title="Edit Entry"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
