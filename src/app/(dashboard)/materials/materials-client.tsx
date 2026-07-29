"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";
import { addMaterial, updateMaterial, deleteMaterial } from "@/app/actions/materials";

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

export function MaterialsClient({ materials }: { materials: any[] }) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    material_name: "",
    default_unit: "",
    default_rate: "" as number | string
  });

  const filteredMaterials = materials.filter(m => 
    m.material_name.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      material_name: "",
      default_unit: "",
      default_rate: ""
    });
    setIsEdit(false);
    setSelectedId(null);
  };

  const handleEdit = (material: any) => {
    setFormData({
      material_name: material.material_name,
      default_unit: material.default_unit || "",
      default_rate: material.default_rate || ""
    });
    setSelectedId(material.id);
    setIsEdit(true);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this material?")) {
      const res = await deleteMaterial(id);
      if (!res.success) {
        alert(res.error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dataToSubmit = {
        ...formData,
        default_rate: formData.default_rate ? Number(formData.default_rate) : undefined
      };
      
      let res;
      if (isEdit && selectedId) {
        res = await updateMaterial(selectedId, dataToSubmit);
      } else {
        res = await addMaterial(dataToSubmit);
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search materials..." 
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
            <Plus className="h-4 w-4" /> Add Material
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEdit ? "Edit Material" : "Add New Material"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="material_name">Material Name *</Label>
                <Input 
                  id="material_name"
                  required
                  value={formData.material_name}
                  onChange={(e) => setFormData({...formData, material_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_unit">Default Unit</Label>
                <Input 
                  id="default_unit"
                  value={formData.default_unit}
                  onChange={(e) => setFormData({...formData, default_unit: e.target.value})}
                  placeholder="e.g. Bags, Kg, Nos"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_rate">Default Rate (₹)</Label>
                <Input 
                  id="default_rate"
                  type="number"
                  step="any"
                  value={formData.default_rate}
                  onChange={(e) => setFormData({...formData, default_rate: e.target.value})}
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

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              <TableHead>Material Name</TableHead>
              <TableHead>Default Unit</TableHead>
              <TableHead>Default Rate</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMaterials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24 text-gray-500">
                  No materials found.
                </TableCell>
              </TableRow>
            ) : (
              filteredMaterials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">{material.material_name}</TableCell>
                  <TableCell>{material.default_unit || "-"}</TableCell>
                  <TableCell>{material.default_rate ? `₹${material.default_rate}` : "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(material)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(material.id)}
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredMaterials.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 shadow-sm">
            No materials found.
          </div>
        ) : (
          filteredMaterials.map((material) => (
            <div key={material.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-3">
              <div className="flex justify-between items-start border-b border-gray-50 pb-2">
                <div>
                  <div className="font-bold text-gray-900 text-lg">{material.material_name}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    <span className="font-medium text-gray-700">Unit:</span> {material.default_unit || "-"} 
                    <span className="mx-2">•</span> 
                    <span className="font-medium text-gray-700">Rate:</span> {material.default_rate ? `₹${material.default_rate}` : "-"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(material)}
                    className="p-2 text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(material.id)}
                    className="p-2 text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
