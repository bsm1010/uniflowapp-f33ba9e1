import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APPS_BY_KEY } from "@/lib/apps";

export const Route = createFileRoute("/dashboard/apps/$appKey")({
  component: AppDetailPage,
  head: ({ params }) => {
    const app = APPS_BY_KEY[params.appKey];
    return {
      meta: [
        { title: `${app?.name ?? "App"} — Storely` },
        {
          name: "description",
          content: app?.description ?? "Manage your installed app.",
        },
      ],
    };
  },
});

function AppDetailPage() {
  const { appKey } = Route.useParams();
  const navigate = useNavigate();
  const app = APPS_BY_KEY[appKey];

  if (!app) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold">App not found</h1>
        <p className="mt-2 text-muted-foreground">
          This app doesn't exist or is no longer available.
        </p>
        <Button className="mt-6" onClick={() => navigate({ to: "/dashboard" })}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  const Icon = app.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/dashboard">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </Button>

      <Card className="overflow-hidden border-border/60 shadow-soft">
        <div className={`h-32 bg-gradient-to-br ${app.gradient} relative`}>
          <div className="absolute -bottom-8 left-6">
            <div
              className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${app.gradient} flex items-center justify-center ring-4 ring-background shadow-lg`}
            >
              <Icon className="h-10 w-10 text-foreground" />
            </div>
          </div>
        </div>
        <CardContent className="pt-12 pb-6 px-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold font-display">{app.name}</h1>
                <Badge variant="secondary">{app.category}</Badge>
              </div>
              <p className="mt-2 text-muted-foreground">{app.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed border-border/60">
        <CardContent className="p-10 flex flex-col items-center justify-center text-center">
          <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-accent-foreground" />
          </div>
          <p className="mt-4 font-medium">Setup coming soon</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-md">
            We're putting the finishing touches on {app.name}. You'll be able to
            configure it right here shortly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
