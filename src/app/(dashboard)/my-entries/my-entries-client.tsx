"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export function MyEntriesClient({ entries }: { entries: any[] }) {
  const [search, setSearch] = useState("");

  const filteredEntries = entries.filter(e => 
    e.dmr_number.toLowerCase().includes(search.toLowerCase()) ||
    e.suppliers?.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.material_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search my entries..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>DMR Number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Bill Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-gray-500">
                  No entries found.
                </TableCell>
              </TableRow>
            ) : (
              filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.dmr_number}</TableCell>
                  <TableCell>{new Date(entry.arrival_date).toLocaleDateString()}</TableCell>
                  <TableCell>{entry.suppliers?.supplier_name || "-"}</TableCell>
                  <TableCell>{entry.material_name}</TableCell>
                  <TableCell>{entry.quantity} {entry.unit}</TableCell>
                  <TableCell>₹{entry.final_bill_amount}</TableCell>
                  <TableCell>
                    <Badge variant={entry.payment_status === 'Paid' ? 'default' : 'secondary'} className={entry.payment_status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {entry.payment_status}
                    </Badge>
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
