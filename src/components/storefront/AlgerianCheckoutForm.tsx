import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ShoppingBag,
  Home,
  Building2,
  User,
  Phone,
  MapPin,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { createOrder } from "@/lib/orders/create-order.functions";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ALGERIA_WILAYAS, WILAYA_LIST, isValidAlgerianPhone } from "@/lib/algeriaWilayas";

type Tokens = {
  primary: string;
  onPrimary: string;
  fg: string;
  bg: string;
  surface: string;
  surfaceStrong: string;
  border: string;
  muted: string;
  isDark: boolean;
};

type Props = {
  storeOwnerId: string;
  storeSlug: string;
  product: {
    id: string;
    name: string;
    price: number;
    image: string | null;
  };
  quantity: number;
  tokens: Tokens;
  radius: number;
  onSuccess?: (orderId: string) => void;
};

const makeSchema = (tr: (k: string) => string) =>
  z.object({
    firstName: z.string().trim().min(2, tr("storefront.cod.errFirstName")).max(60),
    lastName: z.string().trim().min(2, tr("storefront.cod.errLastName")).max(60),
    phone: z
      .string()
      .trim()
      .min(1, tr("storefront.cod.errPhoneReq"))
      .refine(isValidAlgerianPhone, tr("storefront.cod.errPhoneInvalid")),
    wilaya: z.string().min(1, tr("storefront.cod.errWilaya")),
    city: z.string().min(1, tr("storefront.cod.errCity")),
    deliveryType: z.enum(["domicile", "stopdesk"]),
  });

type FormErrors = Partial<
  Record<"firstName" | "lastName" | "phone" | "wilaya" | "city" | "deliveryType", string>
>;

const STEPS = ["info", "delivery", "confirm"] as const;

