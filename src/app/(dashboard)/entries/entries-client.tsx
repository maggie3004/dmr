"use client";

import { useState, useRef } from "react";
import { Search, Edit, MoreVertical, CreditCard, Upload, Printer, Trash2 } from "lucide-react";
import { updatePaymentStatus, bulkUploadInventory, deleteDmrEntry } from "@/app/actions/inventory";
import Link from "next/link";
import * as XLSX from "xlsx";

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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  
  // Bulk Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Details Modal State
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const filteredEntries = entries.filter(e => {
    const s = search.toLowerCase();
    return (
      e.dmr_number?.toLowerCase().includes(s) ||
      e.suppliers?.supplier_name?.toLowerCase().includes(s) ||
      (e.materials?.material_name || e.material_name)?.toLowerCase().includes(s) ||
      e.sites?.site_name?.toLowerCase().includes(s) ||
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

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this entry? This action cannot be undone.")) return;
    
    setUpdatingId(id);
    try {
      const res = await deleteDmrEntry(id);
      if (!res.success) {
        alert(res.error || "Failed to delete entry");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting.");
    } finally {
      setUpdatingId(null);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      "Arrival Date": "2026-07-29",
      "Supplier Name": "ABC Supplier",
      "Material Name": "Sand",
      "Site Name": "Main Site",
      "Quantity": "100",
      "Unit": "Ton",
      "Vehicle Number": "MH-12-1234",
      "Invoice Number": "INV-100",
      "Rate Per Unit": "50",
      "Final Bill Amount": "5000",
      "Payment Status": "Paid",
      "Remarks": "Sample entry"
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "DMR_Bulk_Upload_Template.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        alert("The uploaded file is empty.");
        return;
      }

      const res = await bulkUploadInventory(jsonData);
      if (res.success) {
        alert(`Successfully uploaded ${res.insertedCount} entries.`);
        window.location.reload();
      } else {
        alert("Upload failed: " + res.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error parsing file. Please ensure it matches the template format.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };



  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search entries..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={downloadTemplate} className="bg-white w-full">
            Template
          </Button>
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isUploading}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full"
          >
            {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Upload
          </Button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        <Table className="min-w-full">
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              <TableHead>DMR Number</TableHead>
              <TableHead>Arrival Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Site</TableHead>
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
                <TableCell colSpan={11} className="text-center h-24 text-gray-500">
                  No entries found.
                </TableCell>
              </TableRow>
            ) : (
              filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell 
                    className="font-medium text-blue-600 cursor-pointer hover:underline"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    {entry.dmr_number}
                  </TableCell>
                  <TableCell suppressHydrationWarning>{new Date(entry.arrival_date).toLocaleDateString()}</TableCell>
                  <TableCell>{entry.suppliers?.supplier_name || "-"}</TableCell>
                  <TableCell>{entry.materials?.material_name || "-"}</TableCell>
                  <TableCell>{entry.sites?.site_name || "-"}</TableCell>
                  <TableCell>{entry.quantity} {entry.unit}</TableCell>
                  <TableCell>
                    <div className="text-sm">{entry.vehicle_number || '-'}</div>
                    <div className="text-xs text-gray-500">{entry.invoice_number || '-'}</div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>₹{entry.final_bill_amount}</div>
                    {entry.gst_applicable && entry.gst_amount && (
                      <div className="text-[10px] text-gray-500 font-normal mt-1">
                        Inc. GST: ₹{entry.gst_amount} ({entry.gst_percentage}%)
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Popover>
                      <PopoverTrigger
                        className="hover:opacity-80 transition cursor-pointer text-left"
                        onClick={() => {
                          setPaymentStatus(entry.payment_status);
                          setPaymentDate(entry.payment_date || "");
                        }}
                      >
                        <Badge variant="outline" className={`px-2.5 py-0.5 rounded-full border-0 ring-1 ring-inset ${
                          entry.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 hover:bg-emerald-100' : 'bg-amber-50 text-amber-700 ring-amber-600/20 hover:bg-amber-100'
                        }`}>
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
                  <TableCell className="text-right whitespace-nowrap">
                    <Link href={`/entries/${entry.id}/edit`}>
                      <button 
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                        title="Edit Entry"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </Link>
                    <button 
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition ml-1"
                      title="Delete Entry"
                      onClick={() => handleDelete(entry.id)}
                      disabled={updatingId === entry.id}
                    >
                      {updatingId === entry.id ? <Loader2 className="h-4 w-4 animate-spin text-red-600" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4 w-full max-w-full overflow-hidden">
        {filteredEntries.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500 shadow-sm w-full">
            No entries found.
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div key={entry.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-3 w-full">
              <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                <div>
                  <div 
                    className="font-bold text-primary cursor-pointer hover:underline text-lg"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    {entry.dmr_number}
                  </div>
                  <div className="text-sm text-gray-500" suppressHydrationWarning>{new Date(entry.arrival_date).toLocaleDateString()}</div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/entries/${entry.id}/edit`}>
                    <button className="p-2 text-gray-500 bg-gray-50 rounded-md active:bg-gray-100 transition"><Edit className="w-4 h-4" /></button>
                  </Link>
                  <button 
                    className="p-2 text-red-500 bg-red-50 rounded-md active:bg-red-100 transition" 
                    onClick={() => handleDelete(entry.id)}
                    disabled={updatingId === entry.id}
                  >
                    {updatingId === entry.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-500 text-xs">Supplier</div>
                  <div className="font-medium truncate pr-2">{entry.suppliers?.supplier_name || "-"}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Material</div>
                  <div className="font-medium truncate pr-2">{entry.materials?.material_name || "-"}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Site</div>
                  <div className="font-medium truncate pr-2">{entry.sites?.site_name || "-"}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Qty</div>
                  <div className="font-medium">{entry.quantity} {entry.unit}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Vehicle</div>
                  <div className="font-medium uppercase truncate pr-2">{entry.vehicle_number || '-'}</div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 flex justify-between items-end">
                <div>
                  <div className="text-gray-500 text-xs mb-1">Bill Amount</div>
                  <div className="text-lg font-bold text-gray-900">₹{entry.final_bill_amount}</div>
                  {entry.gst_applicable && entry.gst_amount && (
                    <div className="text-[10px] text-gray-500">Inc. GST: ₹{entry.gst_amount}</div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Popover>
                    <PopoverTrigger
                      className="active:opacity-70 transition cursor-pointer"
                      onClick={() => {
                        setPaymentStatus(entry.payment_status);
                        setPaymentDate(entry.payment_date || "");
                      }}
                    >
                      <Badge variant="outline" className={`px-2.5 py-0.5 rounded-full border-0 ring-1 ring-inset ${
                        entry.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-amber-50 text-amber-700 ring-amber-600/20'
                      }`}>
                        {entry.payment_status}
                      </Badge>
                    </PopoverTrigger>
                    <PopoverContent className="w-72" align="end">
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
                              <Input type="date" className="h-10 text-sm" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                            </div>
                          )}
                          <Button 
                            className="w-full h-11" 
                            disabled={updatingId === entry.id}
                            onClick={() => handleUpdatePayment(entry.id)}
                          >
                            {updatingId === entry.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Payment"}
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  {entry.payment_date && entry.payment_status === 'Paid' && (
                    <div suppressHydrationWarning className="text-[10px] text-gray-500">{new Date(entry.payment_date).toLocaleDateString()}</div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="flex flex-row items-center justify-between pr-8">
            <DialogTitle>DMR Details - {selectedEntry?.dmr_number}</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="grid grid-cols-2 gap-4 py-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Arrival Date</p>
                <p className="font-medium" suppressHydrationWarning>{new Date(selectedEntry.arrival_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Supplier</p>
                <p className="font-medium">{selectedEntry.suppliers?.supplier_name || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Material</p>
                <p className="font-medium">{selectedEntry.materials?.material_name || selectedEntry.material_name || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Site</p>
                <p className="font-medium">{selectedEntry.sites?.site_name || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Quantity</p>
                <p className="font-medium">{selectedEntry.quantity} {selectedEntry.unit}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Vehicle Number</p>
                <p className="font-medium">{selectedEntry.vehicle_number || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Invoice Number</p>
                <p className="font-medium">{selectedEntry.invoice_number || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Rate Per Unit</p>
                <p className="font-medium">₹{selectedEntry.rate_per_unit || 0}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Final Bill Amount</p>
                <p className="font-medium">₹{selectedEntry.final_bill_amount || 0}</p>
              </div>
              {selectedEntry.gst_applicable && (
                <div className="col-span-2 bg-gray-50 p-3 rounded-md border border-gray-100">
                  <p className="text-gray-500 mb-2 text-xs uppercase tracking-wider font-semibold">GST Details</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-gray-500">Rate:</span> <span className="font-medium">{selectedEntry.gst_percentage}%</span></div>
                    <div><span className="text-gray-500">Amount:</span> <span className="font-medium">₹{selectedEntry.gst_amount}</span></div>
                  </div>
                </div>
              )}
              <div className="col-span-2">
                <p className="text-gray-500 mb-1">Payment Status</p>
                <p className="font-medium">
                  <Badge variant="outline" className={selectedEntry.payment_status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                    {selectedEntry.payment_status}
                  </Badge>
                  {selectedEntry.payment_date && selectedEntry.payment_status === 'Paid' && (
                    <span className="ml-2 text-gray-500 text-xs" suppressHydrationWarning>
                      on {new Date(selectedEntry.payment_date).toLocaleDateString()}
                    </span>
                  )}
                </p>
              </div>
              {selectedEntry.remarks && (
                <div className="col-span-2">
                  <p className="text-gray-500 mb-1">Remarks</p>
                  <p className="font-medium text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-100">{selectedEntry.remarks}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
