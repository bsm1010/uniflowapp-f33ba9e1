import { useState, useRef, useEffect } from "react";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface InlineEditableProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  maxLength?: number;
  disabled?: boolean;
}

export function InlineEditable({
  value,
  onSave,
  placeholder = "Click to edit",
  className,
  inputClassName,
  maxLength,
  disabled,
}: InlineEditableProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (trimmed === value || !trimmed) {
      setEditing(false);
      setDraft(value);
      return;
    }
    setSaving(true);
    try {
      await onSave(trimmed);
      setEditing(false);
    } catch {
      setDraft(value);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className={cn("inline-flex items-center gap-1.5", className)}>
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          maxLength={maxLength}
          className={cn(
            "h-8 rounded-lg border border-primary/30 bg-background px-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 min-w-0",
            inputClassName,
          )}
          disabled={saving}
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
          onClick={handleSave}
          disabled={saving || !draft.trim()}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={handleCancel}
          disabled={saving}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => !disabled && setEditing(true)}
      disabled={disabled}
      className={cn(
        "group inline-flex items-center gap-2 rounded-lg px-2 -mx-2 py-1 transition-colors hover:bg-muted/50",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <span className="text-inherit font-inherit truncate">{value || placeholder}</span>
      {!disabled && (
        <Pencil className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors shrink-0" />
      )}
    </button>
  );
}
