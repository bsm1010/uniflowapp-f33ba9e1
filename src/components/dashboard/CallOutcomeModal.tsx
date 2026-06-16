import { useState } from "react";
import { CheckCircle2, XCircle, RotateCcw, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCallLog } from "@/hooks/use-call-log";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CallOutcomeModalProps {
  open: boolean;
  onClose: () => void;
  callLogId: string;
  customerName: string;
  onOutcomeLogged: () => void;
}

const OUTCOMES = [
  {
    value: "answered" as const,
    label: "Answered",
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "hover:bg-emerald-500/10 border-emerald-500/30",
    activeBg: "bg-emerald-500/15 border-emerald-500/50",
  },
  {
    value: "no_answer" as const,
    label: "No answer",
    icon: XCircle,
    color: "text-rose-600 dark:text-rose-400",
    bg: "hover:bg-rose-500/10 border-rose-500/30",
    activeBg: "bg-rose-500/15 border-rose-500/50",
  },
  {
    value: "callback" as const,
    label: "Call back later",
    icon: RotateCcw,
    color: "text-amber-600 dark:text-amber-400",
    bg: "hover:bg-amber-500/10 border-amber-500/30",
    activeBg: "bg-amber-500/15 border-amber-500/50",
  },
];

export function CallOutcomeModal({
  open,
  onClose,
  callLogId,
  customerName,
  onOutcomeLogged,
}: CallOutcomeModalProps) {
  const { updateOutcome } = useCallLog();
  const [selected, setSelected] = useState<"answered" | "no_answer" | "callback" | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async (outcome: "answered" | "no_answer" | "callback") => {
    setSaving(true);
    try {
      await updateOutcome(callLogId, outcome, note.trim() || undefined);
      toast.success("Call outcome saved");
      onOutcomeLogged();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>How did the call go with {customerName}?</DialogTitle>
          <DialogDescription>Select the outcome of this call.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 mt-2">
          {OUTCOMES.map((o) => {
            const Icon = o.icon;
            const isActive = selected === o.value;
            return (
              <button
                key={o.value}
                type="button"
                disabled={saving}
                onClick={() => {
                  setSelected(o.value);
                  handleSave(o.value);
                }}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                  isActive ? o.activeBg : o.bg,
                  saving && "opacity-60 cursor-not-allowed",
                )}
              >
                {saving && isActive ? (
                  <Loader2 className={cn("h-6 w-6 animate-spin", o.color)} />
                ) : (
                  <Icon className={cn("h-6 w-6", o.color)} />
                )}
                <span className={cn("text-sm font-medium", o.color)}>{o.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <Textarea
            placeholder="Add a note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 200))}
            rows={2}
            className="resize-none text-sm"
          />
        </div>

        <div className="mt-2 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
