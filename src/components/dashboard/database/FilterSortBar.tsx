import { useState } from "react";
import { Filter, ArrowUpDown, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import type { DBField, DBRecord } from "./TableViews";

export type FilterOp =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "is_empty"
  | "is_not_empty"
  | "gt"
  | "lt";

export type FilterRule = {
  id: string;
  fieldId: string;
  op: FilterOp;
  value: string;
};

export type SortRule = {
  id: string;
  fieldId: string;
  direction: "asc" | "desc";
};

export type FilterSortConfig = {
  filters: FilterRule[];
  filterCombinator: "AND" | "OR";
  sorts: SortRule[];
};

export const DEFAULT_FILTER_SORT: FilterSortConfig = {
  filters: [],
  filterCombinator: "AND",
  sorts: [],
};

const OP_LABELS: Record<FilterOp, string> = {
  equals: "equals",
  not_equals: "≠",
  contains: "contains",
  not_contains: "doesn't contain",
  is_empty: "is empty",
  is_not_empty: "is not empty",
  gt: ">",
  lt: "<",
};

function opsForField(field: DBField | undefined): FilterOp[] {
  if (!field) return ["equals", "not_equals", "is_empty", "is_not_empty"];
  switch (field.field_type) {
    case "number":
    case "date":
      return ["equals", "not_equals", "gt", "lt", "is_empty", "is_not_empty"];
    case "boolean":
      return ["equals"];
    case "select":
    case "relation":
      return ["equals", "not_equals", "is_empty", "is_not_empty"];
    case "multi_select":
      return ["contains", "not_contains", "is_empty", "is_not_empty"];
    default:
      return [
        "contains",
        "not_contains",
        "equals",
        "not_equals",
        "is_empty",
        "is_not_empty",
      ];
  }
}

export function FilterSortBar({
  fields,
  config,
  onChange,
}: {
  fields: DBField[];
  config: FilterSortConfig;
  onChange: (next: FilterSortConfig) => void;
}) {
  const activeCount = config.filters.length + config.sorts.length;

  function addFilter() {
    if (fields.length === 0) return;
    onChange({
      ...config,
      filters: [
        ...config.filters,
        {
          id: crypto.randomUUID(),
          fieldId: fields[0].id,
          op: opsForField(fields[0])[0],
          value: "",
        },
      ],
    });
  }

  function updateFilter(id: string, patch: Partial<FilterRule>) {
    onChange({
      ...config,
      filters: config.filters.map((f) =>
        f.id === id ? { ...f, ...patch } : f,
      ),
    });
  }

  function removeFilter(id: string) {
    onChange({
      ...config,
      filters: config.filters.filter((f) => f.id !== id),
    });
  }

  function addSort() {
    if (fields.length === 0) return;
    onChange({
      ...config,
      sorts: [
        ...config.sorts,
        { id: crypto.randomUUID(), fieldId: fields[0].id, direction: "asc" },
      ],
    });
  }

  function updateSort(id: string, patch: Partial<SortRule>) {
    onChange({
      ...config,
      sorts: config.sorts.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  }

  function removeSort(id: string) {
    onChange({
      ...config,
      sorts: config.sorts.filter((s) => s.id !== id),
    });
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Filter popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            Filter
            {config.filters.length > 0 && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px] ml-0.5">
                {config.filters.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[440px] p-3 space-y-2">
          {config.filters.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              No filters yet. Add one to narrow down records.
            </p>
          ) : (
            <>
              {config.filters.length > 1 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Match</span>
                  <Select
                    value={config.filterCombinator}
                    onValueChange={(v) =>
                      onChange({ ...config, filterCombinator: v as "AND" | "OR" })
                    }
                  >
                    <SelectTrigger className="h-7 w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">All</SelectItem>
                      <SelectItem value="OR">Any</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground">of the following</span>
                </div>
              )}
              {config.filters.map((f) => {
                const field = fields.find((x) => x.id === f.fieldId);
                const ops = opsForField(field);
                const needsValue = !["is_empty", "is_not_empty"].includes(f.op);
                return (
                  <div key={f.id} className="flex items-center gap-1.5">
                    <Select
                      value={f.fieldId}
                      onValueChange={(v) => {
                        const nextField = fields.find((x) => x.id === v);
                        const nextOps = opsForField(nextField);
                        updateFilter(f.id, {
                          fieldId: v,
                          op: nextOps.includes(f.op) ? f.op : nextOps[0],
                        });
                      }}
                    >
                      <SelectTrigger className="h-8 flex-1 min-w-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fields.map((fd) => (
                          <SelectItem key={fd.id} value={fd.id}>
                            {fd.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={f.op}
                      onValueChange={(v) => updateFilter(f.id, { op: v as FilterOp })}
                    >
                      <SelectTrigger className="h-8 w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ops.map((op) => (
                          <SelectItem key={op} value={op}>
                            {OP_LABELS[op]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {needsValue && (
                      <FilterValueInput
                        field={field}
                        value={f.value}
                        onChange={(v) => updateFilter(f.id, { value: v })}
                      />
                    )}
                    <button
                      onClick={() => removeFilter(f.id)}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-start"
            onClick={addFilter}
            disabled={fields.length === 0}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add filter
          </Button>
        </PopoverContent>
      </Popover>

      {/* Sort popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant="outline" className="gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5" />
            Sort
            {config.sorts.length > 0 && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px] ml-0.5">
                {config.sorts.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[360px] p-3 space-y-2">
          {config.sorts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              No sorts yet. Add one to order records.
            </p>
          ) : (
            config.sorts.map((s) => (
              <div key={s.id} className="flex items-center gap-1.5">
                <Select
                  value={s.fieldId}
                  onValueChange={(v) => updateSort(s.id, { fieldId: v })}
                >
                  <SelectTrigger className="h-8 flex-1 min-w-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map((fd) => (
                      <SelectItem key={fd.id} value={fd.id}>
                        {fd.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={s.direction}
                  onValueChange={(v) =>
                    updateSort(s.id, { direction: v as "asc" | "desc" })
                  }
                >
                  <SelectTrigger className="h-8 w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">A → Z</SelectItem>
                    <SelectItem value="desc">Z → A</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  onClick={() => removeSort(s.id)}
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-start"
            onClick={addSort}
            disabled={fields.length === 0}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add sort
          </Button>
        </PopoverContent>
      </Popover>

      {activeCount > 0 && (
        <Button
          size="sm"
          variant="ghost"
          className="text-xs text-muted-foreground"
          onClick={() => onChange(DEFAULT_FILTER_SORT)}
        >
          Clear all
        </Button>
      )}
    </div>
  );
}

function FilterValueInput({
  field,
  value,
  onChange,
}: {
  field: DBField | undefined;
  value: string;
  onChange: (v: string) => void;
}) {
  if (!field) {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-[140px]"
      />
    );
  }
  if (field.field_type === "boolean") {
    return (
      <Select value={value || "true"} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">True</SelectItem>
          <SelectItem value="false">False</SelectItem>
        </SelectContent>
      </Select>
    );
  }
  if (field.field_type === "select" || field.field_type === "multi_select") {
    const choices = field.options.choices ?? [];
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-[140px]">
          <SelectValue placeholder="Choose…" />
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
  return (
    <Input
      type={
        field.field_type === "number"
          ? "number"
          : field.field_type === "date"
            ? "date"
            : "text"
      }
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-[140px]"
    />
  );
}

// ===================== Apply Filters / Sorts =====================
function isEmpty(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === "string" && v.trim() === "") return true;
  if (Array.isArray(v) && v.length === 0) return true;
  return false;
}

function evaluateFilter(rec: DBRecord, rule: FilterRule, field: DBField | undefined): boolean {
  const cell = rec.data[rule.fieldId];
  switch (rule.op) {
    case "is_empty":
      return isEmpty(cell);
    case "is_not_empty":
      return !isEmpty(cell);
    case "equals":
      if (field?.field_type === "boolean") return !!cell === (rule.value === "true");
      if (field?.field_type === "number")
        return Number(cell) === Number(rule.value);
      return String(cell ?? "") === rule.value;
    case "not_equals":
      if (field?.field_type === "boolean") return !!cell !== (rule.value === "true");
      if (field?.field_type === "number")
        return Number(cell) !== Number(rule.value);
      return String(cell ?? "") !== rule.value;
    case "contains":
      if (Array.isArray(cell))
        return (cell as unknown[]).map(String).includes(rule.value);
      return String(cell ?? "").toLowerCase().includes(rule.value.toLowerCase());
    case "not_contains":
      if (Array.isArray(cell))
        return !(cell as unknown[]).map(String).includes(rule.value);
      return !String(cell ?? "").toLowerCase().includes(rule.value.toLowerCase());
    case "gt":
      if (field?.field_type === "date")
        return String(cell ?? "") > rule.value;
      return Number(cell) > Number(rule.value);
    case "lt":
      if (field?.field_type === "date")
        return String(cell ?? "") < rule.value;
      return Number(cell) < Number(rule.value);
    default:
      return true;
  }
}

export function applyFilterSort(
  records: DBRecord[],
  fields: DBField[],
  config: FilterSortConfig,
): DBRecord[] {
  let out = records;

  // Filter
  if (config.filters.length > 0) {
    out = out.filter((rec) => {
      const results = config.filters.map((rule) => {
        const field = fields.find((f) => f.id === rule.fieldId);
        return evaluateFilter(rec, rule, field);
      });
      return config.filterCombinator === "AND"
        ? results.every(Boolean)
        : results.some(Boolean);
    });
  }

  // Sort
  if (config.sorts.length > 0) {
    out = [...out].sort((a, b) => {
      for (const s of config.sorts) {
        const field = fields.find((f) => f.id === s.fieldId);
        const av = a.data[s.fieldId];
        const bv = b.data[s.fieldId];
        const aEmpty = isEmpty(av);
        const bEmpty = isEmpty(bv);
        if (aEmpty && bEmpty) continue;
        if (aEmpty) return 1;
        if (bEmpty) return -1;
        let cmp = 0;
        if (field?.field_type === "number") {
          cmp = Number(av) - Number(bv);
        } else {
          cmp = String(av).localeCompare(String(bv));
        }
        if (cmp !== 0) return s.direction === "asc" ? cmp : -cmp;
      }
      return 0;
    });
  }

  return out;
}
