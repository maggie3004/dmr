"use client";

import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { Download, Printer, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export function ReportsClient({ entries }: { entries: any[] }) {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  // Filters
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [materialFilter, setMaterialFilter] = useState("");
  const [siteFilter, setSiteFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");

  const uniqueSuppliers = Array.from(new Set(entries.map(e => e.suppliers?.supplier_name).filter(Boolean)));
  const uniqueMaterials = Array.from(new Set(entries.map(e => e.materials?.material_name || e.material_name).filter(Boolean)));
  const uniqueSites = Array.from(new Set(entries.map(e => e.sites?.site_name).filter(Boolean)));

  const filteredEntries = entries.filter(e => {
    const matName = e.materials?.material_name || e.material_name || "";
    // Search Term
    const matchesSearch = e.dmr_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.suppliers?.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      matName.toLowerCase().includes(searchTerm.toLowerCase());
      
    // Exact Date Match
    let matchesDate = true;
    if (dateFilter) {
      if (e.arrival_date) {
        const localDateStr = new Date(e.arrival_date).toLocaleDateString('en-CA');
        matchesDate = localDateStr === dateFilter || e.arrival_date.startsWith(dateFilter);
      } else {
        matchesDate = false;
      }
    }
    
    // Filters
    const matchesSupplier = supplierFilter ? e.suppliers?.supplier_name === supplierFilter : true;
    const matchesMaterial = materialFilter ? matName === materialFilter : true;
    const matchesSite = siteFilter ? e.sites?.site_name === siteFilter : true;
    const matchesPayment = paymentFilter ? e.payment_status === paymentFilter : true;

    return matchesSearch && matchesDate && matchesSupplier && matchesMaterial && matchesSite && matchesPayment;
  });

  const groupedEntries = useMemo(() => {
    if (activeTab === "all") return { "All Records": filteredEntries };
    
    const groups: Record<string, typeof filteredEntries> = {};
    filteredEntries.forEach(e => {
      let key = "Unknown";
      if (activeTab === "supplier") key = e.suppliers?.supplier_name || "Unknown";
      else if (activeTab === "material") key = e.materials?.material_name || e.material_name || "Unknown";
      else if (activeTab === "site") key = e.sites?.site_name || "Unknown";
      else if (activeTab === "date") key = e.arrival_date ? new Date(e.arrival_date).toLocaleDateString() : "Unknown";
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });
    return groups;
  }, [filteredEntries, activeTab]);

  const exportExcel = () => {
    if (filteredEntries.length === 0) {
      alert("No data to export.");
      return;
    }
    const wb = XLSX.utils.book_new();
    
    Object.entries(groupedEntries).forEach(([groupName, groupData]) => {
      if (groupData.length === 0) return;
      const ws = XLSX.utils.json_to_sheet(groupData.map(e => ({
        "DMR Number": e.dmr_number,
        "Date": new Date(e.arrival_date).toLocaleDateString(),
        "Supplier": e.suppliers?.supplier_name || 'Unknown',
        "Material": e.materials?.material_name || e.material_name || '-',
        "Site": e.sites?.site_name || '-',
        "Quantity": e.quantity,
        "Unit": e.unit,
        "Rate": e.rate_per_unit,
        "Total Amount": e.final_bill_amount,
        "Vehicle": e.vehicle_number,
        "Payment": e.payment_status,
      })));
      let sheetName = groupName.substring(0, 31).replace(/[\\\/\?\*\[\]]/g, '');
      if (!sheetName) sheetName = "Sheet";
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });
    
    XLSX.writeFile(wb, `DMR_Report_${activeTab}.xlsx`);
  };

  const exportPDF = () => {
    const printContent = document.querySelector('.print-area')?.innerHTML;
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to print.");
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>DMR Report Statement</title>
          <style>
            @page { size: landscape; margin: 10mm; }
            body { font-family: system-ui, -apple-system, sans-serif; -webkit-print-color-adjust: exact; padding: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
            th { background-color: #f8fafc; font-weight: 600; color: #475569; }
            tr:nth-child(even) { background-color: #f8fafc; }
            h2 { font-size: 18px; color: #0f172a; margin-bottom: 16px; font-weight: 600; }
            .print\\:hidden, .md\\:hidden { display: none !important; }
          </style>
        </head>
        <body>
          <h2>DMR Statement Report</h2>
          ${printContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const tabs = [
    { id: "all", label: "All Records" },
    { id: "supplier", label: "Supplier Wise" },
    { id: "material", label: "Material Wise" },
    { id: "site", label: "Site Wise" },
    { id: "date", label: "Date Wise" },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden w-full">
      <div className="border-b border-gray-100 hide-on-print overflow-x-auto scrollbar-hide">
        <nav className="flex space-x-6 px-4 md:space-x-8 md:px-6 w-max min-w-full" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 md:p-6 w-full max-w-full overflow-hidden">
        <div className="bg-gray-50 p-4 rounded-xl mb-6 hide-on-print space-y-4 border border-gray-100">
          <div className="flex items-center justify-between mb-4 text-sm font-semibold text-gray-700">
            <button 
              className="flex items-center gap-2 md:cursor-default" 
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            >
              <Filter className="w-4 h-4" /> Filters {isFiltersOpen ? <ChevronUp className="w-4 h-4 md:hidden" /> : <ChevronDown className="w-4 h-4 md:hidden" />}
            </button>
            {(searchTerm || dateFilter || supplierFilter || materialFilter || paymentFilter) && (
              <button 
                onClick={() => {
                  setSearchTerm("");
                  setDateFilter("");
                  setSupplierFilter("");
                  setMaterialFilter("");
                  setSiteFilter("");
                  setPaymentFilter("");
                }}
                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
          
          <div className={`${isFiltersOpen ? 'block' : 'hidden'} md:block space-y-4`}>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="space-y-1">
              <Label>Search</Label>
              <Input 
                placeholder="Search..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            <div className="space-y-1">
              <Label>Date</Label>
              <Input 
                type="date" 
                value={dateFilter} 
                onChange={(e) => setDateFilter(e.target.value)} 
              />
            </div>
            <div className="space-y-1">
              <Label>Supplier</Label>
              <select 
                className="w-full h-10 px-3 py-2 rounded-md border border-gray-300 bg-white text-sm"
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
              >
                <option value="">All Suppliers</option>
                {uniqueSuppliers.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Material</Label>
              <select 
                className="w-full h-10 px-3 py-2 rounded-md border border-gray-300 bg-white text-sm"
                value={materialFilter}
                onChange={(e) => setMaterialFilter(e.target.value)}
              >
                <option value="">All Materials</option>
                {uniqueMaterials.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Site</Label>
              <select 
                className="w-full h-10 px-3 py-2 rounded-md border border-gray-300 bg-white text-sm"
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
              >
                <option value="">All Sites</option>
                {uniqueSites.map(s => (
                  <option key={s as string} value={s as string}>{s as string}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Payment Status</Label>
              <select 
                className="w-full h-10 px-3 py-2 rounded-md border border-gray-300 bg-white text-sm"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Not Paid">Not Paid</option>
              </select>
            </div>
          </div>
          </div>
          
          {activeTab === 'all' && (
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={exportPDF}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm w-full md:w-auto justify-center"
              >
                <Printer className="w-4 h-4" /> Print PDF
              </button>
              <button
                onClick={exportExcel}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 text-sm w-full md:w-auto justify-center"
              >
                <Download className="w-4 h-4" /> Export All
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto print-area">
          {Object.entries(groupedEntries).map(([groupName, groupData]) => (
            <div key={groupName} className="mb-8 last:mb-0">
              {activeTab !== "all" && (
                <h3 className="text-lg font-semibold text-gray-800 mb-3 bg-gray-50 px-4 py-2 rounded-t-lg border-x border-t border-gray-200">
                  {activeTab === "supplier" && "Supplier: "}
                  {activeTab === "material" && "Material: "}
                  {activeTab === "site" && "Site: "}
                  {activeTab === "date" && "Date: "}
                  {groupName}
                </h3>
              )}
              {/* Desktop Table View */}
              <div className="hidden md:block bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                <table className={`min-w-full divide-y divide-gray-100`}>
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">DMR Number</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Material</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Site</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty/Unit</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {groupData.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer hover:underline"
                        onClick={() => setSelectedEntry(entry)}
                      >
                        {entry.dmr_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" suppressHydrationWarning>{new Date(entry.arrival_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.suppliers?.supplier_name || 'Unknown'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.materials?.material_name || entry.material_name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.sites?.site_name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.quantity} {entry.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{entry.final_bill_amount?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ring-1 ring-inset ${
                          entry.payment_status === "Paid" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-amber-50 text-amber-700 ring-amber-600/20"
                        }`}>
                          {entry.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {groupData.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center h-24 text-gray-500">
                        No reports match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 print:hidden">
                {groupData.map((entry) => (
                  <div key={entry.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-3">
                    <div className="flex justify-between items-start border-b border-gray-50 pb-2">
                      <div>
                        <div 
                          className="font-bold text-primary cursor-pointer hover:underline text-lg"
                          onClick={() => setSelectedEntry(entry)}
                        >
                          {entry.dmr_number}
                        </div>
                        <div className="text-sm text-gray-500" suppressHydrationWarning>{new Date(entry.arrival_date).toLocaleDateString()}</div>
                      </div>
                      <Badge variant="outline" className={entry.payment_status === 'Paid' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-amber-100 text-amber-800 border-amber-200'}>
                        {entry.payment_status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div className="text-gray-500">Supplier</div>
                      <div className="font-medium text-right truncate pl-2">{entry.suppliers?.supplier_name || 'Unknown'}</div>
                      
                      <div className="text-gray-500">Material</div>
                      <div className="font-medium text-right truncate pl-2">{entry.materials?.material_name || entry.material_name || '-'}</div>

                      <div className="text-gray-500">Site</div>
                      <div className="font-medium text-right truncate pl-2">{entry.sites?.site_name || '-'}</div>
                      
                      <div className="text-gray-500">Qty</div>
                      <div className="font-medium text-right">{entry.quantity} {entry.unit}</div>
                      
                      <div className="text-gray-500">Amount</div>
                      <div className="font-bold text-gray-900 text-right">₹{entry.final_bill_amount?.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
                {groupData.length === 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500 shadow-sm">
                    No reports match the current filters.
                  </div>
                )}
              </div>
            </div>
          ))}
          {Object.keys(groupedEntries).length === 0 && (
            <div className="text-center h-24 text-gray-500 flex items-center justify-center">
              No reports match the current filters.
            </div>
          )}
        </div>
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
                  <Badge variant="outline" className={selectedEntry.payment_status === 'Paid' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-amber-100 text-amber-800 border-amber-200'}>
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
