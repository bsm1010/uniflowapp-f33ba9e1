import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  StorefrontShell,
  getStoreTokens,
} from "@/components/storefront/StorefrontShell";
import { useCart } from "@/hooks/use-cart";
import { ALGERIA_GEO, getCitiesForWilaya } from "@/lib/algeriaWilayas";

type DeliveryType = "domicile" | "stopdesk";
const tariffKey = (
  companyId: string,
  wilaya: string,
  city: string,
  type: DeliveryType,
) => `${companyId}:${wilaya}:${city}:${type}`;

type StoreSettings = Tables<"store_settings">;
type Company = { id: string; name: string };

export const Route = createFileRoute("/s/$slug/checkout")({
  component: CheckoutPage,
  head: () => ({ meta: [{ title: "Checkout — Storely" }] }),
});

const dzdFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const formatDZD = (n: number) => `${dzdFormatter.format(n)} DZD`;

/** Smoothly animates a number from its previous value to the target. */
function useAnimatedNumber(value: number, duration = 400) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (to - from) * eased;
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = display;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return display;
}

function CheckoutPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { t: tr } = useTranslation();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState<string>("");
  // Tariffs keyed by `${companyId}:${wilaya}:${city}:${type}` -> price
  const [tariffs, setTariffs] = useState<Record<string, number>>({});
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const cart = useCart(slug);

  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    wilaya: "",
    deliveryType: "domicile" as DeliveryType,
    notes: "",
  });

  // Load store + enabled companies + all tariffs
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("store_settings")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (!active) return;
      setSettings(data);
      if (data?.user_id) {
        const [{ data: storeComps }, { data: rows }] = await Promise.all([
          supabase
            .from("store_delivery_companies")
            .select("company_id, is_default, enabled, delivery_companies(id, name)")
            .eq("store_id", data.user_id)
            .eq("enabled", true),
          supabase
            .from("delivery_tariffs")
            .select("wilaya, city, delivery_type, price, company_id")
            .eq("store_id", data.user_id),
        ]);
        if (!active) return;

        const list: Company[] = (storeComps ?? [])
          .map((s) => {
            const c = s.delivery_companies as unknown as Company | null;
            return c ? { id: c.id, name: c.name } : null;
          })
          .filter((c): c is Company => !!c);
        setCompanies(list);
        const def =
          (storeComps ?? []).find((s) => s.is_default)?.company_id ||
          list[0]?.id ||
          "";
        setCompanyId(def);

        const map: Record<string, number> = {};
        for (const r of rows ?? []) {
          const type = (r.delivery_type === "stopdesk" ? "stopdesk" : "domicile") as DeliveryType;
          map[tariffKey(r.company_id ?? "", r.wilaya, r.city ?? "", type)] = Number(r.price);
        }
        setTariffs(map);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Refresh the specific tariff for selected wilaya + city + type + company
  const refreshTariff = async (
    wilaya: string,
    city: string,
    type: DeliveryType,
    compId: string,
  ) => {
    if (!wilaya || !city || !settings?.user_id || !compId) return;
    setFetchingPrice(true);
    try {
      const { data } = await supabase
        .from("delivery_tariffs")
        .select("price")
        .eq("store_id", settings.user_id)
        .eq("company_id", compId)
        .eq("wilaya", wilaya)
        .eq("city", city)
        .eq("delivery_type", type)
        .maybeSingle();
      const key = tariffKey(compId, wilaya, city, type);
      setTariffs((prev) => {
        const next = { ...prev };
        if (data) next[key] = Number(data.price);
        else delete next[key];
        return next;
      });
    } finally {
      setFetchingPrice(false);
    }
  };

  const onWilayaChange = (wilaya: string) => {
    setForm((f) => ({ ...f, wilaya, city: "" }));
  };

  const onCityChange = (city: string) => {
    update("city", city);
    if (form.wilaya && companyId) {
      void refreshTariff(form.wilaya, city, form.deliveryType, companyId);
    }
  };

  const onDeliveryTypeChange = (type: DeliveryType) => {
    update("deliveryType", type);
    if (form.wilaya && form.city && companyId) {
      void refreshTariff(form.wilaya, form.city, type, companyId);
    }
  };

  const onCompanyChange = (id: string) => {
    setCompanyId(id);
    if (form.wilaya && form.city) {
      void refreshTariff(form.wilaya, form.city, form.deliveryType, id);
    }
  };

  const tariffEntryKey = useMemo(
    () => tariffKey(companyId, form.wilaya, form.city, form.deliveryType),
    [companyId, form.wilaya, form.city, form.deliveryType],
  );
  const tariffAvailable = tariffs[tariffEntryKey] != null;
  const deliveryPrice = tariffAvailable ? tariffs[tariffEntryKey] : 0;

  const total = cart.subtotal + deliveryPrice;
  const animatedTotal = useAnimatedNumber(total);
  const animatedDelivery = useAnimatedNumber(deliveryPrice);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    if (cart.items.length === 0) {
      toast.error(tr("storefront.checkout.errEmpty"));
      return;
    }
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.address.trim() ||
      !form.city.trim() ||
      !form.wilaya.trim()
    ) {
      toast.error(tr("storefront.checkout.errFields"));
      return;
    }
    if (form.wilaya && form.city && !tariffAvailable) {
      toast.error("Delivery not available for this selection");
      return;
    }

    setSubmitting(true);
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        store_owner_id: settings.user_id,
        store_slug: settings.slug,
        customer_name: form.name.trim(),
        customer_email: form.email.trim(),
        shipping_address: form.address.trim(),
        shipping_city: form.city.trim(),
        shipping_postal_code: form.wilaya.trim(),
        shipping_country: "Algeria",
        notes: form.notes.trim() || null,
        subtotal: cart.subtotal,
        total,
      })
      .select("id")
      .single();

    if (error || !order) {
      setSubmitting(false);
      toast.error(error?.message ?? tr("storefront.checkout.errOrder"));
      return;
    }

    const itemsPayload = cart.items.map((i) => ({
      order_id: order.id,
      product_id: i.productId,
      product_name: i.name,
      unit_price: i.price,
      quantity: i.quantity,
      image_url: i.image,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsPayload);

    if (itemsError) {
      setSubmitting(false);
      toast.error(itemsError.message);
      return;
    }

    // Create shipment record (best-effort, don't block order on failure)
    if (companyId) {
      await supabase.from("shipments").insert({
        store_id: settings.user_id,
        order_id: order.id,
        company_id: companyId,
        status: "pending",
      });
    }

    cart.clear();
    navigate({
      to: "/s/$slug/checkout/success",
      params: { slug },
      search: { order: order.id },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>{tr("storefront.notFound")}</p>
      </div>
    );
  }

  const t = getStoreTokens(settings);
  const radius =
    settings.theme === "minimal" ? 0 : settings.theme === "grid" ? 8 : 16;

  const inputStyle: React.CSSProperties = {
    backgroundColor: t.bg,
    color: t.fg,
    border: `1px solid ${t.border}`,
    borderRadius: radius / 2,
  };

  const selectedCompanyName = companies.find((c) => c.id === companyId)?.name;

  return (
    <StorefrontShell settings={settings}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Link
          to="/s/$slug/cart"
          params={{ slug }}
          className="inline-flex items-center gap-1.5 text-sm hover:opacity-70"
          style={{ color: t.muted }}
        >
          <ArrowLeft className="h-4 w-4" /> {tr("storefront.checkout.back")}
        </Link>

        <h1 className="mt-6 text-3xl md:text-4xl font-bold tracking-tight">
          {tr("storefront.checkout.title")}
        </h1>

        {cart.items.length === 0 ? (
          <div
            className="mt-8 p-12 text-center"
            style={{
              borderRadius: radius,
              border: `1px solid ${t.border}`,
              backgroundColor: t.surface,
            }}
          >
            <p>{tr("storefront.checkout.empty")}</p>
            <Link
              to="/s/$slug"
              params={{ slug }}
              className="inline-flex items-center justify-center mt-4 px-5 py-2 text-sm font-medium transition-opacity hover:opacity-90"
              style={{
                backgroundColor: t.primary,
                color: t.onPrimary,
                borderRadius: radius / 2,
              }}
            >
              {tr("storefront.checkout.browse")}
            </Link>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]"
          >
            <div
              className="p-6"
              style={{
                border: `1px solid ${t.border}`,
                backgroundColor: t.surface,
                borderRadius: radius,
              }}
            >
              <h2 className="font-semibold">{tr("storefront.checkout.section")}</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label={tr("storefront.checkout.fullName")} full>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm outline-none focus:ring-2"
                    style={{ ...inputStyle, ['--tw-ring-color' as string]: t.primary }}
                  />
                </Field>
                <Field label={tr("storefront.checkout.email")} full>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm outline-none focus:ring-2"
                    style={inputStyle}
                  />
                </Field>
                <Field label={tr("storefront.checkout.address")} full>
                  <input
                    required
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm outline-none focus:ring-2"
                    style={inputStyle}
                    placeholder={tr("storefront.checkout.addressPh")}
                  />
                </Field>
                <Field label="Wilaya">
                  <select
                    required
                    value={form.wilaya}
                    onChange={(e) => onWilayaChange(e.target.value)}
                    className="w-full px-3 py-2.5 pr-9 text-sm outline-none focus:ring-2 appearance-none transition-colors"
                    style={inputStyle}
                  >
                    <option value="">— Select wilaya —</option>
                    {ALGERIA_GEO.map(({ wilaya, code }) => (
                      <option key={wilaya} value={wilaya}>
                        {String(code).padStart(2, "0")} — {wilaya}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="City / Commune">
                  <select
                    required
                    value={form.city}
                    onChange={(e) => onCityChange(e.target.value)}
                    disabled={!form.wilaya}
                    className="w-full px-3 py-2.5 pr-9 text-sm outline-none focus:ring-2 appearance-none transition-colors disabled:opacity-50"
                    style={inputStyle}
                  >
                    <option value="">
                      {form.wilaya ? "— Select city —" : "Select wilaya first"}
                    </option>
                    {getCitiesForWilaya(form.wilaya).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Delivery type" full>
                  <div className="grid grid-cols-2 gap-2">
                    {(["domicile", "stopdesk"] as const).map((type) => {
                      const active = form.deliveryType === type;
                      return (
                        <button
                          type="button"
                          key={type}
                          onClick={() => onDeliveryTypeChange(type)}
                          className="px-3 py-2.5 text-sm font-medium transition-all"
                          style={{
                            border: `1px solid ${active ? t.primary : t.border}`,
                            backgroundColor: active ? t.primary : t.bg,
                            color: active ? t.onPrimary : t.fg,
                            borderRadius: radius / 2,
                          }}
                        >
                          {type === "domicile" ? "Home delivery" : "Stop desk"}
                        </button>
                      );
                    })}
                  </div>
                </Field>
                {companies.length > 0 && (
                  <Field label="Delivery company" full>
                    <select
                      value={companyId}
                      onChange={(e) => onCompanyChange(e.target.value)}
                      className="w-full px-3 py-2.5 pr-9 text-sm outline-none focus:ring-2 appearance-none transition-colors"
                      style={inputStyle}
                    >
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                <Field label={tr("storefront.checkout.notes")} full muted={t.muted}>
                  <textarea
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm outline-none focus:ring-2 resize-none"
                    style={inputStyle}
                    placeholder={tr("storefront.checkout.notesPh")}
                  />
                </Field>
              </div>
            </div>

            <div
              className="p-6 h-fit lg:sticky lg:top-24"
              style={{
                border: `1px solid ${t.border}`,
                backgroundColor: t.surface,
                borderRadius: radius,
              }}
            >
              <h2 className="font-semibold">{tr("storefront.checkout.summary")}</h2>
              <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
                {cart.items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 text-sm"
                  >
                    <div
                      className="h-12 w-12 shrink-0 overflow-hidden"
                      style={{
                        borderRadius: radius / 3,
                        backgroundColor: t.bg,
                      }}
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.name}</div>
                      <div className="text-xs" style={{ color: t.muted }}>
                        {tr("storefront.checkout.qty", { n: item.quantity })}
                      </div>
                    </div>
                    <div className="font-medium">
                      {formatDZD(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
              <div
                className="mt-4 pt-4 space-y-2 text-sm"
                style={{ borderTop: `1px solid ${t.border}` }}
              >
                <div className="flex justify-between">
                  <span style={{ color: t.muted }}>{tr("storefront.checkout.subtotal")}</span>
                  <span className="tabular-nums">{formatDZD(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: t.muted }}>
                    {tr("storefront.checkout.shipping")}
                    {form.wilaya ? ` · ${form.wilaya}` : ""}
                    {form.city ? ` · ${form.city}` : ""}
                    {form.deliveryType === "stopdesk" ? " · Stop desk" : " · Domicile"}
                    {selectedCompanyName ? ` · ${selectedCompanyName}` : ""}
                  </span>
                  <span className="tabular-nums inline-flex items-center gap-1.5 transition-opacity" style={{ opacity: fetchingPrice ? 0.55 : 1 }}>
                    {fetchingPrice && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {!form.wilaya || !form.city
                      ? "— Select location"
                      : tariffAvailable
                        ? formatDZD(animatedDelivery)
                        : "Not available"}
                  </span>
                </div>
                {form.wilaya && form.city && !tariffAvailable && !fetchingPrice && (
                  <p className="text-xs" style={{ color: "#dc2626" }}>
                    Delivery not available for this city / type. Try another option.
                  </p>
                )}
                <div
                  className="flex justify-between text-base font-semibold pt-2"
                  style={{ borderTop: `1px solid ${t.border}` }}
                >
                  <span>{tr("storefront.checkout.total")}</span>
                  <span key={total} className="tabular-nums animate-[scale-in_0.2s_ease-out]">
                    {formatDZD(animatedTotal)}
                  </span>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="mt-6 inline-flex items-center justify-center w-full px-6 h-12 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: t.primary,
                  color: t.onPrimary,
                  borderRadius: radius / 2,
                }}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  tr("storefront.checkout.place", { amount: formatDZD(animatedTotal) })
                )}
              </button>
              <p className="mt-3 text-xs text-center" style={{ color: t.muted }}>
                {tr("storefront.checkout.demo")}
              </p>
            </div>
          </form>
        )}
      </div>
    </StorefrontShell>
  );
}

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  muted?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="block text-xs font-medium mb-1.5">{label}</span>
      {children}
    </label>
  );
}
