import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitDeletionRequest } from "@/lib/gdpr/deletion-request.functions";

interface Props {
  storeId: string;
  storeName: string;
}

export function DeletionRequestForm({ storeId, storeName }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Please fill in your name and email");
      return;
    }

    setSubmitting(true);
    try {
      await submitDeletionRequest({
        data: {
          storeId,
          name: name.trim(),
          email: email.trim(),
          reason: reason.trim() || undefined,
        },
      });
      setSubmitted(true);
      toast.success("Deletion request submitted successfully");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-border/60 max-w-lg mx-auto">
        <CardContent className="p-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white shadow-lg mb-4">
            <Trash2 className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-bold mb-2">Request Submitted</h3>
          <p className="text-muted-foreground">
            Your data deletion request has been submitted to {storeName}. The store owner will
            review your request and process it accordingly. You will be notified once the request is
            reviewed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 text-white shadow-md">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">Request Data Deletion</CardTitle>
            <CardDescription>
              Submit a request to delete your personal data from {storeName}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="del-name">Full Name *</Label>
            <Input
              id="del-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="del-email">Email Address *</Label>
            <Input
              id="del-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="del-reason">Reason (optional)</Label>
            <Textarea
              id="del-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why do you want your data deleted?"
              rows={3}
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            <Send className="h-4 w-4 mr-2" />
            {submitting ? "Submitting..." : "Submit Deletion Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
