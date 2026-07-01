import { useCallback, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentStore } from "@/hooks/use-current-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

type Step = "upload" | "mapping" | "preview" | "importing";

interface ParsedRow {
  [key: string]: unknown;
}

interface MappingField {
  key: string;
  label: string;
  required: boolean;
  sourceColumn: string;
}

interface ValidatedRow {
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string | null;
  image_url: string | null;
  sku: string | null;
  hasError: boolean;
  errorMessages: string[];
}

const TARGET_FIELDS: Omit<MappingField, "sourceColumn">[] = [
  { key: "name", label: "Product name", required: true },
  { key: "description", label: "Description", required: false },
  { key: "price", label: "Price", required: true },
  { key: "stock", label: "Stock quantity", required: false },
  { key: "category", label: "Category", required: false },
  { key: "image_url", label: "Image URL", required: false },
  { key: "sku", label: "SKU / Reference", required: false },
];

const AUTO_DETECT: Record<string, string[]> = {
  name: ["name", "nom", "product", "produit", "اسم", "product_name", "title"],
  price: ["price", "prix", "cost", "cost_price", "سعر", "unit_price", "amount"],
  stock: ["stock", "quantity", "quantité", "qty", "inventory", "كمية", "متوفر"],
  description: ["description", "desc", "details", "وصف", "about"],
  image_url: ["image", "photo", "image_url", "img", "picture", "photo_url", "صورة"],
  category: ["category", "catégorie", "cat", "type", "group", "فئة", "تصنيف"],
  sku: ["sku", "reference", "ref", "code", "barcode", "مرجع", "كود"],
};

function autoDetectMapping(columns: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const lowerCols = columns.map((c) => c.toLowerCase().trim());
  for (const [field, aliases] of Object.entries(AUTO_DETECT)) {
    for (let i = 0; i < lowerCols.length; i++) {
      if (aliases.includes(lowerCols[i])) {
        mapping[field] = columns[i];
        break;
      }
    }
  }
  return mapping;
}

