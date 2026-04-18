import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Tag, Pencil, Trash2, Plus, Loader2, Search, Package } from "lucide-react";
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
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/dashboard/categories")({
  component: CategoriesPage,
  head: () => ({ meta: [{ title: "Categories — Storely" }] }),
});

interface CategoryRow {
  name: string;
  count: number;
}

function CategoriesPage() {
  const { user } = useAuth();
  const { isExpired } = useSubscription();
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [renaming, setRenaming] = useState<CategoryRow | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleting, setDeleting] = useState<CategoryRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("category")
      .eq("user_id", user.id);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const map = new Map<string, number>();
    (data ?? []).forEach((p) => {
      const c = (p.category ?? "").trim();
      if (!c) return;
      map.set(c, (map.get(c) ?? 0) + 1);
    });
    setRows(
      Array.from(map.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    );
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [rows, search]);

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
      toast.error(`"${next}" already exists. Rename will merge — continue?`);
    }
    setBusy(true);
    const { error } = await supabase
      .from("products")
      .update({ category: next })
      .eq("user_id", user.id)
      .eq("category", renaming.name);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Renamed to "${next}"`);
    setRenaming(null);
    load();
  };

  const confirmDelete = async () => {
    if (!user || !deleting) return;
    setBusy(true);
    const { error } = await supabase
      .from("products")
      .update({ category: null })
      .eq("user_id", user.id)
      .eq("category", deleting.name);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`"${deleting.name}" removed from ${deleting.count} product${deleting.count === 1 ? "" : "s"}`);
    setDeleting(null);
    load();
  };

  const confirmCreate = async () => {
    const next = newName.trim();
    if (!next) return;
    if (rows.some((r) => r.name.toLowerCase() === next.toLowerCase())) {
      toast.error("Category already exists");
      return;
    }
    // Categories are derived from products. A category becomes "real" once at
    // least one product uses it — show as 0-count locally to guide the user.
    setRows((prev) =>
      [...prev, { name: next, count: 0 }].sort((a, b) =>
        b.count - a.count || a.name.localeCompare(b.name),
      ),
    );
    toast.success(`"${next}" created. Assign it to products to make it live.`);
    setCreating(false);
    setNewName("");
  };

  return (
    <div className="max-w-5xl mx-auto">
      {isExpired && <ExpiredOverlay />}
      <PageHeader
        eyebrow="Catalog"
        title="Categories"
        description="Organize your products into categories. Rename or delete to keep your catalog tidy."
        actions={
          <Button onClick={() => { setNewName(""); setCreating(true); }} disabled={isExpired}>
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
            <Button onClick={() => { setNewName(""); setCreating(true); }}>
              <Plus className="h-4 w-4" /> Create category
            </Button>
          }
        />
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="border-border/60 shadow-soft overflow-hidden">
            <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories…"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {rows.length} {rows.length === 1 ? "category" : "categories"} · {totalProducts} product{totalProducts === 1 ? "" : "s"}
              </p>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Products</TableHead>
                    <TableHead className="w-[160px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin inline" />
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                        No categories match "{search}".
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => (
                      <TableRow key={r.name} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Tag className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium">{r.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {r.count === 0 ? (
                            <Badge variant="outline" className="font-normal text-muted-foreground">
                              <Package className="h-3 w-3 mr-1" /> Empty
                            </Badge>
                          ) : (
                            <span className="text-sm font-medium">{r.count}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
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
                              disabled={isExpired || r.count === 0}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Rename dialog */}
      <Dialog open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename category</DialogTitle>
            <DialogDescription>
              All {renaming?.count} product{renaming?.count === 1 ? "" : "s"} in "{renaming?.name}" will move to the new name.
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
            <Button variant="ghost" onClick={() => setRenaming(null)}>Cancel</Button>
            <Button onClick={confirmRename} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New category</DialogTitle>
            <DialogDescription>
              Pick a clear, short name. You can assign it to products from the Products page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmCreate()}
              maxLength={60}
              placeholder="e.g. Apparel"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
            <Button onClick={confirmCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
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
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
