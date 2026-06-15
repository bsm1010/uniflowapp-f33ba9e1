import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
  head: () => ({
    meta: [
      { title: "Reset password — Fennecly" },
      { name: "description", content: "Request a password reset link for your account." },
    ],
  }),
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const schema = z.object({ email: z.string().trim().email("Enter a valid email").max(255) });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid email");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
  };

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="We'll email you a link to reset it."
      footer={
        <>
          Remembered it?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Back to login
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="rounded-md bg-primary/10 border border-primary/30 px-3 py-3 text-sm text-foreground">
          Check your inbox for a reset link at <span className="font-medium">{email}</span>.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loading}
            />
          </div>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive"
            >
              {error}
            </motion.div>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-brand text-brand-foreground hover:opacity-90 shadow-glow"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
