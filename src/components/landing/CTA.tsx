import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTA() {
  const { t } = useTranslation();
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-brand p-10 md:p-16 text-center shadow-glow">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold text-brand-foreground">
              {t("cta.title")}
            </h2>
            <p className="mt-4 text-brand-foreground/80 max-w-xl mx-auto">
              {t("cta.subtitle")}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" variant="secondary" className="group">
                {t("cta.primary")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-brand-foreground/30 text-brand-foreground hover:bg-brand-foreground/10 hover:text-brand-foreground"
              >
                {t("cta.secondary")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
