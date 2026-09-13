"use client";

import { useState } from "react";
import { Plus, Search, MapPin, User, Building2, Edit2, Trash2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { addSite, updateSite, deleteSite } from "@/app/actions/sites";
import { useRouter } from "next/navigation";

export function SitesClient({ initialSites }: { initialSites: any[] }) {
  const router = useRouter();
  const [sites, setSites] = useState<any[]>(initialSites);
  const [searchTerm, setSearchTerm] = useState("");

  // Add Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addAddress, setAddAddress] = useState("");
  const [addContact, setAddContact] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState("");

  // Edit Modal State
  const [editingSite, setEditingSite] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete State
  const [deletingSite, setDeletingSite] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) {
      setAddError("Site name is required.");
      return;
    }

    setAddError("");
    setIsAdding(true);

    try {
      const res = await addSite({
        site_name: addName.trim(),
        site_address: addAddress.trim(),
        contact_person: addContact.trim(),
      });

      if (res.success && res.site) {
        setSites([res.site, ...sites]);
        setIsAddOpen(false);
        setAddName("");
        setAddAddress("");
        setAddContact("");
        router.refresh();
      } else {
        setAddError(res.error || "Failed to add site.");
      }
    } catch (err) {
      setAddError("An unexpected error occurred.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditOpen = (site: any) => {
    setEditingSite(site);
    setEditName(site.site_name || "");
    setEditAddress(site.site_address || "");
    setEditContact(site.contact_person || "");
    setEditIsActive(site.is_active ?? true);
    setEditError("");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setEditError("Site name is required.");
      return;
    }

    setEditError("");
    setIsEditing(true);

    try {
      const res = await updateSite({
        id: editingSite.id,
        site_name: editName.trim(),
        site_address: editAddress.trim(),
        contact_person: editContact.trim(),
        is_active: editIsActive,
      });

      if (res.success) {
        setSites(prev => prev.map(s => s.id === editingSite.id ? {
          ...s,
          site_name: editName.trim(),
          site_address: editAddress.trim(),
          contact_person: editContact.trim(),
          is_active: editIsActive,
        } : s));
        setEditingSite(null);
        router.refresh();
      } else {
        setEditError(res.error || "Failed to update site.");
      }
    } catch (err) {
      setEditError("An unexpected error occurred.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingSite) return;
    setIsDeleting(true);

    try {
      const res = await deleteSite(deletingSite.id);
      if (res.success) {
        setSites(prev => prev.filter(s => s.id !== deletingSite.id));
        setDeletingSite(null);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredSites = sites.filter(s => 
    s.site_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.site_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm">
        <div className="relative flex-1 w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search sites or locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <Button 
          onClick={() => setIsAddOpen(true)}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Construction Site
        </Button>
      </div>

      {filteredSites.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No sites found</h3>
            <p className="text-sm text-gray-500 max-w-sm mt-1">
              {searchTerm ? "No sites match your search term." : "Get started by adding your first construction site."}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsAddOpen(true)} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" /> Add Site
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSites.map((site) => (
            <Card key={site.id} className="border border-gray-200/80 hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 flex-shrink-0">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base leading-snug">{site.site_name}</h3>
                        <p className="text-[11px] text-gray-400">Created {new Date(site.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {site.is_active ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-[10px] flex items-center gap-1 font-medium">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100 text-[10px] flex items-center gap-1 font-medium">
                        <XCircle className="h-3 w-3" /> Inactive
                      </Badge>
                    )}
                  </div>

                  {site.site_address && (
                    <div className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{site.site_address}</span>
                    </div>
                  )}

                  {site.contact_person && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 px-1">
                      <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{site.contact_person}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    {site.entry_count || 0} DMR Entries
                  </span>

                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEditOpen(site)}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setDeletingSite(site)}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Site Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <Building2 className="h-5 w-5 text-blue-600" />
              Add Construction Site
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="addName">Site Name <span className="text-red-500">*</span></Label>
              <Input
                id="addName"
                placeholder="e.g., Site Alpha - Residential Tower"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addAddress">Site Location / Address</Label>
              <Textarea
                id="addAddress"
                placeholder="e.g., Plot No 42, Hinjewadi IT Park Phase 1, Pune"
                value={addAddress}
                onChange={(e) => setAddAddress(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addContact">Site In-Charge / Contact Person</Label>
              <Input
                id="addContact"
                placeholder="e.g., Engr. Rajesh Sharma (+91 9876543210)"
                value={addContact}
                onChange={(e) => setAddContact(e.target.value)}
              />
            </div>

            {addError && (
              <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {addError}
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isAdding} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Add Site
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Site Modal */}
      <Dialog open={!!editingSite} onOpenChange={(open) => !open && setEditingSite(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <Edit2 className="h-5 w-5 text-blue-600" />
              Edit Construction Site
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="editName">Site Name <span className="text-red-500">*</span></Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editAddress">Site Location / Address</Label>
              <Textarea
                id="editAddress"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editContact">Site In-Charge / Contact Person</Label>
              <Input
                id="editContact"
                value={editContact}
                onChange={(e) => setEditContact(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div>
                <Label htmlFor="editIsActive" className="cursor-pointer font-medium">Active Status</Label>
                <p className="text-[11px] text-gray-500">Allow this site to be selected in DMR forms</p>
              </div>
              <input
                type="checkbox"
                id="editIsActive"
                checked={editIsActive}
                onChange={(e) => setEditIsActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded border-gray-300 cursor-pointer"
              />
            </div>

            {editError && (
              <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {editError}
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setEditingSite(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isEditing} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isEditing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deletingSite} onOpenChange={(open) => !open && setDeletingSite(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Delete Construction Site
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-gray-600">
            Are you sure you want to delete <strong className="text-gray-900">{deletingSite?.site_name}</strong>? This action cannot be undone.
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDeletingSite(null)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleDeleteSubmit} 
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Delete Site"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
