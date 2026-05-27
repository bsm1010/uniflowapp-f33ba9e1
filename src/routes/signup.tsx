import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/signup")({
  component: SignUpPage,
  head: () => ({
    meta: [
      { title: "Create your store — Storely" },
      { name: "description", content: "Sign up free and launch your e-commerce store in minutes." },
    ],
  }),
});

function SignUpPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const schema = z.object({
    name: z.string().trim().min(1, t("auth.signup.errName")).max(80, t("auth.signup.errNameLong")),
    email: z.string().trim().email(t("auth.login.errEmail")).max(255),
    password: z.string().min(8, t("auth.signup.errPasswordShort")).max(72),
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError(null);
    setSuccess(null);

    const parsed = schema.safeParse({ name, email, password });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0]) fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const refCode = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("ref") ?? undefined
      : undefined;
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { name: parsed.data.name, ...(refCode ? { referral_code: refCode } : {}) },
      },
    });
    setLoading(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    if (data.session) {
      navigate({ to: "/dashboard" });
    } else {
      setSuccess(t("auth.signup.checkEmail"));
    }
  };

  return (
    <AuthLayout
      title={t("auth.signup.title")}
      subtitle={t("auth.signup.subtitle")}
      footer={
        <>
          {t("auth.signup.haveAccount")}{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            {t("auth.signup.login")}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">{t("auth.signup.name")}</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("auth.signup.namePh")}
            autoComplete="name"
            disabled={loading}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("auth.login.email")}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("auth.login.emailPh")}
            autoComplete="email"
            disabled={loading}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">{t("auth.login.password")}</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("auth.signup.passwordPh")}
            autoComplete="new-password"
            disabled={loading}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>

        {formError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive"
          >
            {formError}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-md bg-primary/10 border border-primary/30 px-3 py-2 text-xs text-foreground"
          >
            {success}
          </motion.div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-brand text-brand-foreground hover:opacity-90 shadow-glow"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.signup.submit")}
        </Button>
      </form>
    </AuthLayout>
  );
}
