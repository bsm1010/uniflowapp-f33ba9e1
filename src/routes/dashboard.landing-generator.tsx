import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Upload,
  Sparkles,
  Loader2,
  Copy,
  RotateCw,
  Send,
  GripVertical,
  ImagePlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  generateLandingPage,
  type LandingPageContent,
} from "@/lib/ai/generate-landing-page";

export const Route = createFileRoute("/dashboard/landing-generator")({
  component: LandingGeneratorPage,
});

type SectionKey =
  | "hero"
  | "product"
  | "features"
  | "benefits"
  | "testimonials"
  | "faq"
  | "finalCta";

const DEFAULT_ORDER: SectionKey[] = [
  "hero",
  "product",
  "features",
  "benefits",
  "testimonials",
  "faq",
  "finalCta",
];

const SECTION_LABELS: Record<SectionKey, string> = {
  hero: "البطل (Hero)",
  product: "المنتج",
  features: "المميزات",
  benefits: "الفوائد",
  testimonials: "آراء العملاء",
  faq: "أسئلة شائعة",
  finalCta: "دعوة نهائية",
};

// Compress image client-side to keep payload small
async function fileToCompressedDataUrl(file: File, maxDim = 1024): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = dataUrl;
  });
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.85);
}

function LandingGeneratorPage() {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<LandingPageContent | null>(null);
  const [order, setOrder] = useState<SectionKey[]>(DEFAULT_ORDER);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("الرجاء رفع صورة فقط (jpg, png, webp)");
      return;
    }
    try {
      const compressed = await fileToCompressedDataUrl(file);
      setImageDataUrl(compressed);
    } catch {
      toast.error("تعذر قراءة الصورة");
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const generate = async () => {
    if (!imageDataUrl) {
      toast.error("الرجاء رفع صورة المنتج أولاً");
      return;
    }
    setLoading(true);
    try {
      const res = await generateLandingPage({ data: { imageDataUrl, hint } });
      setContent(res.content);
      setOrder(DEFAULT_ORDER);
      toast.success("تم إنشاء صفحة الهبوط بنجاح ✨");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  const copyPage = async () => {
    if (!previewRef.current) return;
    const text = previewRef.current.innerText;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("تم نسخ محتوى الصفحة");
    } catch {
      toast.error("تعذر النسخ");
    }
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setOrder((curr) => {
      const oldIndex = curr.indexOf(active.id as SectionKey);
      const newIndex = curr.indexOf(over.id as SectionKey);
      if (oldIndex === -1 || newIndex === -1) return curr;
      return arrayMove(curr, oldIndex, newIndex);
    });
  };

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            مُولّد صفحات الهبوط بالذكاء الاصطناعي
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            ارفع صورة المنتج، ودع الذكاء الاصطناعي ينشئ صفحة بيع عربية كاملة جاهزة للنشر.
          </p>
        </div>
        {content && (
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={copyPage}>
              <Copy className="h-4 w-4" /> نسخ الصفحة
            </Button>
            <Button variant="outline" onClick={generate} disabled={loading}>
              <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> إعادة التوليد
            </Button>
            <Button onClick={() => toast.success("تم نشر الصفحة (تجريبي)")}>
              <Send className="h-4 w-4" /> نشر
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_300px]">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all bg-card hover:bg-accent/30 ${
            dragOver ? "border-primary bg-accent/40" : "border-border"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          {imageDataUrl ? (
            <div className="flex flex-col items-center gap-3">
              <img
                src={imageDataUrl}
                alt="معاينة المنتج"
                className="max-h-64 rounded-lg shadow-soft object-contain"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileRef.current?.click();
                  }}
                >
                  <ImagePlus className="h-4 w-4" /> تغيير الصورة
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageDataUrl(null);
                  }}
                >
                  <X className="h-4 w-4" /> إزالة
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="font-medium">اسحب صورة المنتج هنا أو اضغط للاختيار</p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG, WEBP — حتى 10MB
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium block">تلميح اختياري للذكاء الاصطناعي</label>
          <Input
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="مثال: ساعة فاخرة للرجال"
            dir="rtl"
          />
          <Button
            className="w-full"
            size="lg"
            onClick={generate}
            disabled={!imageDataUrl || loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> جاري التوليد...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> أنشئ صفحة الهبوط
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            النصوص المُولّدة قابلة للتعديل المباشر بالنقر عليها.
          </p>
        </div>
      </div>

      {loading && !content && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground">يُحلّل المنتج وينشئ المحتوى العربي...</p>
        </div>
      )}

      {content && (
        <div ref={previewRef} className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="bg-muted/40 border-b border-border px-4 py-2 text-xs text-muted-foreground flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            معاينة الصفحة • التصنيف المكتشف:{" "}
            <span className="font-medium text-foreground">{content.productCategory}</span>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={order} strategy={verticalListSortingStrategy}>
              <div className="divide-y divide-border">
                {order.map((key) => (
                  <SortableSection key={key} sectionKey={key}>
                    {renderSection(key, content, setContent, imageDataUrl, () =>
                      fileRef.current?.click(),
                    )}
                  </SortableSection>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}

function SortableSection({
  sectionKey,
  children,
}: {
  sectionKey: SectionKey;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sectionKey,
  });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      className="relative group"
    >
      <button
        type="button"
        aria-label="إعادة الترتيب"
        className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur rounded-md p-1.5 border border-border cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur rounded-md px-2 py-0.5 border border-border text-[10px] text-muted-foreground">
        {SECTION_LABELS[sectionKey]}
      </div>
      {children}
    </div>
  );
}

function Editable({
  value,
  onChange,
  className = "",
  as: As = "span",
  multiline = false,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  multiline?: boolean;
}) {
  return (
    <As
      // @ts-expect-error contentEditable on dynamic element
      contentEditable
      suppressContentEditableWarning
      onBlur={(e: React.FocusEvent<HTMLElement>) => onChange(e.currentTarget.innerText)}
      className={`outline-none focus:ring-2 focus:ring-primary/40 focus:bg-primary/5 rounded px-1 -mx-1 transition-colors ${
        multiline ? "whitespace-pre-wrap" : ""
      } ${className}`}
    >
      {value}
    </As>
  );
}

function renderSection(
  key: SectionKey,
  c: LandingPageContent,
  setContent: (c: LandingPageContent) => void,
  image: string | null,
  onReplaceImage: () => void,
) {
  const update = <K extends keyof LandingPageContent>(k: K, v: LandingPageContent[K]) =>
    setContent({ ...c, [k]: v });

  switch (key) {
    case "hero":
      return (
        <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/20 px-6 py-16 md:py-24 text-center">
          <div className="max-w-3xl mx-auto space-y-5">
            <Editable
              as="h2"
              value={c.hero.title}
              onChange={(v) => update("hero", { ...c.hero, title: v })}
              className="text-3xl md:text-5xl font-bold leading-tight block"
            />
            <Editable
              as="p"
              value={c.hero.subtitle}
              onChange={(v) => update("hero", { ...c.hero, subtitle: v })}
              className="text-base md:text-xl text-muted-foreground block"
            />
            <button className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-3 text-base font-semibold shadow-soft hover:opacity-90 transition">
              <Editable
                value={c.hero.ctaLabel}
                onChange={(v) => update("hero", { ...c.hero, ctaLabel: v })}
              />
            </button>
          </div>
        </section>
      );
    case "product":
      return (
        <section className="px-6 py-12 md:py-16">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-center">
            <div className="relative group/img">
              {image ? (
                <img
                  src={image}
                  alt={c.product.name}
                  className="rounded-2xl shadow-soft w-full object-cover aspect-square"
                />
              ) : (
                <div className="aspect-square rounded-2xl bg-muted" />
              )}
              <button
                onClick={onReplaceImage}
                className="absolute bottom-3 right-3 opacity-0 group-hover/img:opacity-100 transition bg-background/90 backdrop-blur border border-border rounded-md px-3 py-1.5 text-xs flex items-center gap-1"
              >
                <ImagePlus className="h-3.5 w-3.5" /> استبدال الصورة
              </button>
            </div>
            <div className="space-y-4">
              <Editable
                as="h3"
                value={c.product.name}
                onChange={(v) => update("product", { ...c.product, name: v })}
                className="text-2xl md:text-3xl font-bold block"
              />
              <Editable
                as="p"
                value={c.product.shortDescription}
                onChange={(v) => update("product", { ...c.product, shortDescription: v })}
                className="text-muted-foreground leading-loose block"
                multiline
              />
            </div>
          </div>
        </section>
      );
    case "features":
      return (
        <section className="px-6 py-12 md:py-16 bg-muted/30">
          <div className="max-w-5xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-center mb-10">المميزات</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {c.features.map((f, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-card p-5 shadow-soft hover:shadow-md transition"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold mb-3">
                    {i + 1}
                  </div>
                  <Editable
                    as="h4"
                    value={f.title}
                    onChange={(v) => {
                      const next = [...c.features];
                      next[i] = { ...f, title: v };
                      update("features", next);
                    }}
                    className="font-semibold mb-2 block"
                  />
                  <Editable
                    as="p"
                    value={f.description}
                    onChange={(v) => {
                      const next = [...c.features];
                      next[i] = { ...f, description: v };
                      update("features", next);
                    }}
                    className="text-sm text-muted-foreground block"
                    multiline
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    case "benefits":
      return (
        <section className="px-6 py-12 md:py-16">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-center mb-8">لماذا ستحبه؟</h3>
            <ul className="space-y-3">
              {c.benefits.map((b, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-lg bg-card border border-border p-4"
                >
                  <span className="h-6 w-6 shrink-0 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-bold">
                    ✓
                  </span>
                  <Editable
                    value={b}
                    onChange={(v) => {
                      const next = [...c.benefits];
                      next[i] = v;
                      update("benefits", next);
                    }}
                    className="flex-1"
                    multiline
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      );
    case "testimonials":
      return (
        <section className="px-6 py-12 md:py-16 bg-muted/30">
          <div className="max-w-5xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-center mb-10">آراء عملائنا</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {c.testimonials.map((t, i) => (
                <div key={i} className="rounded-xl bg-card border border-border p-5 shadow-soft">
                  <div className="text-amber-500 mb-2">★★★★★</div>
                  <Editable
                    as="p"
                    value={t.quote}
                    onChange={(v) => {
                      const next = [...c.testimonials];
                      next[i] = { ...t, quote: v };
                      update("testimonials", next);
                    }}
                    className="text-sm leading-relaxed mb-3 block"
                    multiline
                  />
                  <div className="flex items-center gap-2 pt-3 border-t border-border">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent" />
                    <Editable
                      value={t.name}
                      onChange={(v) => {
                        const next = [...c.testimonials];
                        next[i] = { ...t, name: v };
                        update("testimonials", next);
                      }}
                      className="font-medium text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    case "faq":
      return (
        <section className="px-6 py-12 md:py-16">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-center mb-8">أسئلة شائعة</h3>
            <div className="space-y-3">
              {c.faq.map((q, i) => (
                <details
                  key={i}
                  className="group rounded-lg border border-border bg-card p-4 [&[open]]:shadow-soft"
                >
                  <summary className="cursor-pointer font-semibold flex items-center justify-between">
                    <Editable
                      value={q.question}
                      onChange={(v) => {
                        const next = [...c.faq];
                        next[i] = { ...q, question: v };
                        update("faq", next);
                      }}
                    />
                    <span className="text-muted-foreground group-open:rotate-180 transition">
                      ▼
                    </span>
                  </summary>
                  <Editable
                    as="p"
                    value={q.answer}
                    onChange={(v) => {
                      const next = [...c.faq];
                      next[i] = { ...q, answer: v };
                      update("faq", next);
                    }}
                    className="mt-3 text-muted-foreground text-sm block"
                    multiline
                  />
                </details>
              ))}
            </div>
          </div>
        </section>
      );
    case "finalCta":
      return (
        <section className="px-6 py-16 md:py-20 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-center">
          <div className="max-w-2xl mx-auto space-y-5">
            <Editable
              as="h3"
              value={c.finalCta.heading}
              onChange={(v) => update("finalCta", { ...c.finalCta, heading: v })}
              className="text-3xl md:text-4xl font-bold block"
            />
            <Editable
              as="p"
              value={c.finalCta.subheading}
              onChange={(v) => update("finalCta", { ...c.finalCta, subheading: v })}
              className="text-base md:text-lg opacity-90 block"
            />
            <button className="inline-flex items-center gap-2 rounded-full bg-background text-foreground px-10 py-3.5 text-base font-bold shadow-soft hover:scale-105 transition">
              <Editable
                value={c.finalCta.buttonLabel}
                onChange={(v) => update("finalCta", { ...c.finalCta, buttonLabel: v })}
              />
            </button>
          </div>
        </section>
      );
  }
}
