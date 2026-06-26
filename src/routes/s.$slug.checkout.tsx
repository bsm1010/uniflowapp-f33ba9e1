import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, CreditCard, Home, Loader2, MapPin, Package, Truck } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { createOrder } from "@/lib/orders/create-order.functions";
import type { Tables } from "@/integrations/supabase/types";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { StorefrontShell, getStoreTokens } from "@/components/storefront/StorefrontShell";
import { useCart } from "@/hooks/use-cart";
import { ALGERIA_GEO, getCitiesForWilaya } from "@/lib/algeriaWilayas";

type DeliveryType = "domicile" | "stopdesk";
const tariffKey = (companyId: string, wilaya: string, city: string, type: DeliveryType) =>
  `${companyId}:${wilaya}:${city}:${type}`;

type StoreSettings = Tables<"store_settings">;
type Company = { id: string; name: string };

export const Route = createFileRoute("/s/$slug/checkout")({
  component: CheckoutPage,
  head: ({ params }) => ({ meta: [{ title: `Checkout — ${params.slug}` }] }),
});

const dzdFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const formatDZD = (n: number) => `${dzdFormatter.format(n)} DZD`;

function useAnimatedNumber(value: number, duration = 400) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);
  const displayRef = useRef(display);
  displayRef.current = display;

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
      fromRef.current = displayRef.current;
    };
  }, [value, duration]);

  return display;
}

