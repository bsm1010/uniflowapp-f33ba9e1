import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Legacy route: the customize editor now lives at /customize as a full-screen
 * standalone page (outside the dashboard layout). When this URL is visited,
 * we open the editor in a new tab and bounce the user back to the dashboard.
 */
export const Route = createFileRoute("/dashboard/themes")({
  component: ThemesRedirect,
  head: () => ({ meta: [{ title: "Customize Store — Storely" }] }),
});

function ThemesRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    // Open the new full-screen editor in a new tab
    const win = window.open("/customize", "_blank", "noopener,noreferrer");
    // Send the current tab back to dashboard home
    navigate({ to: "/dashboard" });
    // If popups were blocked, the manual button below acts as a fallback
    void win;
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <p className="mt-4 text-sm text-muted-foreground">
        Opening the store editor in a new tab…
      </p>
      <Button
        variant="outline"
        className="mt-4"
        onClick={() => window.open("/customize", "_blank", "noopener,noreferrer")}
      >
        <ExternalLink className="h-4 w-4" /> Open editor manually
      </Button>
    </div>
  );
}
