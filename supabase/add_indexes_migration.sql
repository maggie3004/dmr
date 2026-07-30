-- Add indexes to foreign keys to speed up table joins
CREATE INDEX IF NOT EXISTS idx_dmr_entries_supplier_id ON dmr_entries(supplier_id);
CREATE INDEX IF NOT EXISTS idx_dmr_entries_material_id ON dmr_entries(material_id);
CREATE INDEX IF NOT EXISTS idx_dmr_entries_site_id ON dmr_entries(site_id);

-- Add indexes to frequently filtered and sorted columns
CREATE INDEX IF NOT EXISTS idx_dmr_entries_deleted_at ON dmr_entries(deleted_at);
CREATE INDEX IF NOT EXISTS idx_dmr_entries_created_at ON dmr_entries(created_at DESC);

-- Also add deleted_at index for other tables just in case they grow large
CREATE INDEX IF NOT EXISTS idx_suppliers_deleted_at ON suppliers(deleted_at);
CREATE INDEX IF NOT EXISTS idx_materials_deleted_at ON materials(deleted_at);
CREATE INDEX IF NOT EXISTS idx_sites_deleted_at ON sites(deleted_at);
