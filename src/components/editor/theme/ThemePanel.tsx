import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useEditorStore } from "@/stores/editor-store";
import { THEME_PRESETS } from "@/lib/themePresets";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter" },
  { value: "Space Grotesk", label: "Space Grotesk" },
  { value: "Playfair", label: "Playfair Display" },
  { value: "DM Serif", label: "DM Serif Display" },
  { value: "Mono", label: "JetBrains Mono" },
  { value: "Manrope", label: "Manrope" },
  { value: "Sora", label: "Sora" },
  { value: "Outfit", label: "Outfit" },
  { value: "Bricolage", label: "Bricolage Grotesque" },
  { value: "Fraunces", label: "Fraunces" },
  { value: "Cormorant", label: "Cormorant Garamond" },
  { value: "Plex Sans", label: "IBM Plex Sans" },
  { value: "Bebas", label: "Bebas Neue" },
  { value: "Archivo", label: "Archivo Black" },
  { value: "Syne", label: "Syne" },
  { value: "Jakarta", label: "Plus Jakarta Sans" },
];

export function ThemePanel() {
  const { settings, updateSettings } = useEditorStore();

  if (!settings) return null;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* Color presets */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Color Presets
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  updateSettings({
                    primary_color: preset.patch.primary_color,
                    secondary_color: preset.patch.secondary_color,
                    accent_color: preset.patch.accent_color,
                    background_color: preset.patch.background_color,
                  })
                }
                className="flex items-center gap-2 p-2 rounded-lg border hover:border-primary/40 hover:bg-accent/50 transition-colors text-left"
              >
                <div className="flex -space-x-1">
                  {[
                    preset.patch.primary_color,
                    preset.patch.secondary_color,
                    preset.patch.accent_color,
                  ].map((c, i) => (
                    <div
                      key={i}
                      className="h-5 w-5 rounded-full border-2 border-background"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">{preset.name}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Individual colors */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Colors
          </h3>
          <div className="space-y-3">
            <ColorField
              label="Primary"
              value={settings.primary_color || "#7c3aed"}
              onChange={(v) => updateSettings({ primary_color: v })}
            />
            <ColorField
              label="Secondary"
              value={settings.secondary_color || "#2563eb"}
              onChange={(v) => updateSettings({ secondary_color: v })}
            />
            <ColorField
              label="Accent"
              value={settings.accent_color || "#f59e0b"}
              onChange={(v) => updateSettings({ accent_color: v })}
            />
            <ColorField
              label="Background"
              value={settings.background_color || "#ffffff"}
              onChange={(v) => updateSettings({ background_color: v })}
            />
          </div>
        </section>

        {/* Typography */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Typography
          </h3>
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1.5 block">Font family</Label>
              <select
                value={settings.font_family || "Inter"}
                onChange={(e) => updateSettings({ font_family: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <div
                className="mt-2 p-3 rounded-md border bg-background text-center"
                style={{ fontFamily: settings.font_family || "Inter" }}
              >
                <span className="text-lg">The quick brown fox</span>
                <br />
                <span className="text-sm text-muted-foreground">jumps over the lazy dog</span>
              </div>
            </div>
          </div>
        </section>

        {/* Buttons & Shape */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Buttons & Shape
          </h3>
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1.5 block">Button style</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["rounded", "pill", "square"] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => updateSettings({ button_style: style })}
                    className={`py-2 text-xs font-medium border transition-colors ${
                      settings.button_style === style
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/30"
                    }`}
                    style={{
                      borderRadius: style === "pill" ? 9999 : style === "rounded" ? 8 : 0,
                    }}
                  >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Border radius</Label>
              <div className="grid grid-cols-4 gap-2">
                {(["none", "small", "medium", "large"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => updateSettings({ border_radius: r })}
                    className={`py-2 text-xs font-medium border transition-colors ${
                      settings.border_radius === r
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/30"
                    }`}
                    style={{
                      borderRadius: r === "none" ? 0 : r === "small" ? 4 : r === "medium" ? 8 : 16,
                    }}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Navbar */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Navigation
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {(["classic", "centered", "hamburger"] as const).map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => updateSettings({ navbar_style: style })}
                className={`py-3 text-xs font-medium border rounded-lg transition-colors ${
                  settings.navbar_style === style
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/30"
                }`}
              >
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {/* Footer */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Footer
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {(["simple", "columns", "branded"] as const).map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => updateSettings({ footer_style: style })}
                className={`py-3 text-xs font-medium border rounded-lg transition-colors ${
                  settings.footer_style === style
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/30"
                }`}
              >
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {/* Hero */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Hero Section
          </h3>
          <div className="space-y-3">
            <Field label="Heading">
              <Input
                value={settings.hero_heading || ""}
                onChange={(e) => updateSettings({ hero_heading: e.target.value })}
              />
            </Field>
            <Field label="Subheading">
              <Textarea
                rows={2}
                value={settings.hero_subheading || ""}
                onChange={(e) => updateSettings({ hero_subheading: e.target.value })}
              />
            </Field>
            <Field label="CTA Label">
              <Input
                value={settings.hero_cta_label || ""}
                onChange={(e) => updateSettings({ hero_cta_label: e.target.value })}
              />
            </Field>
            <div>
              <Label className="text-xs mb-1.5 block">Layout</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["centered", "split", "fullbleed"] as const).map((layout) => (
                  <button
                    key={layout}
                    type="button"
                    onClick={() => updateSettings({ hero_layout: layout })}
                    className={`py-2 text-xs font-medium border rounded-md transition-colors ${
                      settings.hero_layout === layout
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    {layout.charAt(0).toUpperCase() + layout.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Hero image</Label>
              {settings.hero_image_url && (
                <img
                  src={settings.hero_image_url}
                  alt="Hero"
                  className="w-full h-32 object-cover rounded-md mb-2"
                />
              )}
              <Input
                value={settings.hero_image_url || ""}
                placeholder="Image URL"
                onChange={(e) => updateSettings({ hero_image_url: e.target.value })}
              />
            </div>
          </div>
        </section>

        {/* Section visibility */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Section Visibility
          </h3>
          <div className="space-y-2">
            {(
              [
                ["show_hero", "Hero"],
                ["show_categories", "Categories"],
                ["show_featured", "Featured products"],
                ["show_newsletter", "Newsletter"],
                ["show_search", "Search bar"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <Label className="text-xs">{label}</Label>
                <Switch
                  checked={Boolean(settings[key])}
                  onCheckedChange={(v) => updateSettings({ [key]: v })}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Custom CSS */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Custom CSS
          </h3>
          <textarea
            rows={6}
            value={((settings as Record<string, unknown>).custom_css as string) || ""}
            onChange={(e) =>
              updateSettings({ custom_css: e.target.value } as Record<string, unknown>)
            }
            placeholder="/* Add custom CSS here */"
            className="w-full rounded-md border bg-background px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </section>
      </div>
    </ScrollArea>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-12 cursor-pointer rounded border shrink-0"
      />
      <div className="flex-1">
        <div className="text-xs font-medium">{label}</div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 text-xs mt-1"
        />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
