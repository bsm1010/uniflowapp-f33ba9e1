import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Mail, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentStore } from "@/hooks/use-current-store";
import {
  requestDataExport,
  processDataExport,
  getExportRequests,
  type ExportRequest,
} from "@/lib/gdpr/data-export.functions";

export function DataExportSection() {
  const { user } = useAuth();
  const { currentStore } = useCurrentStore();
  const [requests, setRequests] = useState<ExportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<"download" | "email">("download");

  const loadRequests = useCallback(async () => {
    if (!currentStore) return;
    const data = await getExportRequests({ data: { storeId: currentStore.id } });
    setRequests(data);
    setLoading(false);
  }, [currentStore]);

  useEffect(() => {
    loadRequests();
  }, [currentStore, loadRequests]);

  const handleRequestExport = async () => {
    if (!user || !currentStore) return;
    setRequesting(true);
    try {
      await requestDataExport({
        data: {
          storeId: currentStore.id,
          userId: user.id,
          email: user.email ?? "",
          deliveryMethod,
        },
      });
      toast.success("Export request submitted");
      await loadRequests();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to request export");
    } finally {
      setRequesting(false);
    }
  };

  const handleProcessExport = async (requestId: string) => {
    if (!user) return;
    setProcessing(requestId);
    try {
      const result = await processDataExport({
        data: { requestId, accessToken: "" },
      });
      if (result.fileUrl) {
        window.open(result.fileUrl, "_blank");
      }
      toast.success("Export completed");
      await loadRequests();
    } catch (err: any) {
      toast.error(err.message ?? "Export failed");
    } finally {
      setProcessing(null);
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <Card className="border-border/60">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-md">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">Data Export</CardTitle>
            <CardDescription>
              Export your store data or manage customer export requests
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Label>Delivery Method</Label>
          <RadioGroup value={deliveryMethod} onValueChange={(v) => setDeliveryMethod(v as any)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="download" id="download" />
              <Label htmlFor="download" className="flex items-center gap-2 cursor-pointer">
                <Download className="h-4 w-4" /> Download JSON
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="email" id="email" />
              <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer">
                <Mail className="h-4 w-4" /> Email
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Button onClick={handleRequestExport} disabled={requesting} className="w-full">
          {requesting ? "Requesting..." : "Export My Data"}
        </Button>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Export History</h4>
          {loading ? (
            <div className="h-16 animate-pulse rounded-lg bg-muted" />
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No export requests yet</p>
          ) : (
            <div className="space-y-2">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    {statusIcon(req.status)}
                    <div>
                      <p className="text-sm font-medium">
                        {req.request_type === "merchant"
                          ? "Store Data"
                          : `Customer: ${req.customer_name}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={req.status === "completed" ? "default" : "secondary"}>
                      {req.status}
                    </Badge>
                    {req.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleProcessExport(req.id)}
                        disabled={processing === req.id}
                      >
                        {processing === req.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Process"
                        )}
                      </Button>
                    )}
                    {req.status === "completed" && req.file_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={req.file_url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-3 w-3 mr-1" /> Download
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
