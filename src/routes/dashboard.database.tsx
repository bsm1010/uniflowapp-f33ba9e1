import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Database,
  Plus,
  Trash2,
  Pencil,
  Table as TableIcon,
  LayoutGrid,
  Image as ImageIcon,
  Kanban,
  Calendar as CalendarIcon,
  Type,
  Hash,
  ToggleLeft,
  ChevronDownSquare,
  Tags,
  Paperclip,
  Link2,
  Maximize2,
  Minimize2,
  type LucideIcon,
} from "lucide-react";
import {
  GalleryView,
  KanbanView,
  CalendarView,
} from "@/components/dashboard/database/TableViews";
import {
  FilterSortBar,
  applyFilterSort,
  DEFAULT_FILTER_SORT,
  type FilterSortConfig,
} from "@/components/dashboard/database/FilterSortBar";
import {
  ImageUploadCell,
  FileUploadCell,
} from "@/components/dashboard/database/UploadCells";
import { AutomationsDialog } from "@/components/dashboard/database/AutomationsDialog";
import { runAutomations } from "@/components/dashboard/database/automations";
import { Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { ExpiredOverlay } from "@/components/dashboard/ExpiredOverlay";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/dashboard/database")({
  component: DatabasePage,
});

type FieldType =
  | "text"
  | "number"
  | "date"
  | "boolean"
  | "select"
  | "multi_select"
  | "image"
  | "file"
  | "relation";

type DBTable = {
  id: string;
  name: string;
  description: string | null;
  position: number;
};

type DBField = {
  id: string;
  table_id: string;
  name: string;
  field_type: FieldType;
  options: {
    choices?: string[];
    relation_table_id?: string;
  };
  position: number;
};

type DBRecord = {
  id: string;
  table_id: string;
  data: Record<string, unknown>;
  position: number;
};

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "Text",
  number: "Number",
  date: "Date",
  boolean: "Boolean",
  select: "Select",
  multi_select: "Multi-select",
  image: "Image",
  file: "File",
  relation: "Relation",
};

const FIELD_TYPE_ICONS: Record<FieldType, LucideIcon> = {
  text: Type,
  number: Hash,
  date: CalendarIcon,
  boolean: ToggleLeft,
  select: ChevronDownSquare,
  multi_select: Tags,
  image: ImageIcon,
  file: Paperclip,
  relation: Link2,
};

