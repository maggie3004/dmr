"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Check, ChevronsUpDown, Plus, Image as ImageIcon, Camera, Upload, ScanLine } from "lucide-react";
import Tesseract from 'tesseract.js';

import { submitInventoryForm, updateDmrEntry } from "@/app/actions/inventory";
import { addSupplier } from "@/app/actions/suppliers";
import { addMaterial } from "@/app/actions/materials";
import { addSite } from "@/app/actions/sites";

import { CameraCapture } from "@/components/ui/camera-capture";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const formSchema = z.object({
  dateOfArrival: z.string().min(1, "Date is required"),
  supplierId: z.string().min(1, "Supplier is required"),
  siteId: z.string().min(1, "Site is required"),
  materialId: z.string().min(1, "Material is required"),
  quantity: z.number({ message: "Quantity is required" }).min(0.01, "Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  vehicleNumber: z.string().min(1, "Vehicle number is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  ratePerUnit: z.number({ message: "Rate is required" }).min(0, "Rate must be positive"),
  finalBillAmount: z.number({ message: "Bill amount is required" }).min(0, "Bill amount must be positive"),
  paymentStatus: z.enum(["Paid", "Not Paid"]),
  paymentDate: z.string().optional(),
  gstApplicable: z.boolean().default(false),
  gstPercentage: z.number().optional(),
  gstAmount: z.number().optional(),
  gstType: z.enum(["Inclusive", "Exclusive"]).optional(),
  remarks: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function InventoryFormClient({ 
  suppliers: initialSuppliers,
  materials: initialMaterials,
  sites: initialSites,
  initialData,
  onSuccess
}: { 
  suppliers: any[];
  materials: any[];
  sites: any[];
  initialData?: any;
  onSuccess?: () => void;
}) {
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [materials, setMaterials] = useState(initialMaterials);
  const [sites, setSites] = useState(initialSites || []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dmrNumber, setDmrNumber] = useState<string | null>(initialData?.dmr_number || null);

  const [materialPhoto, setMaterialPhoto] = useState<File | null>(null);
  const [vehiclePhoto, setVehiclePhoto] = useState<File | null>(null);
  const [challanPhoto, setChallanPhoto] = useState<File | null>(null);
  const [billPhoto, setBillPhoto] = useState<File | null>(null);

  const [materialPreview, setMaterialPreview] = useState<string | null>(initialData?.material_image || null);
  const [vehiclePreview, setVehiclePreview] = useState<string | null>(initialData?.vehicle_photo || null);
  const [challanPreview, setChallanPreview] = useState<string | null>(initialData?.challan_image || null);
  const [billPreview, setBillPreview] = useState<string | null>(initialData?.bill_image || null);

  const [supplierOpen, setSupplierOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [siteOpen, setSiteOpen] = useState(false);
  
  const [cameraOpenFor, setCameraOpenFor] = useState<'material' | 'vehicle' | 'challan' | 'bill' | null>(null);
  
  const [supplierSearch, setSupplierSearch] = useState("");
  const [materialSearch, setMaterialSearch] = useState("");
  const [siteSearch, setSiteSearch] = useState("");

  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);

  const [addSiteOpen, setAddSiteOpen] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [isAddingSite, setIsAddingSite] = useState(false);

  const [isOcrLoading, setIsOcrLoading] = useState(false);

  // Add New Material State
  const [addMaterialOpen, setAddMaterialOpen] = useState(false);
  const [newMaterialName, setNewMaterialName] = useState("");
  const [newMaterialUnit, setNewMaterialUnit] = useState("");
  const [newMaterialRate, setNewMaterialRate] = useState("");
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      dateOfArrival: initialData?.arrival_date || new Date().toISOString().split('T')[0],
      supplierId: initialData?.supplier_id || "",
      siteId: initialData?.site_id || "",
      materialId: initialData?.material_id || "",
      quantity: initialData?.quantity || undefined,
      unit: initialData?.unit || "",
      vehicleNumber: initialData?.vehicle_number || "",
      invoiceNumber: initialData?.invoice_number || "",
      ratePerUnit: initialData?.rate_per_unit || undefined,
      finalBillAmount: initialData?.final_bill_amount || undefined,
      paymentStatus: initialData?.payment_status || "Not Paid",
      paymentDate: initialData?.payment_date || "",
      gstApplicable: initialData?.gst_applicable || false,
      gstPercentage: initialData?.gst_percentage || undefined,
      gstAmount: initialData?.gst_amount || undefined,
      gstType: initialData?.gst_type || "Exclusive",
      remarks: initialData?.remarks || "",
    },
  });

  const watchQuantity = watch("quantity");
  const watchRate = watch("ratePerUnit");
  const watchPaymentStatus = watch("paymentStatus");
  const watchMaterialId = watch("materialId");
  const watchGstApplicable = watch("gstApplicable");
  const watchGstPercentage = watch("gstPercentage");
  const watchGstType = watch("gstType");

  // Auto calculate final bill amount
  useEffect(() => {
    if (watchQuantity && watchRate) {
      let calculated = watchQuantity * watchRate;
      if (watchGstApplicable && watchGstType === "Exclusive" && watchGstPercentage) {
        const gstAmount = (calculated * watchGstPercentage) / 100;
        setValue("gstAmount", gstAmount);
        calculated += gstAmount;
      } else {
        setValue("gstAmount", undefined);
      }
      setValue("finalBillAmount", calculated);
    }
  }, [watchQuantity, watchRate, watchGstApplicable, watchGstPercentage, watchGstType, setValue]);

  // Handle auto-filling unit and rate when material changes
  useEffect(() => {
    if (watchMaterialId && !initialData) {
      const mat = materials.find(m => m.id === watchMaterialId);
      if (mat) {
        if (mat.default_unit) setValue("unit", mat.default_unit);
        if (mat.default_rate) setValue("ratePerUnit", Number(mat.default_rate));
      }
    }
  }, [watchMaterialId, materials, setValue, initialData]);

  // OCR for Vehicle Photo
  useEffect(() => {
    if (vehiclePreview) {
      const performOCR = async () => {
        setIsOcrLoading(true);
        try {
          const worker = await Tesseract.createWorker('eng');
          await worker.setParameters({
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ',
          });
          
          const result = await worker.recognize(vehiclePreview);
          await worker.terminate();

          const rawText = result.data.text || "";
          const cleanText = rawText.replace(/[^A-Z0-9]/gi, '');
          
          // Pattern 1: Standard (MH12AB1234)
          const standardRegex = /[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}/i;
          // Pattern 2: BH Series (22BH1234A)
          const bhRegex = /[0-9]{2}BH[0-9]{4}[A-Z]{1,2}/i;
          
          let match = cleanText.match(standardRegex);
          if (!match) match = cleanText.match(bhRegex);
          
          if (!match) {
            const possible = rawText.split(/\s+/).map(s => s.replace(/[^A-Z0-9]/gi, '')).filter(s => s.length >= 6 && s.length <= 11 && /[0-9]/.test(s) && /[A-Z]/i.test(s));
            if (possible.length > 0) {
              match = [possible[0]];
            } else if (cleanText.length >= 4) {
              match = [cleanText.substring(0, 12)];
            }
          }
          
          if (match && match[0]) {
            setValue("vehicleNumber", match[0].toUpperCase(), { shouldValidate: true });
          } else {
            console.log("OCR failed to find a valid license plate pattern. Raw text:", rawText);
          }
        } catch (err) {
          console.error("OCR Error", err);
        } finally {
          setIsOcrLoading(false);
        }
      };
      performOCR();
    }
  }, [vehiclePreview, setValue]);

  // Scroll to first error
  useEffect(() => {
    const firstError = Object.keys(errors)[0];
    if (firstError) {
      const element = document.getElementsByName(firstError)[0];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
    }
  }, [errors]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'material' | 'vehicle' | 'challan' | 'bill') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    if (type === 'material') {
      setMaterialPhoto(file);
      setMaterialPreview(previewUrl);
    } else if (type === 'vehicle') {
      setVehiclePhoto(file);
      setVehiclePreview(previewUrl);
    } else if (type === 'challan') {
      setChallanPhoto(file);
      setChallanPreview(previewUrl);
    } else {
      setBillPhoto(file);
      setBillPreview(previewUrl);
    }
  };

  const handleRemoveImage = (type: 'material' | 'vehicle' | 'challan' | 'bill') => {
    if (type === 'material') {
      setMaterialPhoto(null);
      setMaterialPreview(null);
    } else if (type === 'vehicle') {
      setVehiclePhoto(null);
      setVehiclePreview(null);
    } else if (type === 'challan') {
      setChallanPhoto(null);
      setChallanPreview(null);
    } else {
      setBillPhoto(null);
      setBillPreview(null);
    }
  };

  const handleCameraCapture = (file: File) => {
    if (!cameraOpenFor) return;
    
    const previewUrl = URL.createObjectURL(file);
    if (cameraOpenFor === 'material') {
      setMaterialPhoto(file);
      setMaterialPreview(previewUrl);
    } else if (cameraOpenFor === 'vehicle') {
      setVehiclePhoto(file);
      setVehiclePreview(previewUrl);
    } else if (cameraOpenFor === 'challan') {
      setChallanPhoto(file);
      setChallanPreview(previewUrl);
    } else {
      setBillPhoto(file);
      setBillPreview(previewUrl);
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingSupplier(true);
    const res = await addSupplier({ supplier_name: newSupplierName });
    setIsAddingSupplier(false);
    if (res.success && res.supplier) {
      setSuppliers([...suppliers, res.supplier]);
      setValue("supplierId", res.supplier.id);
      setAddSupplierOpen(false);
      setSupplierOpen(false);
      setNewSupplierName("");
    } else {
      alert(res.error);
    }
  };

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingSite(true);
    const res = await addSite({ site_name: newSiteName });
    setIsAddingSite(false);
    if (res.success && res.site) {
      setSites([...sites, res.site]);
      setValue("siteId", res.site.id);
      setAddSiteOpen(false);
      setSiteOpen(false);
      setNewSiteName("");
    } else {
      alert(res.error);
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingMaterial(true);
    const res = await addMaterial({ 
      material_name: newMaterialName,
      default_unit: newMaterialUnit,
      default_rate: newMaterialRate ? Number(newMaterialRate) : undefined
    });
    setIsAddingMaterial(false);
    if (res.success && res.material) {
      setMaterials([...materials, res.material]);
      setValue("materialId", res.material.id);
      setAddMaterialOpen(false);
      setMaterialOpen(false);
      setNewMaterialName("");
      setNewMaterialUnit("");
      setNewMaterialRate("");
    } else {
      alert(res.error);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setSuccess(false);

    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) formData.append(key, value.toString());
      });
      
      if (materialPhoto) formData.append("materialPhoto", materialPhoto);
      if (vehiclePhoto) formData.append("vehiclePhoto", vehiclePhoto);
      if (challanPhoto) formData.append("challanPhoto", challanPhoto);
      if (billPhoto) formData.append("billPhoto", billPhoto);

      let result;
      if (initialData) {
        result = await updateDmrEntry(initialData.id, formData);
      } else {
        result = await submitInventoryForm(formData);
      }
      
      if (result.success) {
        setSuccess(true);
        if (!initialData) {
          reset();
          setMaterialPhoto(null);
          setVehiclePhoto(null);
          setChallanPhoto(null);
          setBillPhoto(null);
          setMaterialPreview(null);
          setVehiclePreview(null);
          setChallanPreview(null);
          setBillPreview(null);
          if (result.dmrNumber) setDmrNumber(result.dmrNumber);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (onSuccess) {
          onSuccess();
        } else if (initialData) {
          window.location.href = "/entries";
        }
      } else {
        alert("Error saving form: " + result.error);
      }
    } catch (error) {
      alert("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const PhotoUpload = ({ id, label, state, setter, onRemove, onCameraClick }: { id: any, label: string, state: string | null, setter: any, onRemove: () => void, onCameraClick: () => void }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      {state ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between w-full p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
             <div className="flex items-center gap-3">
               <div className="h-12 w-12 rounded overflow-hidden shadow-sm border border-gray-200">
                 <img src={state} alt="Preview" className="w-full h-full object-cover" />
               </div>
               <span className="text-sm font-medium text-gray-700">Photo Attached</span>
             </div>
             <Check className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onCameraClick} className="flex-1 flex items-center justify-center h-11 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 rounded-lg transition-colors active:bg-blue-200">
              Retake
            </button>
            <button type="button" onClick={onRemove} className="flex-1 flex items-center justify-center h-11 text-sm font-medium text-red-700 bg-red-50 border border-red-100 hover:bg-red-100 rounded-lg transition-colors active:bg-red-200">
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center w-full gap-3 pt-1">
          <button type="button" onClick={onCameraClick} className="flex items-center justify-center w-full h-12 bg-white border border-gray-200 rounded-xl shadow-sm cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all active:bg-gray-100 group/cam">
            <Camera className="w-5 h-5 text-gray-500 mr-2 group-hover/cam:text-blue-500 transition-colors" />
            <span className="text-sm font-medium text-gray-700 group-hover/cam:text-blue-600 transition-colors">Take Photo</span>
          </button>
          
          <div className="flex items-center w-full opacity-70">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">OR</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>
          
          <label className="flex items-center justify-center w-full h-12 bg-white border border-gray-200 rounded-xl shadow-sm cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all active:bg-gray-100 group/up">
            <Upload className="w-5 h-5 text-gray-500 mr-2 group-hover/up:text-blue-500 transition-colors" />
            <span className="text-sm font-medium text-gray-700 group-hover/up:text-blue-600 transition-colors">Upload Photo</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setter(e, id)} />
          </label>
        </div>
      )}
    </div>
  );

  const onError = () => {
    alert("Please fill in all required fields marked with * before saving.");
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      {!initialData && (
        <div className="text-center mb-4 md:mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">New DMR Entry</h1>
          <p className="text-gray-500 mt-2">Fill in the details below to record a new Daily Material Report.</p>
        </div>
      )}

      <Dialog open={success && !initialData} onOpenChange={setSuccess}>
        <DialogContent className="sm:max-w-md text-center flex flex-col items-center justify-center py-8">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <DialogTitle className="text-2xl font-semibold mb-2 text-center">DMR Entry saved successfully!</DialogTitle>
          {dmrNumber && <p className="text-gray-500 mb-6 text-center">DMR Number: <span className="font-semibold text-green-600">{dmrNumber}</span></p>}
          <Button onClick={() => setSuccess(false)} className="w-full sm:w-auto px-8 mx-auto">
            Done
          </Button>
        </DialogContent>
      </Dialog>

      <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6 md:space-y-8">
        
        {/* SECTION 1: General Information */}
        <Card className="border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b border-gray-100 pb-3 pt-4 px-4 md:px-6">
            <CardTitle className="text-base md:text-lg text-slate-800 font-semibold tracking-tight">1. General Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {initialData && (
                <div className="space-y-2 md:col-span-2">
                  <Label>DMR Number</Label>
                  <Input className="h-10 md:h-12 bg-slate-50/50 font-medium border-gray-200 text-slate-600" value={initialData.dmr_number} readOnly />
                </div>
              )}
              <div className="space-y-2">
                <Label>Arrival Date *</Label>
                <Input type="date" className="h-10 md:h-12 text-sm md:text-base bg-white border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all shadow-sm" {...register("dateOfArrival")} />
                {errors.dateOfArrival && <p className="text-red-500 text-xs">{errors.dateOfArrival.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Supplier *</Label>
                <Controller
                  name="supplierId"
                  control={control}
                  render={({ field }) => (
                    <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                      <PopoverTrigger
                        role="combobox"
                        aria-expanded={supplierOpen}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm md:text-base ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-200 bg-white hover:bg-slate-50 h-10 md:h-12 px-3 py-2 w-full justify-between font-normal shadow-sm"
                      >
                        {field.value
                          ? suppliers.find((s) => s.id === field.value)?.supplier_name || suppliers.find((s) => s.id === field.value)?.name
                          : "Select a supplier..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 flex flex-col max-h-[300px]">
                        <Command>
                          <CommandInput 
                            placeholder="Search supplier..." 
                            value={supplierSearch} 
                            onValueChange={setSupplierSearch}
                            onInput={(e) => setSupplierSearch(e.currentTarget.value)} 
                          />
                          <CommandList>
                            <CommandEmpty className="p-2">
                              <Button 
                                variant="ghost" 
                                className="w-full justify-start text-blue-600 bg-blue-50/50"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setNewSupplierName(supplierSearch);
                                  setAddSupplierOpen(true);
                                }}
                              >
                                <Plus className="mr-2 h-4 w-4" /> Create "{supplierSearch}"
                              </Button>
                            </CommandEmpty>
                            <CommandGroup>
                              {suppliers.map((s) => (
                                <CommandItem
                                  key={s.id}
                                  value={s.supplier_name || s.name}
                                  onSelect={() => {
                                    field.onChange(s.id);
                                    setSupplierOpen(false);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${field.value === s.id ? "opacity-100" : "opacity-0"}`}
                                  />
                                  {s.supplier_name || s.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.supplierId && <p className="text-red-500 text-xs">{errors.supplierId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Site *</Label>
                <Controller
                  name="siteId"
                  control={control}
                  render={({ field }) => (
                    <Popover open={siteOpen} onOpenChange={setSiteOpen}>
                      <PopoverTrigger
                        role="combobox"
                        aria-expanded={siteOpen}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm md:text-base ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-200 bg-white hover:bg-slate-50 h-10 md:h-12 px-3 py-2 w-full justify-between font-normal shadow-sm"
                      >
                        {field.value
                          ? sites.find((s) => s.id === field.value)?.site_name
                          : "Select a site..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 flex flex-col max-h-[300px]">
                        <Command>
                          <CommandInput 
                            placeholder="Search site..." 
                            value={siteSearch} 
                            onValueChange={setSiteSearch}
                            onInput={(e) => setSiteSearch(e.currentTarget.value)} 
                          />
                          <CommandList>
                            <CommandEmpty className="p-2">
                              <Button 
                                variant="ghost" 
                                className="w-full justify-start text-blue-600 bg-blue-50/50"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setNewSiteName(siteSearch);
                                  setAddSiteOpen(true);
                                }}
                              >
                                <Plus className="mr-2 h-4 w-4" /> Create "{siteSearch}"
                              </Button>
                            </CommandEmpty>
                            <CommandGroup>
                              {sites.map((s) => (
                                <CommandItem
                                  key={s.id}
                                  value={s.site_name}
                                  onSelect={() => {
                                    field.onChange(s.id);
                                    setSiteOpen(false);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${field.value === s.id ? "opacity-100" : "opacity-0"}`}
                                  />
                                  {s.site_name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.siteId && <p className="text-red-500 text-xs">{errors.siteId.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: Material Information */}
        <Card className="border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b border-gray-100 pb-3 pt-4 px-4 md:px-6">
            <CardTitle className="text-base md:text-lg text-slate-800 font-semibold tracking-tight">2. Material Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <PhotoUpload id="material" label="Material Photo" state={materialPreview} setter={handleImageChange} onRemove={() => handleRemoveImage('material')} onCameraClick={() => setCameraOpenFor('material')} />
            
            <div className="space-y-2 mt-4">
              <Label>Material *</Label>
              <Controller
                name="materialId"
                control={control}
                render={({ field }) => (
                  <Popover open={materialOpen} onOpenChange={setMaterialOpen}>
                    <PopoverTrigger
                      role="combobox"
                      aria-expanded={materialOpen}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm md:text-base ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-200 bg-white hover:bg-slate-50 h-10 md:h-12 px-3 py-2 w-full justify-between font-normal shadow-sm"
                    >
                      {field.value
                        ? materials.find((m) => m.id === field.value)?.material_name
                        : "Select a material..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 flex flex-col max-h-[300px]">
                      <Command>
                        <CommandInput 
                          placeholder="Search material..." 
                          value={materialSearch} 
                          onValueChange={setMaterialSearch}
                          onInput={(e) => setMaterialSearch(e.currentTarget.value)}
                        />
                        <CommandList>
                          <CommandEmpty className="p-2">
                            <Button 
                              variant="ghost" 
                              className="w-full justify-start text-blue-600 bg-blue-50/50"
                              onClick={(e) => {
                                e.preventDefault();
                                setNewMaterialName(materialSearch);
                                setAddMaterialOpen(true);
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" /> Create "{materialSearch}"
                            </Button>
                          </CommandEmpty>
                          <CommandGroup>
                            {materials.map((m) => (
                              <CommandItem
                                key={m.id}
                                value={m.material_name}
                                onSelect={() => {
                                  field.onChange(m.id);
                                  setMaterialOpen(false);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${field.value === m.id ? "opacity-100" : "opacity-0"}`}
                                />
                                {m.material_name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.materialId && <p className="text-red-500 text-xs">{errors.materialId.message}</p>}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input type="number" step="any" className="h-12 text-base" {...register("quantity", { valueAsNumber: true })} />
                {errors.quantity && <p className="text-red-500 text-xs">{errors.quantity.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Unit *</Label>
                <Input className="h-12 bg-gray-50 text-base" {...register("unit")} />
                {errors.unit && <p className="text-red-500 text-xs">{errors.unit.message}</p>}
              </div>
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label>Rate Per Unit (₹) *</Label>
                <Input type="number" step="any" className="h-12 text-base" {...register("ratePerUnit", { valueAsNumber: true })} />
                {errors.ratePerUnit && <p className="text-red-500 text-xs">{errors.ratePerUnit.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: Vehicle Information */}
        <Card className="border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b border-gray-100 pb-3 pt-4 px-4 md:px-6">
            <CardTitle className="text-base md:text-lg text-slate-800 font-semibold tracking-tight">3. Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Vehicle Number *</Label>
                  {isOcrLoading && (
                    <span className="text-xs text-blue-600 flex items-center gap-1 font-medium animate-pulse">
                      <ScanLine className="w-3 h-3" /> Scanning...
                    </span>
                  )}
                </div>
                <Input className="h-11 uppercase text-base" {...register("vehicleNumber")} />
                {errors.vehicleNumber && <p className="text-red-500 text-xs">{errors.vehicleNumber.message}</p>}
              </div>
              <PhotoUpload id="vehicle" label="Vehicle Photo" state={vehiclePreview} setter={handleImageChange} onRemove={() => handleRemoveImage('vehicle')} onCameraClick={() => setCameraOpenFor('vehicle')} />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 4: Challan & Bill Details */}
        <Card className="border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b border-gray-100 pb-3 pt-4 px-4 md:px-6">
            <CardTitle className="text-base md:text-lg text-slate-800 font-semibold tracking-tight">4. Challan & Bill Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Invoice Number *</Label>
                <Input className="h-11 uppercase text-base" {...register("invoiceNumber")} />
                {errors.invoiceNumber && <p className="text-red-500 text-xs">{errors.invoiceNumber.message}</p>}
              </div>
              <PhotoUpload id="challan" label="Challan Photo" state={challanPreview} setter={handleImageChange} onRemove={() => handleRemoveImage('challan')} onCameraClick={() => setCameraOpenFor('challan')} />
            </div>
            <PhotoUpload id="bill" label="Bill Photo" state={billPreview} setter={handleImageChange} onRemove={() => handleRemoveImage('bill')} onCameraClick={() => setCameraOpenFor('bill')} />
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  id="gstApplicable"
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded border-gray-300"
                  {...register("gstApplicable")}
                />
                <Label htmlFor="gstApplicable" className="cursor-pointer font-medium">GST Applicable?</Label>
              </div>

              {watchGstApplicable && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex flex-col sm:flex-row gap-4 p-2 bg-gray-50 rounded-xl border border-gray-200 w-fit">
                    <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm hover:border-blue-300 transition-colors">
                      <input type="radio" value="Inclusive" {...register("gstType")} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm font-medium">Inclusive</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm hover:border-blue-300 transition-colors">
                      <input type="radio" value="Exclusive" {...register("gstType")} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm font-medium">Exclusive</span>
                    </label>
                  </div>

                  {watchGstType === "Exclusive" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>GST Percentage (%) *</Label>
                        <Input type="number" step="any" className="h-12 text-base" {...register("gstPercentage", { valueAsNumber: true })} />
                        {errors.gstPercentage && <p className="text-red-500 text-xs">{errors.gstPercentage.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>GST Amount (₹)</Label>
                        <Input type="number" step="any" className="h-12 bg-gray-50 text-base" readOnly {...register("gstAmount", { valueAsNumber: true })} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Final Bill Amount (₹) *</Label>
                <Input type="number" step="any" className="h-11 bg-gray-50 font-medium text-lg" readOnly {...register("finalBillAmount", { valueAsNumber: true })} />
                {errors.finalBillAmount && <p className="text-red-500 text-xs">{errors.finalBillAmount.message}</p>}
              </div>
              
              <div className="space-y-3">
                <Label className="block">Payment Status *</Label>
                <div className="flex flex-col sm:flex-row gap-4 p-2 bg-gray-50 rounded-xl border border-gray-200">
                  <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm hover:border-blue-300 transition-colors">
                    <input type="radio" value="Paid" {...register("paymentStatus")} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm font-medium">Paid</span>
                  </label>
                  <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm hover:border-blue-300 transition-colors">
                    <input type="radio" value="Not Paid" {...register("paymentStatus")} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm font-medium">Not Paid</span>
                  </label>
                </div>
              </div>
            </div>

            {watchPaymentStatus === "Paid" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 md:w-1/2">
                <Label>Payment Date *</Label>
                <Input type="date" className="h-12 text-base" {...register("paymentDate")} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 5: Remarks */}
        <Card className="border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b border-gray-100 pb-3 pt-4 px-4 md:px-6">
            <CardTitle className="text-base md:text-lg text-slate-800 font-semibold tracking-tight">5. Remarks</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2">
              <Textarea {...register("remarks")} rows={4} placeholder="Any additional notes..." className="resize-none" />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4 sticky bottom-4 p-4 bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-lg z-10 rounded-2xl">
          {!initialData && (
            <Button type="button" variant="ghost" onClick={() => reset()} className="w-24">
              Reset
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting} className="w-40 h-12 text-base shadow-md bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl active:scale-[0.98] transition-all">
            {isSubmitting ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
            {initialData ? "Update Entry" : "Save Entry"}
          </Button>
        </div>
      </form>

      {/* Add Supplier Dialog (Internal) */}
      <Dialog open={addSupplierOpen} onOpenChange={setAddSupplierOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSupplier} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Supplier Name</Label>
              <Input required value={newSupplierName} onChange={(e) => setNewSupplierName(e.target.value)} />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isAddingSupplier}>
                {isAddingSupplier ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Site Dialog (Internal) */}
      <Dialog open={addSiteOpen} onOpenChange={setAddSiteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Site</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSite} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Site Name</Label>
              <Input required value={newSiteName} onChange={(e) => setNewSiteName(e.target.value)} />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isAddingSite}>
                {isAddingSite ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Material Dialog (Internal) */}
      <Dialog open={addMaterialOpen} onOpenChange={setAddMaterialOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Material</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMaterial} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Material Name</Label>
              <Input required value={newMaterialName} onChange={(e) => setNewMaterialName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Unit</Label>
                <Input value={newMaterialUnit} onChange={(e) => setNewMaterialUnit(e.target.value)} placeholder="e.g. Kg, Nos" />
              </div>
              <div className="space-y-2">
                <Label>Default Rate</Label>
                <Input type="number" step="any" value={newMaterialRate} onChange={(e) => setNewMaterialRate(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isAddingMaterial}>
                {isAddingMaterial ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <CameraCapture 
        open={cameraOpenFor !== null} 
        onOpenChange={(open) => !open && setCameraOpenFor(null)} 
        onCapture={handleCameraCapture} 
      />
    </div>
  );
}
