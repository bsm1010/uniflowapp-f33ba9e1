import { useMemo, useState } from "react";
import { Loader2, ShoppingBag } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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

const schema = z.object({
  firstName: z.string().trim().min(2, "First name is required").max(60),
  lastName: z.string().trim().min(2, "Last name is required").max(60),
  phone: z
    .string()
    .trim()
    .min(1, "Phone is required")
    .refine(isValidAlgerianPhone, "Invalid Algerian phone (e.g. 0555 12 34 56)"),
  wilaya: z.string().min(1, "Wilaya is required"),
  city: z.string().min(1, "City is required"),
});

type FormErrors = Partial<Record<keyof z.infer<typeof schema>, string>>;

export function AlgerianCheckoutForm({
  storeOwnerId,
  storeSlug,
  product,
  quantity,
  tokens: t,
  radius,
  onSuccess,
}: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [city, setCity] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const cities = useMemo(
    () => (wilaya ? ALGERIA_WILAYAS[wilaya] ?? [] : []),
    [wilaya],
  );

  const subtotal = product.price * quantity;

  const inputStyle = {
    backgroundColor: t.bg,
    border: `1px solid ${t.border}`,
    borderRadius: radius / 2,
    color: t.fg,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ firstName, lastName, phone, wilaya, city });
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
          total: subtotal,
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

      toast.success("Order placed! We'll contact you shortly.");
      setFirstName("");
      setLastName("");
      setPhone("");
      setWilaya("");
      setCity("");
      onSuccess?.(order.id);
    } catch (err) {
      console.error(err);
      toast.error("Failed to place order. Please try again.");
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
          Order now — Cash on delivery
        </h2>
        <p className="mt-1 text-xs" style={{ color: t.muted }}>
          Fill in your details and we'll deliver to your wilaya.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="First name" error={errors.firstName} mutedColor={t.muted}>
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
        <Field label="Last name" error={errors.lastName} mutedColor={t.muted}>
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

      <Field label="Phone number" error={errors.phone} mutedColor={t.muted}>
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
        <Field label="Wilaya" error={errors.wilaya} mutedColor={t.muted}>
          <select
            value={wilaya}
            onChange={(e) => {
              setWilaya(e.target.value);
              setCity("");
            }}
            className="w-full h-11 px-3 text-sm outline-none"
            style={inputStyle}
          >
            <option value="">Select wilaya…</option>
            {WILAYA_LIST.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </Field>
        <Field label="City / Commune" error={errors.city} mutedColor={t.muted}>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={!wilaya}
            className="w-full h-11 px-3 text-sm outline-none disabled:opacity-50"
            style={inputStyle}
          >
            <option value="">
              {wilaya ? "Select city…" : "Pick wilaya first"}
            </option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div
        className="flex items-center justify-between pt-3 mt-2"
        style={{ borderTop: `1px solid ${t.border}` }}
      >
        <div className="text-sm" style={{ color: t.muted }}>
          Total ({quantity} item{quantity > 1 ? "s" : ""})
        </div>
        <div className="text-xl font-bold" style={{ color: t.fg }}>
          {subtotal.toFixed(2)} DA
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
        {submitting ? "Placing order…" : "Order Now"}
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
