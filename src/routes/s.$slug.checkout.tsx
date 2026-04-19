import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
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

type StoreSettings = Tables<"store_settings">;

export const Route = createFileRoute("/s/$slug/checkout")({
  component: CheckoutPage,
  head: () => ({ meta: [{ title: "Checkout — Storely" }] }),
});

function CheckoutPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { t: tr } = useTranslation();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const cart = useCart(slug);

  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    postal: "",
    country: "",
    notes: "",
  });

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
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  const update = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

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
      !form.postal.trim() ||
      !form.country.trim()
    ) {
      toast.error(tr("storefront.checkout.errFields"));
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
        shipping_postal_code: form.postal.trim(),
        shipping_country: form.country.trim(),
        notes: form.notes.trim() || null,
        subtotal: cart.subtotal,
        total: cart.subtotal,
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
                <Field label={tr("storefront.checkout.city")}>
                  <input
                    required
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm outline-none focus:ring-2"
                    style={inputStyle}
                  />
                </Field>
                <Field label={tr("storefront.checkout.postal")}>
                  <input
                    required
                    value={form.postal}
                    onChange={(e) => update("postal", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm outline-none focus:ring-2"
                    style={inputStyle}
                  />
                </Field>
                <Field label={tr("storefront.checkout.country")} full>
                  <input
                    required
                    value={form.country}
                    onChange={(e) => update("country", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm outline-none focus:ring-2"
                    style={inputStyle}
                  />
                </Field>
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
                      ${(item.price * item.quantity).toFixed(2)}
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
                  <span>${cart.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: t.muted }}>{tr("storefront.checkout.shipping")}</span>
                  <span style={{ color: t.muted }}>{tr("storefront.checkout.free")}</span>
                </div>
                <div
                  className="flex justify-between text-base font-semibold pt-2"
                  style={{ borderTop: `1px solid ${t.border}` }}
                >
                  <span>{tr("storefront.checkout.total")}</span>
                  <span>${cart.subtotal.toFixed(2)}</span>
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
                  tr("storefront.checkout.place", { amount: `$${cart.subtotal.toFixed(2)}` })
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
