import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SuccessAnimation } from "@/components/auth/SuccessAnimation";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Log in — Fennecly" },
      {
        name: "description",
        content:
          "Log in to your Fennecly account to manage your online store, track orders, update products, and run your business from one dashboard.",
      },
      { property: "og:title", content: "Log in — Fennecly" },
      {
        property: "og:description",
        content: "Log in to your Fennecly account to manage products, orders, and your storefront.",
      },
    ],
    links: [{ rel: "canonical", href: "https://fennecly.online/login" }],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const schema = z.object({
    email: z.string().trim().email(t("auth.login.errEmail")).max(255),
    password: z.string().min(1, t("auth.login.errPasswordRequired")).max(72),
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError(null);

    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0]) fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setLoading(false);

    if (error) {
      setFormError(error.message);
      return;
    }
    setShowSuccess(true);
  };

  return (
    <AuthLayout
      title={t("auth.login.title")}
      subtitle={t("auth.login.subtitle")}
      footer={
        <>
          {t("auth.login.newHere")}{" "}
          <Link to="/signup" className="text-violet-500 dark:text-violet-400 font-medium hover:underline">
            {t("auth.login.createAccount")}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            {t("auth.login.email")}
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.login.emailPh")}
              autoComplete="email"
              disabled={loading}
              className="h-11 pl-10 rounded-xl border-border/60 bg-muted/30 focus:bg-background transition-colors"
            />
          </div>
          {errors.email && (
            <motion.p initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="text-xs text-destructive">
              {errors.email}
            </motion.p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              {t("auth.login.password")}
            </Label>
            <Link
              to="/forgot-password"
              className="text-xs text-violet-500 dark:text-violet-400 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.login.passwordPh")}
              autoComplete="current-password"
              disabled={loading}
              className="h-11 pl-10 rounded-xl border-border/60 bg-muted/30 focus:bg-background transition-colors"
            />
          </div>
          {errors.password && (
            <motion.p initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="text-xs text-destructive">
              {errors.password}
            </motion.p>
          )}
        </div>

        {formError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive"
          >
            {formError}
          </motion.div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/25 font-semibold"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.login.submit")}
        </Button>

        <GoogleAuthButton />
      </form>

      {showSuccess && <SuccessAnimation onComplete={() => navigate({ to: "/select-store" })} />}
    </AuthLayout>
  );
}