export function AlgerianCheckoutForm({
  storeOwnerId,
  storeSlug,
  product,
  quantity,
  tokens: t,
  radius,
  onSuccess,
}: Props) {
  const { t: tr } = useTranslation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<number>(0);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [city, setCity] = useState("");
  const [deliveryType, setDeliveryType] = useState<"domicile" | "stopdesk">("domicile");
  const [shippingPrice, setShippingPrice] = useState<number | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);

  const cities = useMemo(() => (wilaya ? (ALGERIA_WILAYAS[wilaya] ?? []) : []), [wilaya]);

  const subtotal = product.price * quantity;
  const total = subtotal + (shippingPrice ?? 0);

  useEffect(() => {
    if (!wilaya) {
      setShippingPrice(null);
      return;
    }

    let cancelled = false;
    setShippingLoading(true);

    (async () => {
      const wilayaNorm = wilaya.trim();
      const cityNorm = (city ?? "").trim();

      const { data, error } = await supabase
        .from("delivery_tariffs")
        .select("price, city")
        .eq("store_id", storeOwnerId)
        .eq("wilaya", wilayaNorm)
        .eq("delivery_type", deliveryType);

      if (cancelled) return;

      if (error || !data || data.length === 0) {
        setShippingPrice(null);
        setShippingLoading(false);
        return;
      }

      const exact = cityNorm
        ? data.find((r) => (r.city ?? "").trim().toLowerCase() === cityNorm.toLowerCase())
        : null;

      const wilayaDefault = data.find((r) => !r.city || r.city.trim() === "");
      const chosen = exact ?? wilayaDefault ?? data[0];

      setShippingPrice(chosen ? Number(chosen.price) : null);
      setShippingLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [wilaya, city, deliveryType, storeOwnerId]);

  const validateInfoStep = (): boolean => {
    const schema = z.object({
      firstName: z.string().trim().min(2).max(60),
      lastName: z.string().trim().min(2).max(60),
      phone: z.string().trim().min(1).refine(isValidAlgerianPhone),
    });
    const result = schema.safeParse({ firstName, lastName, phone });
    if (!result.success) {
      const errs: FormErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormErrors;
        if (!errs[key]) errs[key] = issue.message;
      }
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  };

  const validateDeliveryStep = (): boolean => {
    const schema = z.object({
      wilaya: z.string().min(1),
      city: z.string().min(1),
      deliveryType: z.enum(["domicile", "stopdesk"]),
    });
    const result = schema.safeParse({ wilaya, city, deliveryType });
    if (!result.success) {
      const errs: FormErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormErrors;
        if (!errs[key]) errs[key] = issue.message;
      }
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  };

  const nextStep = () => {
    if (step === 0 && !validateInfoStep()) return;
    if (step === 1 && !validateDeliveryStep()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    const schema = makeSchema(tr);
    const parsed = schema.safeParse({
      firstName,
      lastName,
      phone,
      wilaya,
      city,
      deliveryType,
    });

    if (!parsed.success) {
      const errs: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormErrors;
        if (!errs[key]) errs[key] = issue.message;
      }
      setErrors(errs);
      setStep(0);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const result = await createOrder({
        data: {
          storeSlug,
          customerName: `${parsed.data.firstName} ${parsed.data.lastName}`,
          customerEmail: "",
          customerPhone: phone,
          shippingAddress: `${parsed.data.wilaya}, ${parsed.data.city}`,
          shippingCity: parsed.data.city,
          shippingWilaya: parsed.data.wilaya,
          shippingCountry: "Algeria",
          deliveryType: parsed.data.deliveryType,
          items: [{ productId: product.id, quantity }],
        },
      });

      toast.success(tr("storefront.cod.successToast"), {
        description: tr("storefront.cod.successDesc"),
        duration: 5000,
      });

      setSuccessOrderId(result.orderId);
      onSuccess?.(result.orderId);
    } catch (err) {
      console.error(err);
      toast.error(tr("storefront.cod.errOrder"));
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setSuccessOrderId(null);
    setStep(0);
    setFirstName("");
    setLastName("");
    setPhone("");
    setWilaya("");
    setCity("");
    setDeliveryType("domicile");
    setShippingPrice(null);
    setErrors({});
    setOpen(false);
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: t.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
    color: t.fg,
    border: `1px solid ${t.border}`,
    borderRadius: Math.min(radius, 16),
    transition: "border-color 0.2s",
    width: "100%",
    padding: "12px 14px",
    fontSize: 14,
    outline: "none",
  };

  const stepLabel = (i: number) => {
    if (i === 0) return tr("storefront.checkout.section") || "Personal Info";
    if (i === 1) return tr("storefront.checkout.deliveryType") || "Delivery";
    return tr("storefront.checkout.summary") || "Confirm";
  };

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(v) => {
          if (!v) resetAndClose();
          else setOpen(true);
        }}
      >
        <SheetContent
          side="bottom"
          className="max-h-[90dvh] overflow-y-auto p-0"
          style={{
            borderRadius: `${Math.min(radius * 2, 24)}px ${Math.min(radius * 2, 24)}px 0 0`,
          }}
        >
          <SheetTitle className="sr-only">{tr("storefront.cod.title")}</SheetTitle>
          <SheetDescription className="sr-only">{tr("storefront.cod.subtitle")}</SheetDescription>

          {successOrderId ? (
            <SuccessPanel
              orderId={successOrderId}
              slug={storeSlug}
              tokens={t}
              radius={radius}
              onClose={resetAndClose}
            />
          ) : (
            <div className="p-6 sm:p-8">
              {/* Step indicators */}
              <StepIndicator
                steps={STEPS}
                current={step}
                label={stepLabel}
                tokens={t}
                radius={radius}
              />

              {/* Step 0: Personal info */}
              {step === 0 && (
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                      icon={<User className="h-4 w-4" style={{ color: t.primary }} />}
                      label={tr("storefront.cod.firstName")}
                      error={errors.firstName}
                      mutedColor={t.muted}
                      fieldId="firstName"
                    >
                      <input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Ahmed"
                        aria-required="true"
                        aria-describedby={errors.firstName ? "firstName-error" : undefined}
                        style={inputStyle}
                      />
                    </Field>

                    <Field
                      icon={<User className="h-4 w-4" style={{ color: t.primary }} />}
                      label={tr("storefront.cod.lastName")}
                      error={errors.lastName}
                      mutedColor={t.muted}
                      fieldId="lastName"
                    >
                      <input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Benali"
                        aria-required="true"
                        aria-describedby={errors.lastName ? "lastName-error" : undefined}
                        style={inputStyle}
                      />
                    </Field>
                  </div>

                  <Field
                    icon={<Phone className="h-4 w-4" style={{ color: t.primary }} />}
                    label={tr("storefront.cod.phone")}
                    error={errors.phone}
                    mutedColor={t.muted}
                    fieldId="phone"
                  >
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0555 12 34 56"
                      inputMode="tel"
                      aria-required="true"
                      aria-describedby={errors.phone ? "phone-error" : undefined}
                      style={inputStyle}
                    />
                  </Field>
                </div>
              )}

              {/* Step 1: Delivery */}
              {step === 1 && (
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                      icon={<MapPin className="h-4 w-4" style={{ color: t.primary }} />}
                      label={tr("storefront.cod.wilaya")}
                      error={errors.wilaya}
                      mutedColor={t.muted}
                      fieldId="wilaya"
                    >
                      <SearchableSelect
                        value={wilaya}
                        onChange={(v) => {
                          setWilaya(v);
                          setCity("");
                        }}
                        options={WILAYA_LIST}
                        placeholder={tr("storefront.cod.selectWilaya")}
                        searchPlaceholder={tr("storefront.cod.searchWilaya")}
                        emptyMessage={tr("storefront.cod.noWilaya")}
                        triggerStyle={{
                          backgroundColor: t.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                          border: `1px solid ${t.border}`,
                          borderRadius: Math.min(radius, 16),
                          color: t.fg,
                        }}
                      />
                    </Field>

                    <Field
                      icon={<MapPin className="h-4 w-4" style={{ color: t.primary }} />}
                      label={tr("storefront.cod.city")}
                      error={errors.city}
                      mutedColor={t.muted}
                      fieldId="city"
                    >
                      <SearchableSelect
                        value={city}
                        onChange={setCity}
                        options={cities}
                        placeholder={
                          wilaya
                            ? tr("storefront.cod.selectCity")
                            : tr("storefront.cod.pickWilayaFirst")
                        }
                        searchPlaceholder={tr("storefront.cod.searchCity")}
                        emptyMessage={tr("storefront.cod.noCity")}
                        disabled={!wilaya}
                        triggerStyle={{
                          backgroundColor: t.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                          border: `1px solid ${t.border}`,
                          borderRadius: Math.min(radius, 16),
                          color: t.fg,
                        }}
                      />
                    </Field>
                  </div>

                  <Field label={tr("storefront.cod.deliveryType")} mutedColor={t.muted} fieldId="deliveryType">
                    <div className="grid grid-cols-2 gap-3">
                      {(["domicile", "stopdesk"] as const).map((type) => {
                        const active = deliveryType === type;
                        const Icon = type === "domicile" ? Home : Building2;
                        return (
                          <button
                            type="button"
                            key={type}
                            onClick={() => setDeliveryType(type)}
                            className="flex flex-col items-center gap-2 py-4 px-3 text-sm font-medium transition-all duration-200"
                            style={{
                              border: `2px solid ${active ? t.primary : t.border}`,
                              backgroundColor: active ? t.primary + "15" : t.surface,
                              color: active ? t.primary : t.muted,
                              borderRadius: Math.min(radius, 16),
                            }}
                          >
                            <Icon className="h-5 w-5" />
                            <span>
                              {type === "domicile"
                                ? tr("storefront.cod.deliveryHome")
                                : tr("storefront.cod.deliveryStopdesk")}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                </div>
              )}

              {/* Step 2: Confirm */}
              {step === 2 && (
                <div className="mt-6 space-y-4">
                  {/* Product summary */}
                  <div
                    className="flex items-center gap-4 p-4"
                    style={{
                      borderRadius: Math.min(radius, 16),
                      border: `1px solid ${t.border}`,
                      backgroundColor: t.surface,
                    }}
                  >
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-16 w-16 shrink-0 object-cover"
                        style={{ borderRadius: Math.min(radius / 2, 8) }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate" style={{ color: t.fg }}>
                        {product.name}
                      </div>
                      <div className="text-sm mt-0.5" style={{ color: t.muted }}>
                        ×{quantity}
                      </div>
                    </div>
                    <div className="font-semibold tabular-nums" style={{ color: t.fg }}>
                      {subtotal.toFixed(2)} DA
                    </div>
                  </div>

                  {/* Delivery details */}
                  <div
                    className="p-4 space-y-2 text-sm"
                    style={{
                      borderRadius: Math.min(radius, 16),
                      border: `1px solid ${t.border}`,
                      backgroundColor: t.surface,
                    }}
                  >
                    <div className="flex items-center gap-2" style={{ color: t.muted }}>
                      <User className="h-4 w-4" />
                      <span style={{ color: t.fg }}>
                        {firstName} {lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2" style={{ color: t.muted }}>
                      <Phone className="h-4 w-4" />
                      <span style={{ color: t.fg }}>{phone}</span>
                    </div>
                    <div className="flex items-center gap-2" style={{ color: t.muted }}>
                      <MapPin className="h-4 w-4" />
                      <span style={{ color: t.fg }}>
                        {wilaya}, {city}
                      </span>
                    </div>
                    <div className="flex items-center gap-2" style={{ color: t.muted }}>
                      {deliveryType === "domicile" ? (
                        <Home className="h-4 w-4" />
                      ) : (
                        <Building2 className="h-4 w-4" />
                      )}
                      <span style={{ color: t.fg }}>
                        {deliveryType === "domicile"
                          ? tr("storefront.cod.deliveryHome")
                          : tr("storefront.cod.deliveryStopdesk")}
                      </span>
                    </div>
                  </div>

                  {/* Totals */}
                  <div
                    className="p-4 space-y-2.5 text-sm"
                    style={{
                      borderRadius: Math.min(radius, 16),
                      border: `1px solid ${t.border}`,
                      backgroundColor: t.surface,
                    }}
                  >
                    <div className="flex justify-between" style={{ color: t.muted }}>
                      <span>{tr("storefront.cod.subtotal")}</span>
                      <span className="tabular-nums" style={{ color: t.fg }}>
                        {subtotal.toFixed(2)} DA
                      </span>
                    </div>
                    <div className="flex justify-between" style={{ color: t.muted }}>
                      <span>{tr("storefront.cod.shipping")}</span>
                      <span className="tabular-nums" style={{ color: t.fg }}>
                        {shippingLoading
                          ? "…"
                          : shippingPrice !== null
                            ? `${shippingPrice.toFixed(2)} DA`
                            : "—"}
                      </span>
                    </div>
                    <div
                      className="flex justify-between pt-2.5 text-base font-bold"
                      style={{ borderTop: `1px solid ${t.border}`, color: t.fg }}
                    >
                      <span>{tr("storefront.cod.totalLine", { count: quantity })}</span>
                      <span style={{ color: t.primary }}>{total.toFixed(2)} DA</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex items-center gap-3 mt-6">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="inline-flex items-center gap-1.5 px-5 h-12 text-sm font-medium transition-opacity hover:opacity-80"
                    style={{
                      border: `1px solid ${t.border}`,
                      color: t.fg,
                      borderRadius: Math.min(radius, 16),
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {tr("storefront.checkout.back")}
                  </button>
                )}

                <button
                  type="button"
                  onClick={step < STEPS.length - 1 ? nextStep : handleSubmit}
                  disabled={submitting || (step === 1 && shippingLoading)}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-12 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                  style={{
                    backgroundColor: t.primary,
                    color: t.onPrimary,
                    borderRadius: Math.min(radius, 16),
                  }}
                >
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : step < STEPS.length - 1 ? (
                    <>{tr("storefront.checkout.next") || "Continue"}</>
                  ) : (
                    <>
                      <ShoppingBag className="h-5 w-5" />
                      {tr("storefront.cod.orderNow")}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Trigger button — styled to match theme */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full inline-flex items-center justify-center gap-2 px-6 h-11 text-sm font-semibold transition-all hover:opacity-90"
        style={{
          backgroundColor: t.primary,
          color: t.onPrimary,
          borderRadius: Math.min(radius, 16),
        }}
      >
        <ShoppingBag className="h-4 w-4" />
        {tr("storefront.cod.orderNow")}
      </button>
    </>
  );
}

/* ---------- Step Indicator ---------- */
function StepIndicator({
  steps,
  current,
  label,
  tokens: t,
  radius,
}: {
  steps: readonly string[];
  current: number;
  label: (i: number) => string;
  tokens: Tokens;
  radius: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((key, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <div key={key} className="flex items-center gap-2 flex-1">
            <div
              className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
              style={{
                backgroundColor: done || active ? t.primary : t.surface,
                color: done || active ? t.onPrimary : t.muted,
                border: `2px solid ${done || active ? t.primary : t.border}`,
                borderRadius: radius,
              }}
            >
              {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className="text-xs font-medium hidden sm:block"
              style={{ color: active ? t.fg : t.muted }}
            >
              {label(i)}
            </span>
            {i < steps.length - 1 && (
              <div
                className="flex-1 h-0.5 hidden sm:block"
                style={{
                  backgroundColor: done ? t.primary : t.border,
                  borderRadius: 1,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Success Panel ---------- */
function SuccessPanel({
  orderId,
  slug,
  tokens: t,
  radius,
  onClose,
}: {
  orderId: string;
  slug: string;
  tokens: Tokens;
  radius: number;
  onClose: () => void;
}) {
  const { t: tr } = useTranslation();
  return (
    <div className="p-8 text-center">
      <div
        className="mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-5"
        style={{ backgroundColor: t.primary + "22", color: t.primary }}
      >
        <CheckCircle2 className="h-8 w-8" />
      </div>

      <h3 className="text-xl font-bold" style={{ color: t.fg }}>
        {tr("storefront.success.title")}
      </h3>

      <p className="mt-2 text-sm" style={{ color: t.muted }}>
        {tr("storefront.success.subtitle")}
      </p>

      {orderId && (
        <div
          className="inline-block mt-4 px-4 py-2.5 text-sm font-mono"
          style={{
            backgroundColor: t.primary + "12",
            color: t.primary,
            borderRadius: Math.min(radius, 12),
            border: `1px solid ${t.primary}30`,
          }}
        >
          #{orderId.slice(0, 8).toUpperCase()}
        </div>
      )}

      <div className="flex flex-col gap-3 mt-6">
        <Link
          to="/s/$slug/track"
          params={{ slug }}
          search={{ order: orderId }}
          onClick={onClose}
          className="inline-flex h-11 items-center justify-center px-6 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{
            backgroundColor: t.primary,
            color: t.onPrimary,
            borderRadius: Math.min(radius, 16),
          }}
        >
          {tr("storefront.success.track") || "Track Order"}
        </Link>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 items-center justify-center px-6 text-sm font-medium transition-opacity hover:opacity-80"
          style={{
            border: `1px solid ${t.border}`,
            color: t.fg,
            borderRadius: Math.min(radius, 16),
          }}
        >
          {tr("storefront.success.continue") || "Continue Shopping"}
        </button>
      </div>
    </div>
  );
}

/* ---------- Field ---------- */
function Field({
  label,
  error,
  mutedColor,
  children,
  icon,
  fieldId,
}: {
  label: string;
  error?: string;
  mutedColor: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  fieldId?: string;
}) {
  return (
    <div>
      <label
        htmlFor={fieldId}
        className="mb-2 flex items-center gap-2 text-sm font-medium"
        style={{ color: mutedColor }}
      >
        {icon}
        {label}
      </label>
      {children}
      {error && (
        <p id={fieldId ? `${fieldId}-error` : undefined} className="mt-1.5 text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
