"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Download, Printer, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ReportsClient({ entries }: { entries: any[] }) {
  const [activeTab, setActiveTab] = useState("supplier");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [materialFilter, setMaterialFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");

  const uniqueSuppliers = Array.from(new Set(entries.map(e => e.suppliers?.supplier_name).filter(Boolean)));
  const uniqueMaterials = Array.from(new Set(entries.map(e => e.material_name).filter(Boolean)));

  const filteredEntries = entries.filter(e => {
    // Search Term
    const matchesSearch = e.dmr_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.suppliers?.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.material_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
    // Date Range
    let matchesDate = true;
    if (startDate) matchesDate = matchesDate && new Date(e.arrival_date) >= new Date(startDate);
    if (endDate) matchesDate = matchesDate && new Date(e.arrival_date) <= new Date(endDate);
    
    // Filters
    const matchesSupplier = supplierFilter ? e.suppliers?.supplier_name === supplierFilter : true;
    const matchesMaterial = materialFilter ? e.material_name === materialFilter : true;
    const matchesPayment = paymentFilter ? e.payment_status === paymentFilter : true;

    return matchesSearch && matchesDate && matchesSupplier && matchesMaterial && matchesPayment;
  });

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredEntries.map(e => ({
      "DMR Number": e.dmr_number,
      "Date": e.arrival_date,
      "Supplier": e.suppliers?.supplier_name || 'Unknown',
      "Material": e.material_name,
      "Quantity": e.quantity,
      "Unit": e.unit,
      "Rate": e.rate_per_unit,
      "Total Amount": e.final_bill_amount,
      "Vehicle": e.vehicle_number,
      "Payment": e.payment_status,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reports");
    XLSX.writeFile(wb, "DMR_Report.xlsx");
  };

  const exportPDF = () => {
    window.print(); // Simple PDF export via browser print dialog
  };

  const tabs = [
    { id: "supplier", label: "Supplier Wise" },
    { id: "material", label: "Material Wise" },
    { id: "date", label: "Date Wise" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="border-b border-gray-200 hide-on-print">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
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

      <div className="p-6">
        <div className="bg-gray-50 p-4 rounded-lg mb-6 hide-on-print space-y-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
            <Filter className="w-4 h-4" /> Filters
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-1">
              <Label>Search</Label>
              <Input 
                placeholder="Search..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            <div className="space-y-1">
              <Label>Start Date</Label>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
              />
            </div>
            <div className="space-y-1">
              <Label>End Date</Label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
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
          
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={exportPDF}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
            >
              <Printer className="w-4 h-4" /> Print PDF
            </button>
            <button
              onClick={exportExcel}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" /> Export Excel
            </button>
          </div>
        </div>

        <div className="overflow-x-auto print-area">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DMR Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty/Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{entry.dmr_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.arrival_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.suppliers?.supplier_name || 'Unknown'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.material_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.quantity} {entry.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{entry.final_bill_amount?.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      entry.payment_status === "Paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {entry.payment_status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center h-24 text-gray-500">
                    No reports match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Print styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .hide-on-print { display: none !important; }
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}} />
    </div>
  );
}
