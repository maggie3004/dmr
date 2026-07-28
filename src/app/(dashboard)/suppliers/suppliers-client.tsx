"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";
import { addSupplier, updateSupplier, deleteSupplier } from "@/app/actions/suppliers";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function SuppliersClient({ suppliers }: { suppliers: any[] }) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    supplier_name: "",
    contact_number: "",
    address: "",
    gst_number: ""
  });

  const filteredSuppliers = suppliers.filter(s => 
    s.supplier_name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contact_number && s.contact_number.includes(search))
  );

  const resetForm = () => {
    setFormData({
      supplier_name: "",
      contact_number: "",
      address: "",
      gst_number: ""
    });
    setIsEdit(false);
    setSelectedId(null);
  };

  const handleEdit = (supplier: any) => {
    setFormData({
      supplier_name: supplier.supplier_name,
      contact_number: supplier.contact_number || "",
      address: supplier.address || "",
      gst_number: supplier.gst_number || ""
    });
    setSelectedId(supplier.id);
    setIsEdit(true);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this supplier?")) {
      const res = await deleteSupplier(id);
      if (!res.success) {
        alert(res.error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let res;
      if (isEdit && selectedId) {
        res = await updateSupplier(selectedId, formData);
      } else {
        res = await addSupplier(formData);
      }
      
      if (res.success) {
        setIsOpen(false);
        resetForm();
      } else {
        alert(res.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search suppliers..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm font-medium">
            <Plus className="h-4 w-4" /> Add Supplier
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEdit ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="supplier_name">Supplier Name *</Label>
                <Input 
                  id="supplier_name"
                  required
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({...formData, supplier_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_number">Contact Number</Label>
                <Input 
                  id="contact_number"
                  value={formData.contact_number}
                  onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gst_number">GST Number</Label>
                <Input 
                  id="gst_number"
                  value={formData.gst_number}
                  onChange={(e) => setFormData({...formData, gst_number: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea 
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="flex justify-end pt-4">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2 min-w-[100px] justify-center"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>GST Number</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-gray-500">
                  No suppliers found.
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.supplier_name}</TableCell>
                  <TableCell>{supplier.contact_number || "-"}</TableCell>
                  <TableCell>{supplier.gst_number || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={supplier.address}>{supplier.address || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(supplier)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(supplier.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
