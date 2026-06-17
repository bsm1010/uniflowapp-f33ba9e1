import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Tag,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  Search,
  Package,
  ImageIcon,
  Upload,
  X,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { ExpiredOverlay } from "@/components/dashboard/ExpiredOverlay";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Img } from "@/components/ui/Img";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/dashboard/categories")({
  component: CategoriesPage,
  head: () => ({ meta: [{ title: "Categories — Fennecly" }] }),
});

type SortKey = "name-asc" | "name-desc" | "count-desc" | "count-asc";

interface CategoryRow {
  name: string;
  count: number;
  image_url: string | null;
  description?: string;
}

/** Converts a category name to a URL-friendly slug preview */
function toSlug(name: string) {
  return (
    "/" +
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

function CategoriesPage() {
  const { user } = useAuth();
  const { isExpired } = useSubscription();
  const navigate = useNavigate();
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("count-desc");
  const [renaming, setRenaming] = useState<CategoryRow | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleting, setDeleting] = useState<CategoryRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [pRes, iRes] = await Promise.all([
        supabase.from("products").select("category").eq("user_id", user.id),
        supabase
          .from("category_images")
          .select("category_name,image_url,description")
          .eq("user_id", user.id),
      ]);
      if (pRes.error) {
        toast.error(pRes.error.message);
        return;
      }
      const imageMap = new Map<string, { image_url: string; description?: string }>();
      (iRes.data ?? []).forEach((r) =>
        imageMap.set(r.category_name, {
          image_url: r.image_url,
          description: r.description ?? undefined,
        }),
      );

      const map = new Map<string, number>();
      (pRes.data ?? []).forEach((p) => {
        const c = (p.category ?? "").trim();
        if (!c) return;
        map.set(c, (map.get(c) ?? 0) + 1);
      });
      imageMap.forEach((_, name) => {
        if (!map.has(name)) map.set(name, 0);
      });

      setRows(
        Array.from(map.entries()).map(([name, count]) => ({
          name,
          count,
          image_url: imageMap.get(name)?.image_url ?? null,
          description: imageMap.get(name)?.description,
        })),
      );
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(() => {
    const copy = [...rows];
    switch (sortKey) {
      case "name-asc":
        return copy.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return copy.sort((a, b) => b.name.localeCompare(a.name));
      case "count-asc":
        return copy.sort((a, b) => a.count - b.count || a.name.localeCompare(b.name));
      case "count-desc":
      default:
        return copy.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    }
  }, [rows, sortKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((r) => r.name.toLowerCase().includes(q));
  }, [sorted, search]);

  const totalProducts = rows.reduce((sum, r) => sum + r.count, 0);

  const openRename = (r: CategoryRow) => {
    setRenameValue(r.name);
    setRenaming(r);
  };

  const confirmRename = async () => {
    if (!user || !renaming) return;
    const next = renameValue.trim();
    if (!next) {
      toast.error("Name can't be empty");
      return;
    }
    if (next === renaming.name) {
      setRenaming(null);
      return;
    }
    if (rows.some((r) => r.name.toLowerCase() === next.toLowerCase() && r.name !== renaming.name)) {
      toast.error(`"${next}" already exists and will merge the two categories.`);
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({ category: next })
        .eq("user_id", user.id)
        .eq("category", renaming.name);
      if (!error) {
        await supabase
          .from("category_images")
          .update({ category_name: next })
          .eq("user_id", user.id)
          .eq("category_name", renaming.name);
      }
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`Renamed to "${next}"`);
      setRenaming(null);
      load();
    } catch {
      toast.error("Failed to rename category");
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!user || !deleting) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({ category: null })
        .eq("user_id", user.id)
        .eq("category", deleting.name);
      if (!error) {
        await supabase
          .from("category_images")
          .delete()
          .eq("user_id", user.id)
          .eq("category_name", deleting.name);
      }
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(
        `"${deleting.name}" removed from ${deleting.count} product${deleting.count === 1 ? "" : "s"}`,
      );
      setDeleting(null);
      load();
    } catch {
      toast.error("Failed to delete category");
    } finally {
      setBusy(false);
    }
  };

  const uploadImageForCategory = async (
    categoryName: string,
    file: File,
  ): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split(".").pop() ?? "png";
    const safe = categoryName
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .slice(0, 40);
    const path = `${user.id}/categories/${safe}-${Date.now()}.${ext}`;
    const up = await supabase.storage.from("store-assets").upload(path, file, { upsert: true });
    if (up.error) {
      toast.error(up.error.message);
      return null;
    }
    const { data: pub } = supabase.storage.from("store-assets").getPublicUrl(path);
    return pub.publicUrl;
  };

  const confirmCreate = async () => {
    const next = newName.trim();
    if (!next || !user) return;
    if (rows.some((r) => r.name.toLowerCase() === next.toLowerCase())) {
      toast.error("Category already exists");
      return;
    }
    setBusy(true);
    try {
      let imageUrl: string | null = null;

      if (newImageFile) {
        imageUrl = await uploadImageForCategory(next, newImageFile);
      }

      if (imageUrl || newDescription.trim()) {
        await supabase.from("category_images").upsert(
          {
            user_id: user.id,
            category_name: next,
            image_url: imageUrl ?? "",
            description: newDescription.trim() || null,
          },
          { onConflict: "user_id,category_name" },
        );
      }

      setRows((prev) =>
        [
          ...prev,
          {
            name: next,
            count: 0,
            image_url: imageUrl,
            description: newDescription.trim() || undefined,
          },
        ].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
      );
      toast.success(`"${next}" created. Assign it to products to make it live.`);
      setCreating(false);
      setNewName("");
      setNewDescription("");
      setNewImageFile(null);
      setNewImagePreview(null);
    } catch {
      toast.error("Failed to create category");
    } finally {
      setBusy(false);
    }
  };

  const uploadImage = async (row: CategoryRow, file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image must be smaller than 4 MB.");
      return;
    }
    setUploadingFor(row.name);
    try {
      const imageUrl = await uploadImageForCategory(row.name, file);
      if (!imageUrl) {
        setUploadingFor(null);
        return;
      }
      const { error } = await supabase
        .from("category_images")
        .upsert(
          { user_id: user.id, category_name: row.name, image_url: imageUrl },
          { onConflict: "user_id,category_name" },
        );
      if (error) {
        toast.error(error.message);
        return;
      }
      setRows((prev) => prev.map((r) => (r.name === row.name ? { ...r, image_url: imageUrl } : r)));
      toast.success("Category image updated");
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploadingFor(null);
    }
  };

  const removeImage = async (row: CategoryRow) => {
    if (!user || !row.image_url) return;
    setUploadingFor(row.name);
    try {
      const { error } = await supabase
        .from("category_images")
        .delete()
        .eq("user_id", user.id)
        .eq("category_name", row.name);
      if (error) {
        toast.error(error.message);
        return;
      }
      setRows((prev) => prev.map((r) => (r.name === row.name ? { ...r, image_url: null } : r)));
      toast.success("Image removed");
    } catch {
      toast.error("Failed to remove image");
    } finally {
      setUploadingFor(null);
    }
  };

  const handleNewImagePick = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image must be smaller than 4 MB.");
      return;
    }
    setNewImageFile(file);
    setNewImagePreview(URL.createObjectURL(file));
  };

  return (
    <div className="max-w-5xl mx-auto">
      {isExpired && <ExpiredOverlay />}
      <PageHeader
        eyebrow="Catalog"
        title="Categories"
        description="Organize your products into categories. Rename or delete to keep your catalog tidy."
        icon={Tag}
        gradient="from-amber-500 via-orange-500 to-rose-500"
        actions={
          <Button
            onClick={() => {
              setNewName("");
              setNewDescription("");
              setNewImageFile(null);
              setNewImagePreview(null);
              setCreating(true);
            }}
            disabled={isExpired}
          >
            <Plus className="h-4 w-4" /> New category
          </Button>
        }
      />

      {!loading && rows.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No categories yet"
          description="Add a category to a product, or create one here to get started."
          action={
            <Button
              onClick={() => {
                setNewName("");
                setCreating(true);
              }}
            >
              <Plus className="h-4 w-4" /> Create category
            </Button>
          }
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-border/60 shadow-soft overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="flex gap-2 flex-1">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search categories…"
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                {/* Sort dropdown */}
                <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                  <SelectTrigger className="w-auto gap-1.5 text-sm text-muted-foreground">
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="count-desc">Most products</SelectItem>
                    <SelectItem value="count-asc">Fewest products</SelectItem>
                    <SelectItem value="name-asc">Name A–Z</SelectItem>
                    <SelectItem value="name-desc">Name Z–A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground whitespace-nowrap">
                {rows.length} {rows.length === 1 ? "category" : "categories"} · {totalProducts}{" "}
                product{totalProducts === 1 ? "" : "s"}
              </p>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Products</TableHead>
                    <TableHead className="w-[280px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin inline" />
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        No categories match "{search}".
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => {
                      const isUploading = uploadingFor === r.name;
                      return (
                        <TableRow key={r.name} className="hover:bg-muted/30">
                          {/* Image cell */}
                          <TableCell>
                            <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden flex items-center justify-center border border-border/60">
                              {isUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              ) : r.image_url ? (
                                <img
                                  src={r.image_url}
                                  alt={r.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </TableCell>

                          {/* Name + slug */}
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Tag className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <span className="font-medium">{r.name}</span>
                                <p className="text-xs text-muted-foreground/70 mt-0.5 font-mono">
                                  {toSlug(r.name)}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Product count */}
                          <TableCell className="text-right">
                            {r.count === 0 ? (
                              <div className="flex flex-col items-end gap-1">
                                <Badge
                                  variant="outline"
                                  className="font-normal text-muted-foreground"
                                >
                                  <Package className="h-3 w-3 mr-1" /> Empty
                                </Badge>
                                {/* CTA to jump to products page filtered by this category */}
                                <button
                                  onClick={() =>
                                    navigate({
                                      to: "/dashboard/products",
                                      search: { category: r.name },
                                    })
                                  }
                                  className="text-xs text-primary hover:underline"
                                >
                                  Add products →
                                </button>
                              </div>
                            ) : (
                              <span className="text-sm font-medium">{r.count}</span>
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  disabled={isExpired || isUploading}
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) uploadImage(r, f);
                                    e.target.value = "";
                                  }}
                                />
                                <Button
                                  asChild
                                  variant="ghost"
                                  size="sm"
                                  className="h-8"
                                  disabled={isExpired || isUploading}
                                >
                                  <span>
                                    <Upload className="h-3.5 w-3.5" />
                                    {r.image_url ? "Replace" : "Image"}
                                  </span>
                                </Button>
                              </label>
                              {r.image_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-muted-foreground"
                                  onClick={() => removeImage(r)}
                                  disabled={isExpired || isUploading}
                                  aria-label="Remove image"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8"
                                onClick={() => openRename(r)}
                                disabled={isExpired}
                              >
                                <Pencil className="h-3.5 w-3.5" /> Rename
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-destructive hover:text-destructive"
                                onClick={() => setDeleting(r)}
                                disabled={isExpired || (r.count === 0 && !r.image_url)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ── Rename dialog ── */}
      <Dialog open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename category</DialogTitle>
            <DialogDescription>
              All {renaming?.count} product{renaming?.count === 1 ? "" : "s"} in "{renaming?.name}"
              will move to the new name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>New name</Label>
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmRename()}
              maxLength={60}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button onClick={confirmRename} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create dialog ── */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New category</DialogTitle>
            <DialogDescription>
              Pick a clear, short name. You can assign it to products from the Products page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmCreate()}
                maxLength={60}
                placeholder="e.g. Apparel"
                autoFocus
              />
              {newName.trim() && (
                <p className="text-xs text-muted-foreground font-mono">{toSlug(newName)}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>
                Description{" "}
                <span className="text-muted-foreground font-normal text-xs">
                  (optional — shown in SEO)
                </span>
              </Label>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="e.g. Bags, wallets and jewellery"
                maxLength={160}
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Image upload */}
            <div className="space-y-1.5">
              <Label>
                Image <span className="text-muted-foreground font-normal text-xs">(optional)</span>
              </Label>
              {newImagePreview ? (
                <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border/60">
                  <Img src={newImagePreview} alt="Preview" className="w-full h-full" />
                  <button
                    onClick={() => {
                      setNewImageFile(null);
                      setNewImagePreview(null);
                    }}
                    className="absolute top-2 right-2 bg-background/80 rounded-full p-1 hover:bg-background"
                    aria-label="Remove image"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-content gap-1.5 border border-dashed border-border/60 rounded-lg h-24 cursor-pointer hover:bg-muted/30 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleNewImagePick(f);
                      e.target.value = "";
                    }}
                  />
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload or drag & drop
                  </span>
                </label>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button onClick={confirmCreate} disabled={busy || !newName.trim()}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ── */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleting?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the category from {deleting?.count} product
              {deleting?.count === 1 ? "" : "s"}. The products themselves stay intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