function validateRows(
  rows: ParsedRow[],
  mapping: Record<string, string>,
): ValidatedRow[] {
  return rows.map((row) => {
    const errors: string[] = [];
    const name = String(row[mapping.name] ?? "").trim();
    const priceRaw = row[mapping.price];
    const price = Number(priceRaw);

    if (!name) errors.push("Missing product name");
    if (name.length > 200) errors.push("Name will be truncated to 200 chars");
    if (priceRaw === "" || priceRaw == null) errors.push("Missing price");
    else if (isNaN(price)) errors.push("Price is not a number");
    else if (price < 0) errors.push("Price is negative (warning)");

    const stockRaw = row[mapping.stock];
    const stock = stockRaw != null && stockRaw !== "" ? Number(stockRaw) : 0;

    return {
      name: name.slice(0, 200),
      description: row[mapping.description] ? String(row[mapping.description]).trim() : null,
      price: isNaN(price) ? 0 : price,
      stock: isNaN(stock) ? 0 : stock,
      category: row[mapping.category] ? String(row[mapping.category]).trim() : null,
      image_url: row[mapping.image_url] ? String(row[mapping.image_url]).trim() : null,
      sku: row[mapping.sku] ? String(row[mapping.sku]).trim() : null,
      hasError: errors.some((e) => !e.includes("warning")),
      errorMessages: errors,
    };
  });
}

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ["name", "description", "price", "stock", "category", "image_url", "sku"],
    ["Sneakers", "Comfortable running shoes", "4500", "10", "Shoes", "https://example.com/img.jpg", "SKU-001"],
    ["Cotton T-Shirt", "High quality cotton", "1800", "25", "Clothing", "", "SKU-002"],
  ]);
  ws["!cols"] = [
    { wch: 20 }, { wch: 35 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 50 }, { wch: 15 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");
  XLSX.writeFile(wb, "fennecly-products-template.xlsx");
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export function ProductImportDialog({ open, onOpenChange, onImported }: ProductImportDialogProps) {
  const { user } = useAuth();
  const { currentStore } = useCurrentStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [rawRows, setRawRows] = useState<ParsedRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [skipErrors, setSkipErrors] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [importDone, setImportDone] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");

  const reset = () => {
    setStep("upload");
    setRawRows([]);
    setColumns([]);
    setMapping({});
    setValidatedRows([]);
    setImporting(false);
    setImportProgress(0);
    setErrors([]);
    setFileName("");
  };

  const handleFile = async (file: File) => {
    setFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      if (rows.length === 0) {
        toast.error("File is empty");
        return;
      }
      const cols = Object.keys(rows[0]);
      setRawRows(rows);
      setColumns(cols);
      setMapping(autoDetectMapping(cols));
      setStep("mapping");
    } catch {
      toast.error("Failed to parse file. Check the format.");
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) void handleFile(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const previewRows = validateRows(rawRows, mapping);
  const errorCount = previewRows.filter((r) => r.hasError).length;
  const validRows = skipErrors ? previewRows.filter((r) => !r.hasError) : previewRows;

  const doImport = async () => {
    if (!user || !currentStore?.id || validRows.length === 0) return;
    setImporting(true);
    setImportTotal(validRows.length);
    setImportDone(0);
    setImportProgress(0);
    setErrors([]);

    const batches = chunk(validRows, 20);
    let imported = 0;
    const batchErrors: string[] = [];

    for (const batch of batches) {
      const { error } = await supabase.from("products").insert(
        batch.map((row) => ({
          user_id: user.id,
          store_id: currentStore.id,
          name: row.name,
          description: row.description,
          price: row.price,
          stock: row.stock,
          category: row.category,
          images: row.image_url ? [row.image_url] : [],
          image_url: row.image_url,
          sku: row.sku,
          status: "draft",
        })),
      );

      if (error) {
        batchErrors.push(error.message);
      } else {
        imported += batch.length;
      }

      setImportDone(imported);
      setImportProgress(Math.round((imported / validRows.length) * 100));
      await new Promise((r) => setTimeout(r, 200));
    }

    // Log the import
    await (supabase as any).from("import_logs").insert({
      merchant_id: user.id,
      type: "products",
      total_rows: rawRows.length,
      imported_rows: imported,
      skipped_rows: rawRows.length - imported,
      filename: fileName,
    });

    setImporting(false);

    if (batchErrors.length === 0) {
      toast.success(`Imported ${imported} products!`);
      onImported();
      reset();
      onOpenChange(false);
    } else {
      setErrors(batchErrors);
      toast.error(`Imported ${imported}. ${batchErrors.length} batch(es) failed.`);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Products
          </SheetTitle>
          <SheetDescription>
            Upload an Excel or CSV file to bulk-create products.
          </SheetDescription>
        </SheetHeader>

        {/* STEP: Upload */}
        {step === "upload" && (
          <div className="mt-6 space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium">Drop your file here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports .xlsx, .xls, .csv
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
                e.target.value = "";
              }}
            />

            <div className="flex justify-center">
              <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Excel template
              </Button>
            </div>
          </div>
        )}

        {/* STEP: Mapping */}
        {step === "mapping" && (
          <div className="mt-6 space-y-5">
            <div>
              <p className="text-sm font-medium mb-1">
                {rawRows.length} rows found in <span className="text-muted-foreground">{fileName}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Map your columns to Fennecly product fields. Auto-detected mappings are shown below.
              </p>
            </div>

            {/* Preview table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      {columns.map((c) => (
                        <th key={c} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rawRows.slice(0, 3).map((row, i) => (
                      <tr key={i} className="border-t">
                        {columns.map((c) => (
                          <td key={c} className="px-3 py-2 text-muted-foreground max-w-[120px] truncate">
                            {String(row[c] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-3 py-1.5 bg-muted/30 text-xs text-muted-foreground border-t">
                Preview (first {Math.min(3, rawRows.length)} rows)
              </div>
            </div>

            {/* Field mappings */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Column Mapping</Label>
              {TARGET_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center gap-3">
                  <div className="w-[140px] shrink-0">
                    <span className="text-sm">
                      {field.label}
                      {field.required && <span className="text-destructive ml-0.5">*</span>}
                    </span>
                  </div>
                  <div className="w-8 text-center text-muted-foreground text-sm">→</div>
                  <Select
                    value={mapping[field.key] || ""}
                    onValueChange={(v) =>
                      setMapping((prev) => ({ ...prev, [field.key]: v === "_none" ? "" : v }))
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="— Skip —" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">— Skip —</SelectItem>
                      {columns.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { reset(); }}>
                Back
              </Button>
              <Button
                onClick={() => {
                  setValidatedRows(previewRows);
                  setStep("preview");
                }}
                disabled={!mapping.name || !mapping.price}
              >
                Preview & Validate
              </Button>
            </div>
          </div>
        )}

        {/* STEP: Preview */}
        {step === "preview" && (
          <div className="mt-6 space-y-5">
            {/* Summary */}
            <div className="flex flex-wrap gap-3">
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                {validRows.length} ready
              </Badge>
              {errorCount > 0 && (
                <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                  <AlertCircle className="h-3.5 w-3.5 mr-1" />
                  {errorCount} with errors
                </Badge>
              )}
            </div>

            {/* Error rows */}
            {errorCount > 0 && (
              <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium">Row</th>
                      <th className="px-3 py-2 text-left font-medium">Name</th>
                      <th className="px-3 py-2 text-left font-medium">Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows
                      .map((r, i) => ({ ...r, rowIndex: i }))
                      .filter((r) => r.hasError)
                      .map((r) => (
                        <tr key={r.rowIndex} className="border-t bg-destructive/5">
                          <td className="px-3 py-2">{r.rowIndex + 1}</td>
                          <td className="px-3 py-2">{r.name || "(empty)"}</td>
                          <td className="px-3 py-2 text-destructive">
                            {r.errorMessages.join("; ")}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Preview valid rows */}
            <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50 sticky top-0">
                    <th className="px-3 py-2 text-left font-medium">#</th>
                    <th className="px-3 py-2 text-left font-medium">Name</th>
                    <th className="px-3 py-2 text-right font-medium">Price</th>
                    <th className="px-3 py-2 text-right font-medium">Stock</th>
                    <th className="px-3 py-2 text-left font-medium">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {validRows.slice(0, 50).map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2 font-medium">{r.name}</td>
                      <td className="px-3 py-2 text-right">{r.price}</td>
                      <td className="px-3 py-2 text-right">{r.stock}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.category ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {validRows.length > 50 && (
                <div className="px-3 py-1.5 bg-muted/30 text-xs text-muted-foreground border-t text-center">
                  …and {validRows.length - 50} more rows
                </div>
              )}
            </div>

            {/* Skip errors toggle */}
            {errorCount > 0 && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipErrors}
                  onChange={(e) => setSkipErrors(e.target.checked)}
                  className="rounded"
                />
                Skip rows with errors (recommended)
              </label>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("mapping")}>
                Back
              </Button>
              <Button onClick={doImport} disabled={validRows.length === 0}>
                <Upload className="h-4 w-4 mr-2" />
                Import {validRows.length} product{validRows.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        )}

        {/* STEP: Importing */}
        {step === "importing" && importing && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Importing… {importDone} / {importTotal}
            </div>
            <Progress value={importProgress} />
          </div>
        )}

        {/* Errors after import */}
        {errors.length > 0 && !importing && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm font-medium text-destructive mb-1">Import errors:</p>
            <ul className="text-xs text-destructive/80 space-y-0.5">
              {errors.map((e, i) => (
                <li key={i}>• {e}</li>
              ))}
            </ul>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
