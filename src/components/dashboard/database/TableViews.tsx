import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Image as ImageIcon } from "lucide-react";

export type FieldType =
  | "text"
  | "number"
  | "date"
  | "boolean"
  | "select"
  | "multi_select"
  | "image"
  | "relation";

export type DBField = {
  id: string;
  name: string;
  field_type: FieldType;
  options: { choices?: string[]; relation_table_id?: string };
};

export type DBRecord = {
  id: string;
  data: Record<string, unknown>;
};

// ===================== Gallery View =====================
export function GalleryView({
  fields,
  records,
  imageFieldId,
  titleFieldId,
  onChangeImageField,
  onChangeTitleField,
  onAddRecord,
}: {
  fields: DBField[];
  records: DBRecord[];
  imageFieldId: string | null;
  titleFieldId: string | null;
  onChangeImageField: (id: string) => void;
  onChangeTitleField: (id: string) => void;
  onAddRecord: () => void;
}) {
  const imageFields = fields.filter((f) => f.field_type === "image");
  const titleFields = fields.filter((f) =>
    ["text", "number", "select"].includes(f.field_type),
  );

  return (
    <div className="space-y-4">
      <ViewSettingsBar>
        <SettingSelect
          label="Cover image"
          value={imageFieldId ?? ""}
          onChange={onChangeImageField}
          options={imageFields.map((f) => ({ id: f.id, label: f.name }))}
          emptyLabel="No image fields"
        />
        <SettingSelect
          label="Title"
          value={titleFieldId ?? ""}
          onChange={onChangeTitleField}
          options={titleFields.map((f) => ({ id: f.id, label: f.name }))}
          emptyLabel="No title fields"
        />
      </ViewSettingsBar>

      {records.length === 0 ? (
        <EmptyView onAddRecord={onAddRecord} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {records.map((rec) => {
            const img = imageFieldId ? (rec.data[imageFieldId] as string) : "";
            const title = titleFieldId
              ? String(rec.data[titleFieldId] ?? "")
              : "";
            return (
              <Card key={rec.id} className="overflow-hidden group">
                <div className="aspect-square bg-muted flex items-center justify-center">
                  {img ? (
                    <img
                      src={img}
                      alt={title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                  )}
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm truncate">
                    {title || "Untitled"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {fields.length} fields
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===================== Kanban View =====================
export function KanbanView({
  fields,
  records,
  groupFieldId,
  onChangeGroupField,
  onUpdateValue,
  onAddRecord,
}: {
  fields: DBField[];
  records: DBRecord[];
  groupFieldId: string | null;
  onChangeGroupField: (id: string) => void;
  onUpdateValue: (recordId: string, fieldId: string, value: unknown) => void;
  onAddRecord: () => void;
}) {
  const groupable = fields.filter((f) =>
    ["select", "boolean"].includes(f.field_type),
  );
  const groupField = fields.find((f) => f.id === groupFieldId) ?? null;

  const columns = useMemo(() => {
    if (!groupField) return [] as { key: string; label: string }[];
    if (groupField.field_type === "boolean") {
      return [
        { key: "true", label: "✓ True" },
        { key: "false", label: "✗ False" },
      ];
    }
    return (groupField.options.choices ?? []).map((c) => ({
      key: c,
      label: c,
    }));
  }, [groupField]);

  const titleField =
    fields.find((f) => f.field_type === "text") ?? fields[0] ?? null;

  function valueFor(rec: DBRecord) {
    if (!groupField) return "";
    const v = rec.data[groupField.id];
    if (groupField.field_type === "boolean") return v ? "true" : "false";
    return String(v ?? "");
  }

  function handleDrop(e: React.DragEvent, columnKey: string) {
    e.preventDefault();
    const recId = e.dataTransfer.getData("text/plain");
    if (!recId || !groupField) return;
    const newVal =
      groupField.field_type === "boolean" ? columnKey === "true" : columnKey;
    onUpdateValue(recId, groupField.id, newVal);
  }

  return (
    <div className="space-y-4">
      <ViewSettingsBar>
        <SettingSelect
          label="Group by"
          value={groupFieldId ?? ""}
          onChange={onChangeGroupField}
          options={groupable.map((f) => ({ id: f.id, label: f.name }))}
          emptyLabel="Add a Select or Boolean field"
        />
      </ViewSettingsBar>

      {!groupField ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Pick a Select or Boolean field to group records into columns.
        </Card>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {columns.map((col) => {
            const colRecords = records.filter((r) => valueFor(r) === col.key);
            return (
              <div
                key={col.key}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, col.key)}
                className="w-72 shrink-0 bg-muted/40 rounded-lg p-2 flex flex-col gap-2 max-h-[calc(100vh-300px)]"
              >
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-sm font-medium">{col.label}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {colRecords.length}
                  </Badge>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {colRecords.map((rec) => (
                    <Card
                      key={rec.id}
                      draggable
                      onDragStart={(e) =>
                        e.dataTransfer.setData("text/plain", rec.id)
                      }
                      className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                    >
                      <p className="text-sm font-medium truncate">
                        {titleField
                          ? String(rec.data[titleField.id] ?? "Untitled")
                          : "Untitled"}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {fields
                          .filter(
                            (f) =>
                              f.id !== groupField.id &&
                              f.id !== titleField?.id &&
                              rec.data[f.id] != null &&
                              rec.data[f.id] !== "",
                          )
                          .slice(0, 2)
                          .map((f) => (
                            <Badge
                              key={f.id}
                              variant="outline"
                              className="text-[10px]"
                            >
                              {f.name}: {String(rec.data[f.id]).slice(0, 20)}
                            </Badge>
                          ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===================== Calendar View =====================
export function CalendarView({
  fields,
  records,
  dateFieldId,
  titleFieldId,
  onChangeDateField,
  onChangeTitleField,
}: {
  fields: DBField[];
  records: DBRecord[];
  dateFieldId: string | null;
  titleFieldId: string | null;
  onChangeDateField: (id: string) => void;
  onChangeTitleField: (id: string) => void;
}) {
  const dateFields = fields.filter((f) => f.field_type === "date");
  const titleFields = fields.filter((f) =>
    ["text", "number", "select"].includes(f.field_type),
  );

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const monthLabel = cursor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const grid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  function recordsForDay(d: Date | null) {
    if (!d || !dateFieldId) return [];
    const iso = d.toISOString().slice(0, 10);
    return records.filter((r) => {
      const v = r.data[dateFieldId];
      if (typeof v !== "string") return false;
      return v.slice(0, 10) === iso;
    });
  }

  return (
    <div className="space-y-4">
      <ViewSettingsBar>
        <SettingSelect
          label="Date field"
          value={dateFieldId ?? ""}
          onChange={onChangeDateField}
          options={dateFields.map((f) => ({ id: f.id, label: f.name }))}
          emptyLabel="Add a Date field"
        />
        <SettingSelect
          label="Title"
          value={titleFieldId ?? ""}
          onChange={onChangeTitleField}
          options={titleFields.map((f) => ({ id: f.id, label: f.name }))}
          emptyLabel="No title fields"
        />
      </ViewSettingsBar>

      {!dateFieldId ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Pick a Date field to display records on a calendar.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCursor(
                  new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1),
                )
              }
            >
              ←
            </Button>
            <span className="font-semibold">{monthLabel}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCursor(
                  new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1),
                )
              }
            >
              →
            </Button>
          </div>
          <div className="grid grid-cols-7 text-[11px] font-medium text-muted-foreground border-b border-border">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="px-2 py-1.5 text-center">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {grid.map((day, i) => {
              const dayRecords = recordsForDay(day);
              const isToday =
                day && day.toDateString() === new Date().toDateString();
              return (
                <div
                  key={i}
                  className={`min-h-[90px] border-b border-r border-border p-1.5 ${
                    !day ? "bg-muted/20" : ""
                  } ${isToday ? "bg-accent/30" : ""}`}
                >
                  {day && (
                    <>
                      <div
                        className={`text-[11px] mb-1 ${
                          isToday
                            ? "font-bold text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayRecords.slice(0, 3).map((r) => (
                          <div
                            key={r.id}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary truncate"
                          >
                            {titleFieldId
                              ? String(r.data[titleFieldId] ?? "Untitled")
                              : "Record"}
                          </div>
                        ))}
                        {dayRecords.length > 3 && (
                          <div className="text-[10px] text-muted-foreground">
                            +{dayRecords.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ===================== Shared bits =====================
function ViewSettingsBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap gap-3 items-end p-3 rounded-lg bg-muted/40 border border-border">
      {children}
    </div>
  );
}

function SettingSelect({
  label,
  value,
  onChange,
  options,
  emptyLabel,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
  emptyLabel: string;
}) {
  return (
    <div className="min-w-[180px]">
      <label className="text-[11px] font-medium text-muted-foreground block mb-1">
        {label}
      </label>
      {options.length === 0 ? (
        <div className="text-xs text-muted-foreground italic h-9 flex items-center px-3 rounded-md border border-dashed border-border">
          {emptyLabel}
        </div>
      ) : (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Choose…" />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

function EmptyView({ onAddRecord }: { onAddRecord: () => void }) {
  return (
    <Card className="p-12 text-center">
      <p className="text-sm text-muted-foreground mb-4">No records yet.</p>
      <Button size="sm" onClick={onAddRecord}>
        <Plus className="h-4 w-4 mr-1" /> Add row
      </Button>
    </Card>
  );
}
