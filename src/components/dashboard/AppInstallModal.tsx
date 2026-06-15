import { Check, Loader2, X, Zap, Shield, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AppDef } from "@/lib/apps";

export function AppInstallModal({
  app,
  onClose,
  onConfirm,
  installing,
}: {
  app: AppDef;
  onClose: () => void;
  onConfirm: () => void;
  installing: boolean;
}) {
  const Icon = app.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative bg-card text-card-foreground rounded-2xl shadow-lg border border-border w-full max-w-md overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-border flex items-start gap-4">
          <div className="h-14 w-14 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
            <Icon className="h-7 w-7 text-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">{app.name}</h2>
            <p className="text-sm text-muted-foreground">by {app.developer}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-sm font-medium">{app.rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">
                ({app.reviewCount.toLocaleString()})
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {app.longDescription ?? app.description}
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Zap, label: "Instant setup" },
              { icon: Shield, label: "Secure" },
              { icon: Clock, label: "Free to start" },
            ].map(({ icon: TrustIcon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 bg-muted rounded-lg p-3 border border-border"
              >
                <TrustIcon className="h-4 w-4 text-foreground" />
                <span className="text-xs font-medium text-center leading-tight">{label}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              What you get
            </p>
            <ul className="space-y-2">
              {app.features.slice(0, 4).map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-foreground shrink-0" strokeWidth={2.5} />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <Button onClick={onConfirm} disabled={installing} className="w-full">
              {installing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Installing...
                </>
              ) : (
                "Install app"
              )}
            </Button>
            <Button variant="ghost" onClick={onClose} className="w-full">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
