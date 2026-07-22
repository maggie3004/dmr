"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

export function ReportsClient({ entries }: { entries: any[] }) {
  const [activeTab, setActiveTab] = useState("supplier");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEntries = entries.filter(e => 
    e.dmr_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.supplier.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.material_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredEntries.map(e => ({
      "DMR Number": e.dmr_number,
      "Date": e.arrival_date,
      "Supplier": e.supplier.supplier_name,
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

  const tabs = [
    { id: "supplier", label: "Supplier Wise" },
    { id: "material", label: "Material Wise" },
    { id: "date", label: "Date Wise" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="border-b border-gray-200">
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
        <div className="flex justify-between items-center mb-6">
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={exportExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Export to Excel
          </button>
        </div>

        <div className="overflow-x-auto">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.supplier.supplier_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.material_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.quantity} {entry.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{entry.final_bill_amount.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      entry.payment_status === "Paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {entry.payment_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