function CheckoutPage() {
  const { slug } = Route.useParams();
  const { t: tr } = useTranslation();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState<string>("");
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
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "chargily">("cod");

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
        const def = (storeComps ?? []).find((s) => s.is_default)?.company_id || list[0]?.id || "";
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

  const refreshBothTariffs = (wilaya: string, city: string, compId: string) => {
    if (!wilaya || !city || !compId) return;
    void refreshTariff(wilaya, city, "domicile", compId);
    void refreshTariff(wilaya, city, "stopdesk", compId);
  };

  const onWilayaChange = (wilaya: string) => {
    const cities = getCitiesForWilaya(wilaya);
    const city = cities[0] ?? "";
    setForm((f) => ({ ...f, wilaya, city }));
    if (city && companyId) refreshBothTariffs(wilaya, city, companyId);
  };

  const onCityChange = (city: string) => {
    update("city", city);
    if (form.wilaya && companyId) refreshBothTariffs(form.wilaya, city, companyId);
  };

  const onDeliveryTypeChange = (type: DeliveryType) => {
    update("deliveryType", type);
    if (form.wilaya && form.city && companyId) {
      void refreshTariff(form.wilaya, form.city, type, companyId);
    }
  };

  const onCompanyChange = (id: string) => {
    setCompanyId(id);
    if (form.wilaya && form.city) refreshBothTariffs(form.wilaya, form.city, id);
  };

  const tariffEntryKey = useMemo(
    () => tariffKey(companyId, form.wilaya, form.city, form.deliveryType),
    [companyId, form.wilaya, form.city, form.deliveryType],
  );
  const tariffAvailable = tariffs[tariffEntryKey] != null;
  const deliveryPrice = tariffAvailable ? tariffs[tariffEntryKey] : 0;

  const domicilePrice =
    form.wilaya && form.city
      ? tariffs[tariffKey(companyId, form.wilaya, form.city, "domicile")]
      : undefined;
  const stopdeskPrice =
    form.wilaya && form.city
      ? tariffs[tariffKey(companyId, form.wilaya, form.city, "stopdesk")]
      : undefined;
  const stopdeskCheaper =
    form.deliveryType === "domicile" &&
    typeof domicilePrice === "number" &&
    typeof stopdeskPrice === "number" &&
    stopdeskPrice < domicilePrice;
  const stopdeskSavings = stopdeskCheaper
    ? (domicilePrice as number) - (stopdeskPrice as number)
    : 0;

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
      toast.error(tr("storefront.cod.errCity"));
      return;
    }
    setSubmitting(true);
    try {
      const result = await createOrder({
        data: {
          storeSlug: slug,
          customerName: form.name.trim(),
          customerEmail: form.email.trim(),
          shippingAddress: form.address.trim(),
          shippingCity: form.city.trim(),
          shippingWilaya: form.wilaya.trim(),
          shippingCountry: "Algeria",
          deliveryType: form.deliveryType,
          companyId: companyId || undefined,
          notes: form.notes.trim() || null,
          items: cart.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            name: i.name,
            image: i.image,
          })),
          paymentMethod,
        },
      });

      if (paymentMethod === "chargily") {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.access_token) {
          toast.error("Please log in to pay online");
          setSubmitting(false);
          return;
        }
        const { data: checkoutData, error: checkoutErr } = await supabase.functions.invoke(
          "create-chargily-checkout",
          {
            body: {
              amount: result.total,
              orderId: result.orderId,
              customerName: form.name.trim(),
              customerEmail: form.email.trim() || undefined,
              successUrl: `${window.location.origin}/payment/success?order_id=${result.orderId}`,
              failureUrl: `${window.location.origin}/payment/failed?order_id=${result.orderId}`,
            },
          },
        );
        if (checkoutErr || !checkoutData?.checkout_url) {
          toast.error("Failed to create payment link. Please try again.");
          setSubmitting(false);
          return;
        }
        cart.clear();
        window.location.href = checkoutData.checkout_url;
        return;
      }

      cart.clear();
      setSuccessOrderId(result.orderId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : tr("storefront.checkout.errOrder");
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{tr("storefront.notFound")}</p>
      </div>
    );
  }

  const t = getStoreTokens(settings);
  const r = t.buttonRadius;

  const inputStyle: React.CSSProperties = {
    backgroundColor: t.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
    color: t.fg,
    border: `1.5px solid ${t.border}`,
    borderRadius: r,
    fontFamily: t.fontFamily,
    transition: "border-color 0.2s",
    width: "100%",
    padding: "10px 14px",
    fontSize: 14,
    outline: "none",
  };

  const selectedCompanyName = companies.find((c) => c.id === companyId)?.name;

  return (
    <StorefrontShell settings={settings}>
      {/* Success dialog */}
      <Dialog open={!!successOrderId} onOpenChange={(open) => !open && setSuccessOrderId(null)}>
        <DialogContent>
          <div className="flex items-start gap-4">
            <div
              className="mt-0.5 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: t.primary + "22", color: t.primary }}
            >
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-lg">{tr("storefront.success.title")}</DialogTitle>
              <DialogDescription>{tr("storefront.success.subtitle")}</DialogDescription>
              {successOrderId && (
                <div
                  className="inline-block px-3 py-2 text-xs font-mono mt-1"
                  style={{
                    backgroundColor: t.primary + "12",
                    color: t.primary,
                    borderRadius: r,
                    border: `1px solid ${t.primary}30`,
                  }}
                >
                  {tr("storefront.success.orderNo", {
                    id: successOrderId.slice(0, 8).toUpperCase(),
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end mt-2">
            <Link
              to="/s/$slug"
              params={{ slug }}
              className="inline-flex h-10 items-center justify-center px-5 text-sm font-medium transition-opacity hover:opacity-80"
              style={{
                backgroundColor: t.surface,
                color: t.fg,
                border: `1px solid ${t.border}`,
                borderRadius: r,
              }}
            >
              {tr("storefront.success.continue")}
            </Link>
            {successOrderId && (
              <Link
                to="/s/$slug/track"
                params={{ slug }}
                search={{ order: successOrderId }}
                className="inline-flex h-10 items-center justify-center px-5 text-sm font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: t.primary, color: t.onPrimary, borderRadius: r }}
              >
                {tr("storefront.success.track")}
              </Link>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen" style={{ backgroundColor: t.bg, fontFamily: t.fontFamily }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          {/* Back link */}
          <Link
            to="/s/$slug/cart"
            params={{ slug }}
            className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-70 transition-opacity mb-8"
            style={{ color: t.muted }}
          >
            <ArrowLeft className="h-4 w-4" />
            {tr("storefront.checkout.back")}
          </Link>

          {/* Page title */}
          <div className="mb-8">
            <h1
              className="text-3xl md:text-4xl font-bold tracking-tight"
              style={{ color: t.fg, fontFamily: t.fontHeading }}
            >
              {tr("storefront.checkout.title")}
            </h1>
            <p className="mt-1 text-sm" style={{ color: t.muted }}>
              {tr("storefront.cod.subtitle")}
            </p>
          </div>

          {cart.items.length === 0 ? (
            <div
              className="p-16 text-center"
              style={{
                borderRadius: r * 2,
                border: `1px solid ${t.border}`,
                backgroundColor: t.surface,
              }}
            >
              <Package className="h-12 w-12 mx-auto mb-4" style={{ color: t.muted }} />
              <p className="font-medium mb-4" style={{ color: t.fg }}>
                {tr("storefront.checkout.empty")}
              </p>
              <Link
                to="/s/$slug"
                params={{ slug }}
                className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: t.primary, color: t.onPrimary, borderRadius: r }}
              >
                {tr("storefront.checkout.browse")}
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
              {/* LEFT: Form */}
              <div
                className="p-6 md:p-8"
                style={{
                  border: `1px solid ${t.border}`,
                  backgroundColor: t.surface,
                  borderRadius: r * 2,
                }}
              >
                {/* Section header */}
                <div className="flex items-center gap-2 mb-6">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: t.primary, color: t.onPrimary }}
                  >
                    1
                  </div>
                  <h2 className="font-semibold text-base" style={{ color: t.fg }}>
                    {tr("storefront.checkout.section")}
                  </h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Full name */}
                  <Field label={tr("storefront.checkout.fullName")} full>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      style={inputStyle}
                      placeholder="Ahmed Benali"
                    />
                  </Field>

                  {/* Email */}
                  <Field label={tr("storefront.checkout.email")} full>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      style={inputStyle}
                      placeholder="ahmed@example.com"
                    />
                  </Field>

                  {/* Address */}
                  <Field label={tr("storefront.checkout.address")} full>
                    <input
                      required
                      value={form.address}
                      onChange={(e) => update("address", e.target.value)}
                      style={inputStyle}
                      placeholder={tr("storefront.checkout.addressPh")}
                    />
                  </Field>

                  {/* Wilaya */}
                  <Field label={tr("storefront.cod.wilaya")}>
                    <div className="relative">
                      <select
                        required
                        value={form.wilaya}
                        onChange={(e) => onWilayaChange(e.target.value)}
                        style={{ ...inputStyle, paddingRight: 36, appearance: "none" }}
                      >
                        <option value="">{tr("storefront.cod.selectWilaya")}</option>
                        {ALGERIA_GEO.map(({ wilaya, code }) => (
                          <option key={wilaya} value={wilaya}>
                            {String(code).padStart(2, "0")} — {wilaya}
                          </option>
                        ))}
                      </select>
                      <MapPin
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                        style={{ color: t.muted }}
                      />
                    </div>
                  </Field>

                  {/* City */}
                  <Field label={tr("storefront.cod.city")}>
                    <div className="relative">
                      <select
                        required
                        value={form.city}
                        onChange={(e) => onCityChange(e.target.value)}
                        disabled={!form.wilaya}
                        style={{
                          ...inputStyle,
                          paddingRight: 36,
                          appearance: "none",
                          opacity: form.wilaya ? 1 : 0.5,
                        }}
                      >
                        <option value="">
                          {form.wilaya
                            ? tr("storefront.cod.selectCity")
                            : tr("storefront.cod.pickWilayaFirst")}
                        </option>
                        {getCitiesForWilaya(form.wilaya).map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <MapPin
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                        style={{ color: t.muted }}
                      />
                    </div>
                  </Field>

                  {/* Delivery type */}
                  <Field label={tr("storefront.checkout.deliveryType") ?? "Type de livraison"} full>
                    <div className="grid grid-cols-2 gap-3">
                      {(["domicile", "stopdesk"] as const).map((type) => {
                        const active = form.deliveryType === type;
                        const price = type === "domicile" ? domicilePrice : stopdeskPrice;
                        const Icon = type === "domicile" ? Home : Truck;
                        return (
                          <button
                            type="button"
                            key={type}
                            onClick={() => onDeliveryTypeChange(type)}
                            className="flex flex-col items-center gap-1.5 py-3 px-4 text-sm font-medium transition-all"
                            style={{
                              border: `2px solid ${active ? t.primary : t.border}`,
                              backgroundColor: active
                                ? t.primary + "15"
                                : t.isDark
                                  ? "rgba(255,255,255,0.04)"
                                  : "rgba(0,0,0,0.02)",
                              color: active ? t.primary : t.fg,
                              borderRadius: r,
                            }}
                          >
                            <Icon className="h-5 w-5" />
                            <span>
                              {type === "domicile"
                                ? (tr("storefront.checkout.deliveryHome") ?? "Domicile")
                                : (tr("storefront.checkout.deliveryStopdesk") ?? "Stop desk")}
                            </span>
                            {typeof price === "number" && (
                              <span className="text-[11px] font-normal opacity-70 tabular-nums">
                                {formatDZD(price)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {stopdeskCheaper && (
                      <button
                        type="button"
                        onClick={() => onDeliveryTypeChange("stopdesk")}
                        className="mt-3 w-full text-left text-xs px-4 py-2.5 font-medium transition-opacity hover:opacity-80"
                        style={{
                          backgroundColor: `${t.primary}12`,
                          color: t.primary,
                          border: `1px dashed ${t.primary}60`,
                          borderRadius: r,
                        }}
                      >
                        💡 {tr("storefront.checkout.deliveryStopdesk") ?? "Stop desk"} —{" "}
                        {tr("storefront.checkout.save", { defaultValue: "save" })}{" "}
                        {formatDZD(stopdeskSavings)}
                      </button>
                    )}
                  </Field>

                  {/* Delivery company */}
                  {companies.length > 0 && (
                    <Field label={tr("storefront.checkout.deliveryCompany") ?? "Transporteur"} full>
                      <select
                        value={companyId}
                        onChange={(e) => onCompanyChange(e.target.value)}
                        style={{ ...inputStyle, paddingRight: 36, appearance: "none" }}
                      >
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}

                  {/* Notes */}
                  <Field label={tr("storefront.checkout.notes")} full>
                    <textarea
                      value={form.notes}
                      onChange={(e) => update("notes", e.target.value)}
                      rows={3}
                      style={{ ...inputStyle, resize: "none" }}
                      placeholder={tr("storefront.checkout.notesPh")}
                    />
                  </Field>
                </div>
              </div>

              {/* RIGHT: Order summary */}
              <div className="lg:sticky lg:top-24 h-fit space-y-4">
                <div
                  className="p-6"
                  style={{
                    border: `1px solid ${t.border}`,
                    backgroundColor: t.surface,
                    borderRadius: r * 2,
                  }}
                >
                  {/* Section header */}
                  <div className="flex items-center gap-2 mb-5">
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: t.primary, color: t.onPrimary }}
                    >
                      2
                    </div>
                    <h2 className="font-semibold text-base" style={{ color: t.fg }}>
                      {tr("storefront.checkout.summary")}
                    </h2>
                  </div>

                  {/* Cart items */}
                  <div className="space-y-3 max-h-56 overflow-y-auto">
                    {cart.items.map((item) => (
                      <div key={item.productId} className="flex items-center gap-3 text-sm">
                        <div
                          className="h-14 w-14 shrink-0 overflow-hidden"
                          style={{
                            borderRadius: r,
                            backgroundColor: t.isDark
                              ? "rgba(255,255,255,0.06)"
                              : "rgba(0,0,0,0.05)",
                          }}
                        >
                          {item.image && (
                            <img src={item.image} alt={item.name || "Cart item"} className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate" style={{ color: t.fg }}>
                            {item.name}
                          </div>
                          <div className="text-xs mt-0.5" style={{ color: t.muted }}>
                            {tr("storefront.checkout.qty", { n: item.quantity })}
                          </div>
                        </div>
                        <div className="font-semibold tabular-nums" style={{ color: t.fg }}>
                          {formatDZD(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div
                    className="mt-5 pt-4 space-y-2.5 text-sm"
                    style={{ borderTop: `1px solid ${t.border}` }}
                  >
                    <div className="flex justify-between">
                      <span style={{ color: t.muted }}>{tr("storefront.checkout.subtotal")}</span>
                      <span className="tabular-nums font-medium" style={{ color: t.fg }}>
                        {formatDZD(cart.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span style={{ color: t.muted }}>
                        {tr("storefront.checkout.shipping")}
                        {form.wilaya ? ` · ${form.wilaya}` : ""}
                        {form.city ? ` · ${form.city}` : ""}
                        {selectedCompanyName ? ` · ${selectedCompanyName}` : ""}
                      </span>
                      <span
                        className="tabular-nums inline-flex items-center gap-1.5 font-medium transition-opacity"
                        style={{ color: t.fg, opacity: fetchingPrice ? 0.5 : 1 }}
                      >
                        {fetchingPrice && <Loader2 className="h-3 w-3 animate-spin" />}
                        {!form.wilaya || !form.city ? (
                          <span style={{ color: t.muted }}>—</span>
                        ) : tariffAvailable ? (
                          formatDZD(animatedDelivery)
                        ) : (
                          <span style={{ color: "#ef4444" }}>
                            {tr("storefront.checkout.unavailable", { defaultValue: "Unavailable" })}
                          </span>
                        )}
                      </span>
                    </div>
                    {form.wilaya && form.city && !tariffAvailable && !fetchingPrice && (
                      <p
                        className="text-xs px-3 py-2 rounded-lg"
                        style={{ backgroundColor: "#ef444415", color: "#ef4444", borderRadius: r }}
                      >
                        {tr("storefront.checkout.deliveryUnavailable", {
                          defaultValue: "Delivery unavailable for this selection.",
                        })}
                      </p>
                    )}
                    <div
                      className="flex justify-between text-base font-bold pt-3"
                      style={{ borderTop: `1px solid ${t.border}`, color: t.fg }}
                    >
                      <span>{tr("storefront.checkout.total")}</span>
                      <span className="tabular-nums" style={{ color: t.primary }}>
                        {formatDZD(animatedTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Payment method selection */}
                  {settings.chargily_enabled && (
                    <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${t.border}` }}>
                      <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ opacity: 0.6, color: t.muted }}>
                        {tr("storefront.checkout.paymentMethod")}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {([
                          { key: "cod" as const, icon: Truck, label: tr("storefront.checkout.cod"), desc: tr("storefront.checkout.codDesc") },
                          { key: "chargily" as const, icon: CreditCard, label: tr("storefront.checkout.chargily"), desc: tr("storefront.checkout.chargilyDesc") },
                        ]).map(({ key, icon: Icon, label, desc }) => {
                          const active = paymentMethod === key;
                          return (
                            <button
                              type="button"
                              key={key}
                              onClick={() => setPaymentMethod(key)}
                              className="flex flex-col items-center gap-1.5 py-3 px-3 text-sm font-medium transition-all"
                              style={{
                                border: `2px solid ${active ? t.primary : t.border}`,
                                backgroundColor: active ? t.primary + "15" : t.isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                                color: active ? t.primary : t.fg,
                                borderRadius: r,
                              }}
                            >
                              <Icon className="h-5 w-5" />
                              <span className="text-xs">{label}</span>
                              <span className="text-[10px] font-normal opacity-60">{desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-6 w-full h-13 flex items-center justify-center gap-2 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                    style={{
                      backgroundColor: t.primary,
                      color: t.onPrimary,
                      borderRadius: r,
                      height: 52,
                      fontSize: 15,
                    }}
                  >
                    {submitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5" />
                        {tr("storefront.checkout.place", { amount: formatDZD(animatedTotal) })}
                      </>
                    )}
                  </button>

                  <p className="mt-3 text-xs text-center" style={{ color: t.muted }}>
                    {tr("storefront.checkout.demo")}
                  </p>
                </div>
              </div>
            </form>
          )}
        </div>
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
      <span
        className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
        style={{ opacity: 0.6 }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
