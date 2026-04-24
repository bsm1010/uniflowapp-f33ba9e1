import { useEffect, useLayoutEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

interface Props {
  userId: string;
}

interface Step {
  selector: string;
  text: string;
}

const STEPS: Step[] = [
  { selector: '[data-tour="dashboard"]', text: "📊 هنا تشوف ملخص نشاطك (طلبات، أرباح…)" },
  { selector: '[data-tour="products"]', text: "📦 من هنا تضيف المنتجات تاعك وتبدأ البيع" },
  { selector: '[data-tour="orders"]', text: "🛒 هنا تستقبل وتدير الطلبات" },
  { selector: '[data-tour="shipping"]', text: "🚚 حدد أسعار التوصيل لكل ولاية" },
  { selector: '[data-tour="customize"]', text: "🎨 بدل شكل متجرك (ألوان، صور…)" },
];

const PADDING = 8;

export function OnboardingTour({ userId }: Props) {
  const storageKey = `fennecly:tour-done:${userId}`;
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Start the tour only after the welcome dialog's "Get Started" is clicked.
  // If the welcome was already seen previously (returning user who hasn't done
  // the tour yet), start shortly after mount.
  useEffect(() => {
    if (!userId) return;
    try {
      if (localStorage.getItem(storageKey)) return;
    } catch {
      return;
    }

    const start = () => setActive(true);
    window.addEventListener("fennecly:welcome-finished", start);

    let timer: ReturnType<typeof setTimeout> | null = null;
    try {
      const welcomeSeen = localStorage.getItem(`fennecly:welcome-seen:${userId}`);
      if (welcomeSeen) {
        // Welcome already dismissed in a past session — start the tour soon.
        timer = setTimeout(start, 600);
      }
    } catch {
      /* ignore */
    }

    return () => {
      window.removeEventListener("fennecly:welcome-finished", start);
      if (timer) clearTimeout(timer);
    };
  }, [userId, storageKey]);

  const finish = () => {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
    setActive(false);
  };

  // Measure highlighted element
  useLayoutEffect(() => {
    if (!active) return;
    const measure = () => {
      const el = document.querySelector(STEPS[stepIndex].selector) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
    };
    measure();
    const t = setTimeout(measure, 300); // re-measure after scroll
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [active, stepIndex]);

  if (!active) return null;

  const step = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  // Tooltip positioning: prefer to the right of the highlight; fallback below
  let tooltipStyle: React.CSSProperties = {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    maxWidth: 320,
    zIndex: 10000,
  };

  if (rect) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tooltipWidth = Math.min(320, vw - 32);
    const spaceRight = vw - rect.right;
    const spaceLeft = rect.left;
    const placeRight = spaceRight >= tooltipWidth + 24;
    const placeLeft = !placeRight && spaceLeft >= tooltipWidth + 24;

    if (placeRight) {
      tooltipStyle = {
        position: "fixed",
        top: Math.min(Math.max(8, rect.top), vh - 220),
        left: rect.right + 16,
        width: tooltipWidth,
        zIndex: 10000,
      };
    } else if (placeLeft) {
      tooltipStyle = {
        position: "fixed",
        top: Math.min(Math.max(8, rect.top), vh - 220),
        left: rect.left - tooltipWidth - 16,
        width: tooltipWidth,
        zIndex: 10000,
      };
    } else {
      // Place below or above
      const below = rect.bottom + 16 + 200 < vh;
      tooltipStyle = {
        position: "fixed",
        top: below ? rect.bottom + 16 : Math.max(8, rect.top - 216),
        left: Math.max(8, Math.min(vw - tooltipWidth - 8, rect.left)),
        width: tooltipWidth,
        zIndex: 10000,
      };
    }
  }

  return (
    <>
      {/* Overlay with cutout */}
      <div className="fixed inset-0 z-[9998] pointer-events-auto" onClick={finish}>
        {rect ? (
          <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <mask id="tour-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={Math.max(0, rect.left - PADDING)}
                  y={Math.max(0, rect.top - PADDING)}
                  width={rect.width + PADDING * 2}
                  height={rect.height + PADDING * 2}
                  rx={12}
                  ry={12}
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0,0,0,0.65)"
              mask="url(#tour-mask)"
            />
          </svg>
        ) : (
          <div className="absolute inset-0 bg-black/65" />
        )}
      </div>

      {/* Highlight ring */}
      {rect && (
        <div
          className="pointer-events-none fixed z-[9999] rounded-xl ring-2 ring-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.25)] animate-pulse"
          style={{
            top: rect.top - PADDING,
            left: rect.left - PADDING,
            width: rect.width + PADDING * 2,
            height: rect.height + PADDING * 2,
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        dir="rtl"
        style={tooltipStyle}
        className="rounded-2xl border bg-background p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="text-xs font-semibold text-muted-foreground">
            {stepIndex + 1} / {STEPS.length}
          </div>
          <button
            onClick={finish}
            aria-label="Skip tour"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-base font-medium leading-relaxed">{step.text}</p>

        <div className="mt-5 flex items-center justify-between gap-2">
          <button
            onClick={finish}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            تخطي الجولة
          </button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isFirst}
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              className="gap-1"
            >
              <ArrowRight className="h-4 w-4" />
              السابق
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (isLast) finish();
                else setStepIndex((i) => i + 1);
              }}
              className="gap-1"
            >
              {isLast ? "إنهاء" : "التالي"}
              {!isLast && <ArrowLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
