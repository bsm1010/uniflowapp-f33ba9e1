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
    <footer className="border-t border-white/10 bg-black/20">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25" />
              <span className="font-display font-semibold text-lg text-white">Fennecly</span>
            </div>
            <p className="mt-4 text-sm text-white/50 max-w-xs">{t("footer.tagline")}</p>
            <div className="mt-6 flex gap-2">
              {socials.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {sections.map((s) => (
            <div key={s.title}>
              <h4 className="text-sm font-semibold text-white">{s.title}</h4>
              <ul className="mt-4 space-y-3">
                {s.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-white/40 hover:text-white transition-colors"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} Fennecly, Inc. {t("footer.rights")}
          </p>
          <p className="text-xs text-white/30">{t("footer.made")}</p>
        </div>
      </div>
    </footer>
  );
}