function DatabasePage() {
  const { user } = useAuth();
  const { isExpired } = useSubscription();
  const [tables, setTables] = useState<DBTable[]>([]);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [fields, setFields] = useState<DBField[]>([]);
  const [records, setRecords] = useState<DBRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<DBTable | null>(null);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<DBField | null>(null);
  const [automationsOpen, setAutomationsOpen] = useState(false);

  const loadTables = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("db_tables")
      .select("*")
      .eq("user_id", user.id)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) {
      toast.error(error.message);
      return;
    }
    setTables(data ?? []);
    if ((data?.length ?? 0) > 0 && !activeTableId) {
      setActiveTableId(data![0].id);
    }
    setLoading(false);
  }, [user, activeTableId]);

  const loadTableData = useCallback(async (tableId: string) => {
    const [{ data: f, error: fe }, { data: r, error: re }] = await Promise.all([
      supabase
        .from("db_fields")
        .select("*")
        .eq("table_id", tableId)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("db_records")
        .select("*")
        .eq("table_id", tableId)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);
    if (fe) toast.error(fe.message);
    if (re) toast.error(re.message);
    setFields((f ?? []) as DBField[]);
    setRecords((r ?? []) as DBRecord[]);
  }, []);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  useEffect(() => {
    if (activeTableId) loadTableData(activeTableId);
    else {
      setFields([]);
      setRecords([]);
    }
  }, [activeTableId, loadTableData]);

  const activeTable = tables.find((t) => t.id === activeTableId) ?? null;

  // ---------- Table CRUD ----------
  async function saveTable(name: string, description: string) {
    if (!user) return;
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (editingTable) {
      const { error } = await supabase
        .from("db_tables")
        .update({ name: name.trim(), description })
        .eq("id", editingTable.id);
      if (error) return toast.error(error.message);
      toast.success("Table updated");
    } else {
      const { data, error } = await supabase
        .from("db_tables")
        .insert({
          user_id: user.id,
          name: name.trim(),
          description,
          position: tables.length,
        })
        .select()
        .single();
      if (error) return toast.error(error.message);
      toast.success("Table created");
      if (data) setActiveTableId(data.id);
    }
    setTableDialogOpen(false);
    setEditingTable(null);
    await loadTables();
  }

  async function deleteTable(id: string) {
    if (!confirm("Delete this table and all its data?")) return;
    const { error } = await supabase.from("db_tables").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Table deleted");
    if (activeTableId === id) setActiveTableId(null);
    await loadTables();
  }

  // ---------- Field CRUD ----------
  async function saveField(input: {
    name: string;
    field_type: FieldType;
    options: DBField["options"];
  }) {
    if (!user || !activeTableId) return;
    if (!input.name.trim()) {
      toast.error("Field name required");
      return;
    }
    if (editingField) {
      const { error } = await supabase
        .from("db_fields")
        .update({
          name: input.name.trim(),
          field_type: input.field_type,
          options: input.options,
        })
        .eq("id", editingField.id);
      if (error) return toast.error(error.message);
      toast.success("Field updated");
    } else {
      const { error } = await supabase.from("db_fields").insert({
        user_id: user.id,
        table_id: activeTableId,
        name: input.name.trim(),
        field_type: input.field_type,
        options: input.options,
        position: fields.length,
      });
      if (error) return toast.error(error.message);
      toast.success("Field added");
    }
    setFieldDialogOpen(false);
    setEditingField(null);
    await loadTableData(activeTableId);
  }

  async function deleteField(id: string) {
    if (!confirm("Delete this field? Values will be removed from all records.")) return;
    const { error } = await supabase.from("db_fields").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Field deleted");
    if (activeTableId) await loadTableData(activeTableId);
  }

  // ---------- Record CRUD ----------
  async function addRecord() {
    if (!user || !activeTableId) return;
    const { data, error } = await supabase
      .from("db_records")
      .insert({
        user_id: user.id,
        table_id: activeTableId,
        data: {},
        position: records.length,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    await loadTableData(activeTableId);
    if (data) {
      runAutomations("record_created", {
        userId: user.id,
        tableId: activeTableId,
        recordId: data.id,
        recordData: (data.data as Record<string, unknown>) ?? {},
      });
    }
  }

  async function updateRecordValue(recordId: string, fieldId: string, value: unknown) {
    const rec = records.find((r) => r.id === recordId);
    if (!rec) return;
    const newData = { ...rec.data, [fieldId]: value };
    setRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, data: newData } : r)),
    );
    const { error } = await supabase
      .from("db_records")
      .update({ data: newData as never })
      .eq("id", recordId);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (user && activeTableId) {
      runAutomations("record_updated", {
        userId: user.id,
        tableId: activeTableId,
        recordId,
        recordData: newData,
      });
    }
  }

  async function deleteRecord(id: string) {
    const { error } = await supabase.from("db_records").delete().eq("id", id);
    if (error) return toast.error(error.message);
    if (activeTableId) await loadTableData(activeTableId);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {isExpired && <ExpiredOverlay />}
      <PageHeader
        eyebrow="Workspace"
        title="Database"
        description="Build custom tables with typed fields — like a mini Airtable inside your store."
        actions={
          <div className="flex gap-2">
            {activeTable && (
              <Button variant="outline" onClick={() => setAutomationsOpen(true)}>
                <Zap className="h-4 w-4 mr-2" />
                Automations
              </Button>
            )}
            <Button
              onClick={() => {
                setEditingTable(null);
                setTableDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New table
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : tables.length === 0 ? (
        <EmptyState
          icon={Database}
          title="No tables yet"
          description="Create your first table to start storing structured data."
          action={
            <Button
              onClick={() => {
                setEditingTable(null);
                setTableDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> Create table
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          {/* Sidebar list of tables */}
          <Card className="p-2 h-fit">
            <div className="space-y-1">
              {tables.map((t) => {
                const active = t.id === activeTableId;
                return (
                  <div
                    key={t.id}
                    className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors ${
                      active
                        ? "bg-accent text-accent-foreground font-medium"
                        : "hover:bg-accent/50"
                    }`}
                    onClick={() => setActiveTableId(t.id)}
                  >
                    <TableIcon className="h-4 w-4 shrink-0 opacity-70" />
                    <span className="truncate flex-1">{t.name}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-background">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTable(t);
                            setTableDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTable(t.id);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Active table grid */}
          <div className="min-w-0">
            {activeTable ? (
              <TableGrid
                table={activeTable}
                fields={fields}
                records={records}
                allTables={tables}
                onAddField={() => {
                  setEditingField(null);
                  setFieldDialogOpen(true);
                }}
                onEditField={(f) => {
                  setEditingField(f);
                  setFieldDialogOpen(true);
                }}
                onDeleteField={deleteField}
                onAddRecord={addRecord}
                onDeleteRecord={deleteRecord}
                onUpdateValue={updateRecordValue}
              />
            ) : (
              <Card className="p-8 text-center text-muted-foreground text-sm">
                Select a table to view its records.
              </Card>
            )}
          </div>
        </div>
      )}

      <TableDialog
        open={tableDialogOpen}
        onOpenChange={(o) => {
          setTableDialogOpen(o);
          if (!o) setEditingTable(null);
        }}
        editing={editingTable}
        onSave={saveTable}
      />
      <FieldDialog
        open={fieldDialogOpen}
        onOpenChange={(o) => {
          setFieldDialogOpen(o);
          if (!o) setEditingField(null);
        }}
        editing={editingField}
        otherTables={tables.filter((t) => t.id !== activeTableId)}
        onSave={saveField}
      />
      <AutomationsDialog
        open={automationsOpen}
        onOpenChange={setAutomationsOpen}
        table={activeTable}
        fields={fields}
        allTables={tables}
      />
    </motion.div>
  );
}

// ===================== Table Dialog =====================
function TableDialog({
  open,
  onOpenChange,
  editing,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: DBTable | null;
  onSave: (name: string, description: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setDescription(editing?.description ?? "");
    }
  }, [open, editing]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Rename table" : "New table"}</DialogTitle>
          <DialogDescription>
            Tables hold records (rows) and fields (columns).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Customers, Inventory, Tasks…"
              maxLength={100}
            />
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this table for?"
              maxLength={300}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSave(name, description)}>
            {editing ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===================== Field Dialog =====================
function FieldDialog({
  open,
  onOpenChange,
  editing,
  otherTables,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: DBField | null;
  otherTables: DBTable[];
  onSave: (input: {
    name: string;
    field_type: FieldType;
    options: DBField["options"];
  }) => void;
}) {
  const [name, setName] = useState("");
  const [fieldType, setFieldType] = useState<FieldType>("text");
  const [choicesText, setChoicesText] = useState("");
  const [relationTableId, setRelationTableId] = useState<string>("");

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setFieldType(editing?.field_type ?? "text");
      setChoicesText((editing?.options.choices ?? []).join(", "));
      setRelationTableId(editing?.options.relation_table_id ?? "");
    }
  }, [open, editing]);

  function handleSave() {
    const options: DBField["options"] = {};
    if (fieldType === "select" || fieldType === "multi_select") {
      options.choices = choicesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (options.choices.length === 0) {
        toast.error("Add at least one choice");
        return;
      }
    }
    if (fieldType === "relation") {
      if (!relationTableId) {
        toast.error("Pick a table to link to");
        return;
      }
      options.relation_table_id = relationTableId;
    }
    onSave({ name, field_type: fieldType, options });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit field" : "Add field"}</DialogTitle>
          <DialogDescription>Define a column for this table.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Email, Price, Status…"
              maxLength={100}
            />
          </div>
          <div>
            <Label>Type</Label>
            <Select
              value={fieldType}
              onValueChange={(v) => setFieldType(v as FieldType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(FIELD_TYPE_LABELS) as FieldType[]).map((t) => {
                  const Icon = FIELD_TYPE_ICONS[t];
                  return (
                    <SelectItem key={t} value={t}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span>{FIELD_TYPE_LABELS[t]}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          {(fieldType === "select" || fieldType === "multi_select") && (
            <div>
              <Label>Choices (comma-separated)</Label>
              <Input
                value={choicesText}
                onChange={(e) => setChoicesText(e.target.value)}
                placeholder="Low, Medium, High"
              />
            </div>
          )}
          {fieldType === "relation" && (
            <div>
              <Label>Linked table</Label>
              <Select value={relationTableId} onValueChange={setRelationTableId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a table…" />
                </SelectTrigger>
                <SelectContent>
                  {otherTables.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      Create another table first
                    </div>
                  ) : (
                    otherTables.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{editing ? "Save" : "Add"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===================== Table Grid (with view switcher) =====================
type ViewMode = "grid" | "gallery" | "kanban" | "calendar";
type ViewSettings = {
  mode: ViewMode;
  galleryImageFieldId?: string | null;
  galleryTitleFieldId?: string | null;
  kanbanGroupFieldId?: string | null;
  calendarDateFieldId?: string | null;
  calendarTitleFieldId?: string | null;
  filterSort?: FilterSortConfig;
};

function loadViewSettings(tableId: string): ViewSettings {
  if (typeof window === "undefined") return { mode: "grid", filterSort: DEFAULT_FILTER_SORT };
  try {
    const raw = localStorage.getItem(`db_view_${tableId}`);
    if (!raw) return { mode: "grid", filterSort: DEFAULT_FILTER_SORT };
    const parsed = JSON.parse(raw) as ViewSettings;
    return { ...parsed, filterSort: parsed.filterSort ?? DEFAULT_FILTER_SORT };
  } catch {
    return { mode: "grid", filterSort: DEFAULT_FILTER_SORT };
  }
}

function saveViewSettings(tableId: string, settings: ViewSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`db_view_${tableId}`, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

function TableGrid({
  table,
  fields,
  records,
  allTables,
  onAddField,
  onEditField,
  onDeleteField,
  onAddRecord,
  onDeleteRecord,
  onUpdateValue,
}: {
  table: DBTable;
  fields: DBField[];
  records: DBRecord[];
  allTables: DBTable[];
  onAddField: () => void;
  onEditField: (f: DBField) => void;
  onDeleteField: (id: string) => void;
  onAddRecord: () => void;
  onDeleteRecord: (id: string) => void;
  onUpdateValue: (recordId: string, fieldId: string, value: unknown) => void;
}) {
  const [view, setView] = useState<ViewSettings>(() => loadViewSettings(table.id));
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setView(loadViewSettings(table.id));
  }, [table.id]);

  function update(patch: Partial<ViewSettings>) {
    const next = { ...view, ...patch };
    setView(next);
    saveViewSettings(table.id, next);
  }

  const VIEW_TABS: { key: ViewMode; label: string; icon: typeof LayoutGrid }[] = [
    { key: "grid", label: "Grid", icon: LayoutGrid },
    { key: "gallery", label: "Gallery", icon: ImageIcon },
    { key: "kanban", label: "Kanban", icon: Kanban },
    { key: "calendar", label: "Calendar", icon: CalendarIcon },
  ];

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-50 bg-background p-4 overflow-auto space-y-3"
          : "space-y-3"
      }
    >
      <Card className="p-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h2 className="font-semibold truncate">{table.name}</h2>
          {table.description && (
            <p className="text-xs text-muted-foreground truncate">
              {table.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-md border border-border bg-background p-0.5">
            {VIEW_TABS.map((t) => {
              const Icon = t.icon;
              const active = view.mode === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => update({ mode: t.key })}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
          <FilterSortBar
            fields={fields}
            config={view.filterSort ?? DEFAULT_FILTER_SORT}
            onChange={(fs) => update({ filterSort: fs })}
          />
          <Button size="sm" variant="outline" onClick={onAddField}>
            <Plus className="h-4 w-4 mr-1" /> Field
          </Button>
          <Button size="sm" onClick={onAddRecord} disabled={fields.length === 0}>
            <Plus className="h-4 w-4 mr-1" /> Row
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setFullscreen((v) => !v)}
            title={fullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
          >
            {fullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </Card>

      {(() => {
        const visibleRecords = applyFilterSort(
          records,
          fields,
          view.filterSort ?? DEFAULT_FILTER_SORT,
        ) as DBRecord[];
        return (
          <>
            {view.mode === "grid" && (
              <GridView
                fields={fields}
                records={visibleRecords}
                onEditField={onEditField}
                onDeleteField={onDeleteField}
                onAddField={onAddField}
                onAddRecord={onAddRecord}
                onDeleteRecord={onDeleteRecord}
                onUpdateValue={onUpdateValue}
                allTables={allTables}
              />
            )}
            {view.mode === "gallery" && (
              <GalleryView
                fields={fields}
                records={visibleRecords}
                imageFieldId={view.galleryImageFieldId ?? null}
                titleFieldId={view.galleryTitleFieldId ?? null}
                onChangeImageField={(id) => update({ galleryImageFieldId: id })}
                onChangeTitleField={(id) => update({ galleryTitleFieldId: id })}
                onAddRecord={onAddRecord}
              />
            )}
            {view.mode === "kanban" && (
              <KanbanView
                fields={fields}
                records={visibleRecords}
                groupFieldId={view.kanbanGroupFieldId ?? null}
                onChangeGroupField={(id) => update({ kanbanGroupFieldId: id })}
                onUpdateValue={onUpdateValue}
                onAddRecord={onAddRecord}
              />
            )}
            {view.mode === "calendar" && (
              <CalendarView
                fields={fields}
                records={visibleRecords}
                dateFieldId={view.calendarDateFieldId ?? null}
                titleFieldId={view.calendarTitleFieldId ?? null}
                onChangeDateField={(id) => update({ calendarDateFieldId: id })}
                onChangeTitleField={(id) => update({ calendarTitleFieldId: id })}
              />
            )}
          </>
        );
      })()}
    </div>
  );
}

// ===================== Grid View (spreadsheet) =====================
function GridView({
  fields,
  records,
  allTables,
  onAddField,
  onEditField,
  onDeleteField,
  onAddRecord,
  onDeleteRecord,
  onUpdateValue,
}: {
  fields: DBField[];
  records: DBRecord[];
  allTables: DBTable[];
  onAddField: () => void;
  onEditField: (f: DBField) => void;
  onDeleteField: (id: string) => void;
  onAddRecord: () => void;
  onDeleteRecord: (id: string) => void;
  onUpdateValue: (recordId: string, fieldId: string, value: unknown) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-auto max-h-[calc(100vh-220px)]">
        <table className="w-full text-base border-separate border-spacing-0">
          <thead className="sticky top-0 z-20 bg-muted/80 backdrop-blur">
            <tr>
              <th className="sticky left-0 z-30 bg-muted/80 backdrop-blur w-14 min-w-[3.5rem] border-b border-r border-border px-3 py-3 text-left text-xs font-medium text-muted-foreground">
                #
              </th>
              {fields.map((f) => (
                <th
                  key={f.id}
                  className="px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[260px] border-b border-r border-border"
                >
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = FIELD_TYPE_ICONS[f.field_type];
                      return (
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      );
                    })()}
                    <span className="truncate">{f.name}</span>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {FIELD_TYPE_LABELS[f.field_type]}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="ml-auto opacity-60 hover:opacity-100">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditField(f)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteField(f.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </th>
              ))}
              <th className="border-b border-border bg-muted/80 backdrop-blur min-w-[120px] px-2">
                <button
                  onClick={onAddField}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-accent w-full"
                  title="Add field"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add field
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td
                  colSpan={fields.length + 2}
                  className="p-12 text-center text-muted-foreground text-sm border-b border-border"
                >
                  {fields.length === 0
                    ? "Add a field to get started."
                    : "No records yet. Click 'Add row' below to create one."}
                </td>
              </tr>
            ) : (
              records.map((rec, idx) => (
                <tr key={rec.id} className="group hover:bg-muted/30">
                  <td className="sticky left-0 z-10 bg-background group-hover:bg-muted/30 border-b border-r border-border w-14 min-w-[3.5rem] px-2 text-center align-middle">
                    <span className="text-sm text-muted-foreground group-hover:hidden">
                      {idx + 1}
                    </span>
                    <button
                      className="hidden group-hover:inline-flex text-muted-foreground hover:text-destructive p-1.5 rounded hover:bg-destructive/10"
                      onClick={() => onDeleteRecord(rec.id)}
                      aria-label="Delete row"
                      title="Delete row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                  {fields.map((f) => (
                    <td
                      key={f.id}
                      className="px-3 py-3 align-middle min-w-[260px] border-b border-r border-border"
                    >
                      <CellEditor
                        field={f}
                        value={rec.data[f.id]}
                        allTables={allTables}
                        onChange={(v) => onUpdateValue(rec.id, f.id, v)}
                      />
                    </td>
                  ))}
                  <td className="border-b border-border" />
                </tr>
              ))
            )}
            {fields.length > 0 && (
              <tr>
                <td
                  colSpan={fields.length + 2}
                  className="p-0 border-b border-border"
                >
                  <button
                    onClick={onAddRecord}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-2 w-full hover:bg-accent/40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add row
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ===================== Cell Editor =====================
function CellEditor({
  field,
  value,
  allTables,
  onChange,
}: {
  field: DBField;
  value: unknown;
  allTables: DBTable[];
  onChange: (v: unknown) => void;
}) {
  const { user } = useAuth();
  switch (field.field_type) {
    case "text":
      return (
        <Input
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 border-transparent focus:border-input bg-transparent"
        />
      );
    case "number":
      return (
        <Input
          type="number"
          value={(value as number | string) ?? ""}
          onChange={(e) =>
            onChange(e.target.value === "" ? null : Number(e.target.value))
          }
          className="h-8 border-transparent focus:border-input bg-transparent"
        />
      );
    case "date":
      return (
        <Input
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 border-transparent focus:border-input bg-transparent"
        />
      );
    case "boolean":
      return (
        <Checkbox
          checked={!!value}
          onCheckedChange={(c) => onChange(!!c)}
        />
      );
    case "select": {
      const choices = field.options.choices ?? [];
      return (
        <Select
          value={(value as string) ?? ""}
          onValueChange={(v) => onChange(v)}
        >
          <SelectTrigger className="h-8 border-transparent bg-transparent">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            {choices.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    case "multi_select": {
      const choices = field.options.choices ?? [];
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return <MultiSelectCell choices={choices} selected={selected} onChange={onChange} />;
    }
    case "image":
      return (
        <ImageUploadCell
          value={(value as string) ?? ""}
          userId={user?.id ?? null}
          onChange={onChange}
        />
      );
    case "file":
      return (
        <FileUploadCell
          value={(value as string) ?? ""}
          userId={user?.id ?? null}
          onChange={onChange}
        />
      );
    case "relation":
      return (
        <RelationCell
          field={field}
          allTables={allTables}
          value={(value as string) ?? ""}
          onChange={onChange}
        />
      );
    default:
      return null;
  }
}

function MultiSelectCell({
  choices,
  selected,
  onChange,
}: {
  choices: string[];
  selected: string[];
  onChange: (v: unknown) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left h-8 px-2 rounded-md hover:bg-accent/40 flex flex-wrap gap-1 items-center"
      >
        {selected.length === 0 ? (
          <span className="text-muted-foreground text-xs">—</span>
        ) : (
          selected.map((s) => (
            <Badge key={s} variant="secondary" className="text-[10px]">
              {s}
            </Badge>
          ))
        )}
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-50 mt-1 w-48 bg-popover border border-border rounded-md shadow-md p-1">
            {choices.map((c) => {
              const checked = selected.includes(c);
              return (
                <label
                  key={c}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer text-sm"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(v) => {
                      const next = v
                        ? [...selected, c]
                        : selected.filter((x) => x !== c);
                      onChange(next);
                    }}
                  />
                  {c}
                </label>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function RelationCell({
  field,
  allTables,
  value,
  onChange,
}: {
  field: DBField;
  allTables: DBTable[];
  value: string;
  onChange: (v: unknown) => void;
}) {
  const targetId = field.options.relation_table_id;
  const targetTable = allTables.find((t) => t.id === targetId);
  const [linkedRecords, setLinkedRecords] = useState<DBRecord[]>([]);
  const [linkedFields, setLinkedFields] = useState<DBField[]>([]);

  useEffect(() => {
    if (!targetId) return;
    Promise.all([
      supabase
        .from("db_fields")
        .select("*")
        .eq("table_id", targetId)
        .order("position", { ascending: true }),
      supabase
        .from("db_records")
        .select("*")
        .eq("table_id", targetId)
        .order("position", { ascending: true }),
    ]).then(([f, r]) => {
      setLinkedFields((f.data ?? []) as DBField[]);
      setLinkedRecords((r.data ?? []) as DBRecord[]);
    });
  }, [targetId]);

  const primaryField = linkedFields[0];
  const labelFor = (rec: DBRecord) => {
    if (!primaryField) return rec.id.slice(0, 8);
    const v = rec.data[primaryField.id];
    if (v == null || v === "") return rec.id.slice(0, 8);
    return String(v);
  };

  if (!targetTable) {
    return <span className="text-xs text-destructive">Missing table</span>;
  }

  return (
    <Select
      value={value || "__none__"}
      onValueChange={(v) => onChange(v === "__none__" ? null : v)}
    >
      <SelectTrigger className="h-8 border-transparent bg-transparent">
        <SelectValue placeholder={`Link a ${targetTable.name}…`} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">— None —</SelectItem>
        {linkedRecords.length === 0 ? (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            No records in {targetTable.name} yet.
          </div>
        ) : (
          linkedRecords.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {labelFor(r)}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
