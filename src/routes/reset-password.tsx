import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Set a new password — Fennecly" },
      { name: "description", content: "Choose a new password for your account." },
    ],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase recovery link lands here; the client picks up the session from the URL hash.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const schema = z
    .object({
      password: z.string().min(8, "At least 8 characters").max(72),
      confirm: z.string(),
    })
    .refine((d) => d.password === d.confirm, {
      path: ["confirm"],
      message: "Passwords don't match",
    });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid password");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password: parsed.data.password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setDone(true);
    setTimeout(() => navigate({ to: "/dashboard" }), 1200);
  };

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose something strong you don't use elsewhere."
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline">
          Back to login
        </Link>
      }
    >
      {done ? (
        <div className="rounded-md bg-primary/10 border border-primary/30 px-3 py-3 text-sm">
          Password updated. Redirecting…
        </div>
      ) : !ready ? (
        <div className="text-sm text-muted-foreground text-center py-6">Validating reset link…</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
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
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
