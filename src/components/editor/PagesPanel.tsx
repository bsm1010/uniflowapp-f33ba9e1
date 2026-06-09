import { useEditorStore } from "@/stores/editor-store";
import type { Json } from "@/integrations/supabase/types";

export function PagesPanel() {
  const { settings, updateSettings } = useEditorStore();

  if (!settings) return null;

  return (
    <div className="p-4 space-y-6">
      {/* Store Info */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Store Info
        </h3>
        <div className="space-y-3">
          <Field label="Store name">
            <input
              value={settings.store_name || ""}
              onChange={(e) => updateSettings({ store_name: e.target.value })}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>
          <Field label="Tagline">
            <input
              value={settings.tagline || ""}
              onChange={(e) => updateSettings({ tagline: e.target.value })}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>
          <Field label="Currency">
            <select
              value={settings.currency || "DZD"}
              onChange={(e) => updateSettings({ currency: e.target.value })}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {["DZD", "USD", "EUR", "MAD", "TND", "GBP", "SAR", "AED"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="URL Slug">
            <input
              value={settings.slug || ""}
              onChange={(e) =>
                updateSettings({
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                })
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>
        </div>
      </section>

      {/* Navigation Links */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Navigation Links
        </h3>
        <NavLinksEditor />
      </section>

      {/* Footer */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Footer
        </h3>
        <div className="space-y-3">
          <Field label="About text">
            <textarea
              rows={3}
              value={settings.footer_about || ""}
              onChange={(e) => updateSettings({ footer_about: e.target.value })}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </Field>
          <Field label="Copyright">
            <input
              value={settings.footer_copyright || ""}
              onChange={(e) => updateSettings({ footer_copyright: e.target.value })}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </Field>
        </div>
      </section>

      {/* Social Links */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Social Links
        </h3>
        <SocialLinksEditor />
      </section>
    </div>
  );
}

function NavLinksEditor() {
  const { settings, updateSettings } = useEditorStore();
  const links = (() => {
    const raw = settings?.nav_links;
    if (Array.isArray(raw)) return raw as unknown as Array<{ label: string; href: string }>;
    return [];
  })();

  const update = (next: Array<{ label: string; href: string }>) => {
    updateSettings({ nav_links: next as unknown as Json });
  };

  return (
    <div className="space-y-2">
      {links.map((link, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={link.label}
            onChange={(e) => {
              const next = [...links];
              next[i] = { ...next[i], label: e.target.value };
              update(next);
            }}
            placeholder="Label"
            className="flex-1 rounded-md border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            value={link.href}
            onChange={(e) => {
              const next = [...links];
              next[i] = { ...next[i], href: e.target.value };
              update(next);
            }}
            placeholder="/path"
            className="flex-1 rounded-md border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={() => update(links.filter((_, j) => j !== i))}
            className="text-xs text-destructive hover:underline"
          >
            ×
          </button>
        </div>
      ))}
      {links.length < 6 && (
        <button
          type="button"
          onClick={() => update([...links, { label: "New", href: "#" }])}
          className="text-xs text-primary hover:underline"
        >
          + Add link
        </button>
      )}
    </div>
  );
}

function SocialLinksEditor() {
  const { settings, updateSettings } = useEditorStore();
  const socials = (() => {
    const raw = settings?.footer_socials;
    if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, string>;
    return {};
  })();

  const platforms = ["instagram", "facebook", "twitter", "tiktok"];

  return (
    <div className="space-y-2">
      {platforms.map((p) => (
        <Field key={p} label={p.charAt(0).toUpperCase() + p.slice(1)}>
          <input
            value={socials[p] || ""}
            onChange={(e) =>
              updateSettings({
                footer_socials: { ...socials, [p]: e.target.value },
              })
            }
            placeholder={`https://${p}.com/...`}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium mb-1 text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
