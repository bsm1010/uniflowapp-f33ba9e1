import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ImageIcon,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { ExpiredOverlay } from "@/components/dashboard/ExpiredOverlay";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import {
  ProductFormDialog,
  type Product,
} from "@/components/dashboard/ProductFormDialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export const Route = createFileRoute("/dashboard/products")({
  component: ProductsPage,
  head: () => ({ meta: [{ title: "Products — Storely" }] }),
});

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("id,name,description,price,stock,category,images")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setProducts(
      (data ?? []).map((p) => ({
        ...p,
        price: Number(p.price),
        images: p.images ?? [],
      })),
    );
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (p: Product) => {
    setEditing(p);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", deleting.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Product deleted");
    setDeleting(null);
    load();
  };

  const filtered = products.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.category ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Manage everything you sell in one place."
        actions={
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4" /> Add product
          </Button>
        }
      />

      {!loading && products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Start building your catalog by adding your first product."
          action={
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4" /> Add your first product
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
            <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products…"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {filtered.length} of {products.length} product
                {products.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-[60px]"></TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Loading products…
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No products match "{search}".
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="h-11 w-11 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                            {p.images[0] ? (
                              <img
                                src={p.images[0]}
                                alt={p.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{p.name}</div>
                          {p.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1 max-w-md">
                              {p.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {p.category ? (
                            <Badge variant="secondary" className="font-normal">
                              {p.category}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPrice(p.price)}
                        </TableCell>
                        <TableCell className="text-right">
                          {p.stock === 0 ? (
                            <Badge
                              variant="outline"
                              className="border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-normal"
                            >
                              Out of stock
                            </Badge>
                          ) : p.stock < 5 ? (
                            <Badge
                              variant="outline"
                              className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-normal"
                            >
                              {p.stock} left
                            </Badge>
                          ) : (
                            <span className="text-sm">{p.stock}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(p)}>
                                <Pencil className="h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleting(p)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editing}
        onSaved={load}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleting?.name}" will be permanently removed from your store.
              This action can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
