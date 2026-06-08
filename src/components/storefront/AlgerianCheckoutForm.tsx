import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  ShoppingBag,
  Home,
  Building2,
  User,
  Phone,
  MapPin,
} from "lucide-react";
import { motion } from "framer-motion";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { createOrder } from "@/lib/orders/create-order.functions";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ALGERIA_WILAYAS,
  WILAYA_LIST,
  isValidAlgerianPhone,
} from "@/lib/algeriaWilayas";

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

  const cities = useMemo(
    () => (wilaya ? ALGERIA_WILAYAS[wilaya] ?? [] : []),
    [wilaya],
  );

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
        ? data.find(
            (r) => (r.city ?? "").trim().toLowerCase() === cityNorm.toLowerCase(),
          )
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

      setFirstName("");
      setLastName("");
      setPhone("");
      setWilaya("");
      setCity("");
      setDeliveryType("domicile");
      setShippingPrice(null);
      setSuccessOrderId(result.orderId);

      onSuccess?.(result.orderId);
    } catch (err) {
      console.error(err);
      toast.error(tr("storefront.cod.errOrder"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={!!successOrderId} onOpenChange={(open) => !open && setSuccessOrderId(null)}>
        <DialogContent>
          <DialogTitle>
            {tr("storefront.success.title") || "Thank you for your order!"}
          </DialogTitle>

          <DialogDescription>
            {tr("storefront.success.subtitle") || "Your order has been received."}
          </DialogDescription>

          {successOrderId && (
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm font-mono">
              #{successOrderId.slice(0, 8).toUpperCase()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-3xl border p-6 sm:p-7 space-y-5 shadow-2xl backdrop-blur-xl"
        style={{
          background: t.isDark
            ? `linear-gradient(135deg, ${t.surfaceStrong}, ${t.surface})`
            : `linear-gradient(135deg, ${t.surface}, ${t.bg})`,
          border: `1px solid ${t.border}`,
          borderRadius: radius,
        }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-orange-400/10 blur-2xl" />
        </div>

        <div className="relative z-10">
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.fg }}>
            {tr("storefront.cod.title")}
          </h2>

          <p className="mt-2 text-sm" style={{ color: t.muted }}>
            {tr("storefront.cod.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
          <Field
            icon={<User className="h-4 w-4 text-orange-400" />}
            label={tr("storefront.cod.firstName")}
            error={errors.firstName}
            mutedColor={t.muted}
          >
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ahmed"
              className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition"
              style={{
                borderColor: t.border,
                backgroundColor: t.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                color: t.fg,
              }}
            />
          </Field>

          <Field
            icon={<User className="h-4 w-4 text-orange-400" />}
            label={tr("storefront.cod.lastName")}
            error={errors.lastName}
            mutedColor={t.muted}
          >
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Benali"
              className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition"
              style={{
                borderColor: t.border,
                backgroundColor: t.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                color: t.fg,
              }}
            />
          </Field>
        </div>

        <div className="relative z-10">
          <Field
            icon={<Phone className="h-4 w-4 text-orange-400" />}
            label={tr("storefront.cod.phone")}
            error={errors.phone}
            mutedColor={t.muted}
          >
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0555 12 34 56"
              inputMode="tel"
              className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition"
              style={{
                borderColor: t.border,
                backgroundColor: t.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                color: t.fg,
              }}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
          <Field
            icon={<MapPin className="h-4 w-4 text-orange-400" />}
            label={tr("storefront.cod.wilaya")}
            error={errors.wilaya}
            mutedColor={t.muted}
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
                borderRadius: 16,
                color: t.fg,
              }}
            />
          </Field>

          <Field
            icon={<MapPin className="h-4 w-4 text-orange-400" />}
            label={tr("storefront.cod.city")}
            error={errors.city}
            mutedColor={t.muted}
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
                borderRadius: 16,
                color: t.fg,
              }}
            />
          </Field>
        </div>

        <div className="relative z-10">
          <Field
            label={tr("storefront.cod.deliveryType")}
            mutedColor={t.muted}
          >
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryType("domicile")}
                className={`rounded-2xl border p-4 transition-all duration-300 ${
                  deliveryType === "domicile"
                    ? "text-white shadow-lg"
                    : "hover:border-orange-400"
                }`}
                style={{
                  borderColor: deliveryType === "domicile" ? t.primary : t.border,
                  backgroundColor: deliveryType === "domicile" ? t.primary : t.surface,
                  color: deliveryType === "domicile" ? t.onPrimary : t.muted,
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <Home className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {tr("storefront.cod.deliveryHome")}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryType("stopdesk")}
                className={`rounded-2xl border p-4 transition-all duration-300 ${
                  deliveryType === "stopdesk"
                    ? "text-white shadow-lg"
                    : "hover:border-orange-400"
                }`}
                style={{
                  borderColor: deliveryType === "stopdesk" ? t.primary : t.border,
                  backgroundColor: deliveryType === "stopdesk" ? t.primary : t.surface,
                  color: deliveryType === "stopdesk" ? t.onPrimary : t.muted,
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {tr("storefront.cod.deliveryStopdesk")}
                  </span>
                </div>
              </button>
            </div>
          </Field>
        </div>

        <div className="relative z-10 rounded-2xl border p-5 backdrop-blur-sm" style={{ borderColor: t.border, backgroundColor: t.surface }}>
          <div className="flex items-center justify-between text-sm" style={{ color: t.muted }}>
            <span>{tr("storefront.cod.subtotal")}</span>
            <span style={{ color: t.fg }}>{subtotal.toFixed(2)} DA</span>
          </div>

          <div className="mt-3 flex items-center justify-between text-sm" style={{ color: t.muted }}>
            <span>{tr("storefront.cod.shipping")}</span>

            <span style={{ color: t.fg }}>
              {!wilaya
                ? "—"
                : shippingLoading
                ? "…"
                : shippingPrice === null
                ? tr("storefront.cod.shippingUnavailable")
                : `${shippingPrice.toFixed(2)} DA`}
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between border-t pt-4" style={{ borderColor: t.border }}>
            <div className="text-sm" style={{ color: t.muted }}>
              {tr("storefront.cod.totalLine", { count: quantity })}
            </div>

            <div className="text-2xl font-bold" style={{ color: t.fg }}>
              {total.toFixed(2)} DA
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="relative z-10 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition-all duration-300 hover:scale-[1.01] hover:shadow-orange-500/50 disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ShoppingBag className="h-5 w-5" />
          )}

          {submitting
            ? tr("storefront.cod.placing")
            : tr("storefront.cod.orderNow")}
        </button>
      </motion.form>
    </>
  );
}

function Field({
  label,
  error,
  mutedColor,
  children,
  icon,
}: {
  label: string;
  error?: string;
  mutedColor: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="mb-2 flex items-center gap-2 text-sm font-medium"
        style={{ color: mutedColor }}
      >
        {icon}
        {label}
      </label>

      {children}

      {error && (
        <p className="mt-2 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
