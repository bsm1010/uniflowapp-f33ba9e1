import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Loader2,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  Phone,
  MapPin,
  Building2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALGERIA_GEO, getCitiesForWilaya, isValidAlgerianPhone } from "@/lib/algeriaWilayas";
import { SuccessAnimation } from "@/components/auth/SuccessAnimation";

export const Route = createFileRoute("/signup")({
  component: SignUpPage,
  head: () => ({
    meta: [
      { title: "Create your store — Fennecly" },
      { name: "description", content: "Sign up free and launch your e-commerce store in minutes." },
    ],
  }),
});

const stagger = 0.06;

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * stagger, duration: 0.35, ease: "easeOut" as const },
  }),
};

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 3) return { score, label: "Medium", color: "bg-amber-500" };
  return { score, label: "Strong", color: "bg-emerald-500" };
}

function SignUpPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [city, setCity] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  const pwStrength = password ? getPasswordStrength(password) : null;
  const cities = wilaya ? getCitiesForWilaya(wilaya) : [];

  const schema = z.object({
    name: z.string().trim().min(1, t("auth.signup.errName")).max(80, t("auth.signup.errNameLong")),
    email: z.string().trim().email(t("auth.login.errEmail")).max(255),
    password: z.string().min(8, t("auth.signup.errPasswordShort")).max(72),
    phone: z
      .string()
      .refine((v) => !v || isValidAlgerianPhone(v), "Numéro de téléphone algérien invalide"),
    wilaya: z.string().min(1, "Veuillez sélectionner une wilaya"),
    city: z.string().min(1, "Veuillez sélectionner une commune"),
  });

  const requirements = [
    { label: "8+ caractères", met: password.length >= 8 },
    { label: "1 majuscule", met: /[A-Z]/.test(password) },
    { label: "1 chiffre", met: /[0-9]/.test(password) },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError(null);
    setSuccess(null);

    const parsed = schema.safeParse({ name, email, password, phone, wilaya, city });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0]) fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const refCode =
      typeof window !== "undefined"
        ? (new URLSearchParams(window.location.search).get("ref") ?? undefined)
        : undefined;
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          name: parsed.data.name,
          phone: parsed.data.phone,
          wilaya: parsed.data.wilaya,
          city: parsed.data.city,
          ...(refCode ? { referral_code: refCode } : {}),
        },
      },
    });
    setLoading(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    setHasSession(!!data.session);
    setShowSuccess(true);
  };

  return (
    <AuthLayout
      title={t("auth.signup.title")}
      subtitle={t("auth.signup.subtitle")}
      footer={
        <>
          {t("auth.signup.haveAccount")}{" "}
          <Link to="/login" className="text-violet-500 dark:text-violet-400 font-medium hover:underline">
            {t("auth.signup.login")}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            {t("auth.signup.name")}
          </Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("auth.signup.namePh")}
              autoComplete="name"
              disabled={loading}
              className="h-11 pl-10 rounded-xl border-border/60 bg-muted/30 focus:bg-background transition-colors"
            />
          </div>
          {errors.name && (
            <motion.p initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="text-xs text-destructive">
              {errors.name}
            </motion.p>
          )}
        </motion.div>

        {/* Email */}
        <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-2">
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
        </motion.div>

        {/* Password */}
        <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            {t("auth.login.password")}
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.signup.passwordPh")}
              autoComplete="new-password"
              disabled={loading}
              className="h-11 pl-10 pr-10 rounded-xl border-border/60 bg-muted/30 focus:bg-background transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {password && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((pwStrength?.score ?? 0) / 5) * 100}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={`h-full rounded-full ${pwStrength?.color}`}
                  />
                </div>
                <span className="text-xs text-muted-foreground min-w-[3rem] text-right">
                  {pwStrength?.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {requirements.map((req) => (
                  <span
                    key={req.label}
                    className={`inline-flex items-center gap-1 text-xs transition-colors ${
                      req.met ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                    }`}
                  >
                    {req.met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    {req.label}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
          {errors.password && (
            <motion.p initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="text-xs text-destructive">
              {errors.password}
            </motion.p>
          )}
        </motion.div>

        {/* Phone */}
        <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium">
            {t("auth.signup.phone", "Téléphone")}
          </Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+213 5XX XX XX XX"
              autoComplete="tel"
              disabled={loading}
              className="h-11 pl-10 rounded-xl border-border/60 bg-muted/30 focus:bg-background transition-colors"
            />
          </div>
          {errors.phone && (
            <motion.p initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="text-xs text-destructive">
              {errors.phone}
            </motion.p>
          )}
        </motion.div>

        {/* Wilaya */}
        <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-2">
          <Label className="text-sm font-medium">Wilaya</Label>
          <Select
            value={wilaya}
            onValueChange={(v) => {
              setWilaya(v);
              setCity("");
            }}
            disabled={loading}
          >
            <SelectTrigger className="h-11 rounded-xl border-border/60 bg-muted/30">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Sélectionnez votre wilaya" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {ALGERIA_GEO.map(({ wilaya: w, code }) => (
                <SelectItem key={w} value={w}>
                  {String(code).padStart(2, "0")} — {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.wilaya && (
            <motion.p initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="text-xs text-destructive">
              {errors.wilaya}
            </motion.p>
          )}
        </motion.div>

        {/* City */}
        <motion.div custom={5} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-2">
          <Label className="text-sm font-medium">Commune</Label>
          <Select value={city} onValueChange={setCity} disabled={loading || !wilaya}>
            <SelectTrigger className="h-11 rounded-xl border-border/60 bg-muted/30">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <SelectValue
                  placeholder={
                    wilaya ? "Sélectionnez votre commune" : "Choisissez d'abord une wilaya"
                  }
                />
              </div>
            </SelectTrigger>
            <SelectContent>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.city && (
            <motion.p initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="text-xs text-destructive">
              {errors.city}
            </motion.p>
          )}
        </motion.div>

        {formError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive"
          >
            {formError}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400"
          >
            {success}
          </motion.div>
        )}

        <motion.div
          custom={6}
          variants={fieldVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/25 font-semibold"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.signup.submit")}
          </Button>
        </motion.div>
      </form>

      {showSuccess && (
        <SuccessAnimation
          onComplete={() => {
            if (hasSession) navigate({ to: "/dashboard" });
            else setSuccess(t("auth.signup.checkEmail"));
          }}
        />
      )}
    </AuthLayout>
  );
}
