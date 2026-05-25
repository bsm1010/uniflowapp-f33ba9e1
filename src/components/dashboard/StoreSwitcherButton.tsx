import { useNavigate } from "@tanstack/react-router";
import { ChevronsUpDown, Store as StoreIcon } from "lucide-react";
import { useCurrentStore } from "@/hooks/use-current-store";

export function StoreSwitcherButton() {
  const { currentStore, stores } = useCurrentStore();
  const navigate = useNavigate();

  if (stores.length === 0) return null;

  return (
    <button
      onClick={() => navigate({ to: "/select-store" })}
      className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 hover:bg-accent transition-colors min-w-0 max-w-[220px]"
      title="Switch or create store"
    >
      <div className="h-7 w-7 rounded-md bg-muted overflow-hidden flex items-center justify-center shrink-0">
        {currentStore?.logo_url ? (
          <img src={currentStore.logo_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <StoreIcon className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="text-sm font-medium truncate">
          {currentStore?.name ?? "Select store"}
        </div>
      </div>
      <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  );
}
