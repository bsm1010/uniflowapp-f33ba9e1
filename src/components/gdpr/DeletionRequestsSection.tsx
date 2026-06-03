import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentStore } from "@/hooks/use-current-store";
import {
  getDeletionRequests,
  getDeletionRequestStats,
  reviewDeletionRequest,
  processDeletion,
  type DeletionRequest,
} from "@/lib/gdpr/deletion-request.functions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DeletionRequestsSection() {
  const { user } = useAuth();
  const { currentStore } = useCurrentStore();
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<DeletionRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadData = async () => {
    if (!currentStore) return;
    const [reqs, st] = await Promise.all([
      getDeletionRequests({ data: { storeId: currentStore.id } }),
      getDeletionRequestStats({ data: { storeId: currentStore.id } }),
    ]);
    setRequests(reqs);
    setStats(st);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentStore]);

  const handleReview = async (status: "approved" | "rejected") => {
    if (!user || !selectedRequest) return;
    try {
      await reviewDeletionRequest({
        data: {
          requestId: selectedRequest.id,
          status,
          notes: reviewNotes || undefined,
          reviewedBy: user.id,
        },
      });
      toast.success(`Request ${status}`);
      setSelectedRequest(null);
      setReviewNotes("");
      await loadData();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to review");
    }
  };

  const handleProcess = async (requestId: string) => {
    if (!user) return;
    setProcessingId(requestId);
    try {
      await processDeletion({
        data: { requestId, accessToken: "" },
      });
      toast.success("Deletion processed");
      await loadData();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to process");
    } finally {
      setProcessingId(null);
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <Card className="border-border/60 shadow-soft">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 text-white shadow-md">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">Deletion Requests</CardTitle>
            <CardDescription>Review and process customer data deletion requests</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!loading && (
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10">
              <p className="text-lg font-bold text-amber-600">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div className="p-2 rounded-lg bg-green-500/10">
              <p className="text-lg font-bold text-green-600">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="p-2 rounded-lg bg-red-500/10">
              <p className="text-lg font-bold text-red-600">{stats.rejected}</p>
              <p className="text-xs text-muted-foreground">Rejected</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No deletion requests</p>
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
                    <p className="text-sm font-medium">{req.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{req.customer_email}</p>
                    {req.reason && (
                      <p className="text-xs text-muted-foreground italic">"{req.reason}"</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={req.status === "pending" ? "secondary" : "default"}>
                    {req.status}
                  </Badge>
                  {req.status === "pending" && (
                    <Button size="sm" variant="outline" onClick={() => setSelectedRequest(req)}>
                      <Eye className="h-3 w-3 mr-1" /> Review
                    </Button>
                  )}
                  {req.status === "approved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleProcess(req.id)}
                      disabled={processingId === req.id}
                    >
                      {processingId === req.id ? "Processing..." : "Execute"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review Deletion Request</DialogTitle>
              <DialogDescription>
                Review the deletion request from {selectedRequest?.customer_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Customer</p>
                <p className="text-sm text-muted-foreground">{selectedRequest?.customer_name} ({selectedRequest?.customer_email})</p>
              </div>
              {selectedRequest?.reason && (
                <div>
                  <p className="text-sm font-medium">Reason</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.reason}</p>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Review Notes (optional)</Label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this decision..."
                />
              </div>
            </div>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => handleReview("rejected")}>
                Reject
              </Button>
              <Button onClick={() => handleReview("approved")}>
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
