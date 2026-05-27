import { useTranslation } from "react-i18next";
import { Twitter, Github, Linkedin, Instagram } from "lucide-react";

const socials = [
  { Icon: Twitter, href: "#", label: "Twitter" },
  { Icon: Github, href: "#", label: "GitHub" },
  { Icon: Linkedin, href: "#", label: "LinkedIn" },
  { Icon: Instagram, href: "#", label: "Instagram" },
];

export function Footer() {
  const { t } = useTranslation();
  const sections = [
    { title: t("footer.product"), links: ["Features", "Pricing", "Themes", "Integrations"] },
    { title: t("footer.company"), links: ["About", "Contact", "Careers", "Blog"] },
    { title: t("footer.legal"), links: ["Privacy", "Terms", "Security", "Cookies"] },
  ];

  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-brand shadow-glow" />
              <span className="font-display font-semibold text-lg">Storely</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              {t("footer.tagline")}
            </p>
            <div className="mt-6 flex gap-2">
              {socials.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {sections.map((s) => (
            <div key={s.title}>
              <h4 className="text-sm font-semibold">{s.title}</h4>
              <ul className="mt-4 space-y-3">
                {s.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Storely, Inc. {t("footer.rights")}
          </p>
          <p className="text-xs text-muted-foreground">{t("footer.made")}</p>
        </div>
      </div>
    </footer>
  );
}
