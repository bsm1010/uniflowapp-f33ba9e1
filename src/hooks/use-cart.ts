import { useCallback, useEffect, useState } from "react";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
}

const KEY = (slug: string) => `storely:cart:${slug}`;

function read(slug: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY(slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is CartItem =>
        i &&
        typeof i.productId === "string" &&
        typeof i.name === "string" &&
        typeof i.price === "number" &&
        typeof i.quantity === "number" &&
        i.quantity > 0,
    );
  } catch {
    return [];
  }
}

function write(slug: string, items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY(slug), JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(`cart-updated:${slug}`));
}

export function useCart(slug: string) {
  const [items, setItems] = useState<CartItem[]>(() => read(slug));

  useEffect(() => {
    setItems(read(slug));
    const handler = () => setItems(read(slug));
    window.addEventListener(`cart-updated:${slug}`, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(`cart-updated:${slug}`, handler);
      window.removeEventListener("storage", handler);
    };
  }, [slug]);

  const add = useCallback(
    (item: Omit<CartItem, "quantity">, qty = 1) => {
      const current = read(slug);
      const idx = current.findIndex((i) => i.productId === item.productId);
      if (idx >= 0) {
        current[idx] = { ...current[idx], quantity: current[idx].quantity + qty };
      } else {
        current.push({ ...item, quantity: qty });
      }
      write(slug, current);
    },
    [slug],
  );

  const setQty = useCallback(
    (productId: string, qty: number) => {
      const current = read(slug);
      const next = qty <= 0
        ? current.filter((i) => i.productId !== productId)
        : current.map((i) =>
            i.productId === productId ? { ...i, quantity: qty } : i,
          );
      write(slug, next);
    },
    [slug],
  );

  const remove = useCallback(
    (productId: string) => {
      write(slug, read(slug).filter((i) => i.productId !== productId));
    },
    [slug],
  );

  const clear = useCallback(() => write(slug, []), [slug]);

  const count = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);

  return { items, add, setQty, remove, clear, count, subtotal };
}
