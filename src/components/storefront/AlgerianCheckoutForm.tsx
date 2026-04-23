import { useEffect, useMemo, useState } from "react";
import { Loader2, ShoppingBag } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { SearchableSelect } from "@/components/ui/searchable-select";
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
  border: string;
  muted: string;
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

  const cities = useMemo(
    () => (wilaya ? ALGERIA_WILAYAS[wilaya] ?? [] : []),
    [wilaya],
  );

  const subtotal = product.price * quantity;
  const total = subtotal + (shippingPrice ?? 0);

  // Look up delivery price from synced tariffs whenever the selection changes.
  // No external API call — purely from the local database for performance.
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

      // Prefer exact city match, then a wilaya-level row with empty city,
      // then any row for this wilaya as a final fallback.
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

  const inputStyle = {
    backgroundColor: t.bg,
    border: `1px solid ${t.border}`,
    borderRadius: radius / 2,
    color: t.fg,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = makeSchema(tr);
    const parsed = schema.safeParse({ firstName, lastName, phone, wilaya, city, deliveryType });
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
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          store_owner_id: storeOwnerId,
          store_slug: storeSlug,
          customer_name: `${parsed.data.firstName} ${parsed.data.lastName}`,
          customer_email: `${parsed.data.phone}@phone.local`,
          shipping_address: parsed.data.phone,
          shipping_city: parsed.data.city,
          shipping_country: "Algeria",
          shipping_postal_code: parsed.data.wilaya,
          subtotal,
          total,
          status: "pending",
        })
        .select("id")
        .single();
      if (orderErr || !order) throw orderErr ?? new Error("Order failed");

      const { error: itemErr } = await supabase.from("order_items").insert({
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        unit_price: product.price,
        quantity,
        image_url: product.image,
      });
      if (itemErr) throw itemErr;

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
      onSuccess?.(order.id);
    } catch (err) {
      console.error(err);
      toast.error(tr("storefront.cod.errOrder"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-5 sm:p-6 space-y-4"
      style={{
        backgroundColor: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: radius,
      }}
    >
      <div>
        <h2 className="text-lg font-semibold" style={{ color: t.fg }}>
          {tr("storefront.cod.title")}
        </h2>
        <p className="mt-1 text-xs" style={{ color: t.muted }}>
          {tr("storefront.cod.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label={tr("storefront.cod.firstName")} error={errors.firstName} mutedColor={t.muted}>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full h-11 px-3 text-sm outline-none focus:ring-2 focus:ring-offset-1 transition-shadow"
            style={{
              ...inputStyle,
              boxShadow: errors.firstName ? `0 0 0 1px #ef4444` : undefined,
            }}
            placeholder="Ahmed"
          />
        </Field>
        <Field label={tr("storefront.cod.lastName")} error={errors.lastName} mutedColor={t.muted}>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full h-11 px-3 text-sm outline-none"
            style={inputStyle}
            placeholder="Benali"
          />
        </Field>
      </div>

      <Field label={tr("storefront.cod.phone")} error={errors.phone} mutedColor={t.muted}>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full h-11 px-3 text-sm outline-none"
          style={inputStyle}
          placeholder="0555 12 34 56"
          inputMode="tel"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label={tr("storefront.cod.wilaya")} error={errors.wilaya} mutedColor={t.muted}>
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
            triggerStyle={inputStyle}
          />
        </Field>
        <Field label={tr("storefront.cod.city")} error={errors.city} mutedColor={t.muted}>
          <SearchableSelect
            value={city}
            onChange={setCity}
            options={cities}
            placeholder={wilaya ? tr("storefront.cod.selectCity") : tr("storefront.cod.pickWilayaFirst")}
            searchPlaceholder={tr("storefront.cod.searchCity")}
            emptyMessage={tr("storefront.cod.noCity")}
            disabled={!wilaya}
            triggerStyle={inputStyle}
          />
        </Field>
      </div>

      <Field label={tr("storefront.cod.deliveryType") || "Delivery type"} mutedColor={t.muted}>
        <div className="grid grid-cols-2 gap-2">
          {(["domicile", "stopdesk"] as const).map((opt) => {
            const active = deliveryType === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setDeliveryType(opt)}
                className="h-11 px-3 text-sm font-medium transition-all"
                style={{
                  backgroundColor: active ? t.primary : t.bg,
                  color: active ? t.onPrimary : t.fg,
                  border: `1px solid ${active ? t.primary : t.border}`,
                  borderRadius: radius / 2,
                }}
              >
                {opt === "domicile"
                  ? tr("storefront.cod.deliveryHome") || "Home delivery"
                  : tr("storefront.cod.deliveryStopdesk") || "Stopdesk"}
              </button>
            );
          })}
        </div>
      </Field>

      <div
        className="space-y-1.5 pt-3 mt-2"
        style={{ borderTop: `1px solid ${t.border}` }}
      >
        <div className="flex items-center justify-between text-sm" style={{ color: t.muted }}>
          <span>{tr("storefront.cod.subtotal") || "Subtotal"}</span>
          <span style={{ color: t.fg }}>{subtotal.toFixed(2)} DA</span>
        </div>
        <div className="flex items-center justify-between text-sm" style={{ color: t.muted }}>
          <span>{tr("storefront.cod.shipping") || "Shipping"}</span>
          <span style={{ color: t.fg }}>
            {!wilaya
              ? "—"
              : shippingLoading
                ? "…"
                : shippingPrice === null
                  ? tr("storefront.cod.shippingUnavailable") || "Not available"
                  : `${shippingPrice.toFixed(2)} DA`}
          </span>
        </div>
        <div className="flex items-center justify-between pt-2 mt-1" style={{ borderTop: `1px dashed ${t.border}` }}>
          <div className="text-sm" style={{ color: t.muted }}>
            {tr("storefront.cod.totalLine", { count: quantity })}
          </div>
          <div className="text-xl font-bold" style={{ color: t.fg }}>
            {total.toFixed(2)} DA
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 h-12 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50 shadow-lg"
        style={{
          backgroundColor: t.primary,
          color: t.onPrimary,
          borderRadius: radius / 2,
          boxShadow: `0 8px 24px -8px ${t.primary}66`,
        }}
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShoppingBag className="h-4 w-4" />
        )}
        {submitting ? tr("storefront.cod.placing") : tr("storefront.cod.orderNow")}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  mutedColor,
  children,
}: {
  label: string;
  error?: string;
  mutedColor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="block text-xs font-medium mb-1.5"
        style={{ color: mutedColor }}
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
