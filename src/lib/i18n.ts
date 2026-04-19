import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      nav: {
        features: "Features",
        how: "How it works",
        pricing: "Pricing",
        testimonials: "Testimonials",
        signIn: "Sign in",
        getStarted: "Get Started",
      },
      hero: {
        badge: "New — AI-powered store generation",
        titleA: "Build Your Online Store",
        titleB: "in Minutes",
        subtitle:
          "Create, customize, and launch your e-commerce business without code. Everything you need to sell online — in one beautifully simple platform.",
        getStarted: "Get Started",
        viewDemo: "View Demo",
      },
      features: {
        kicker: "Features",
        titleA: "Everything you need to",
        titleB: "sell online",
        subtitle:
          "Powerful tools designed to grow your business — from your first sale to your millionth.",
        items: {
          builder: { title: "Drag & Drop Builder", desc: "Design beautiful storefronts visually — no code, no complexity." },
          themes: { title: "Custom Themes", desc: "Pixel-perfect themes you can tailor to match your brand identity." },
          products: { title: "Product Management", desc: "Inventory, variants, and collections — all in one clean dashboard." },
          payments: { title: "Secure Payments", desc: "PCI-compliant checkout with global payment methods built-in." },
          analytics: { title: "Analytics Dashboard", desc: "Real-time insights on sales, traffic, and customer behavior." },
        },
      },
      how: {
        kicker: "How it works",
        titleA: "From idea to live store in",
        titleB: "3 steps",
        steps: {
          create: { title: "Create Account", desc: "Sign up free in 30 seconds. No credit card required." },
          build: { title: "Build Your Store", desc: "Pick a theme, add your products, and customize everything." },
          launch: { title: "Launch & Sell", desc: "Go live with one click and start accepting orders worldwide." },
        },
      },
      pricing: {
        kicker: "Pricing",
        titleA: "Simple,",
        titleB: "transparent",
        titleC: "pricing",
        subtitle: "Start free, upgrade when you grow. No hidden fees, ever.",
        popular: "Most popular",
        forever: "/forever",
        month: "/month",
        free: { name: "Free", desc: "Perfect for testing your idea.", cta: "Start free", f: ["1 store", "Up to 10 products", "Basic themes", "Community support"] },
        pro: { name: "Pro", desc: "For growing businesses ready to scale.", cta: "Start Pro trial", f: ["Unlimited products", "All premium themes", "Custom domain", "Advanced analytics", "Priority support"] },
        business: { name: "Business", desc: "Advanced tools for serious sellers.", cta: "Contact sales", f: ["Everything in Pro", "Multi-store", "API access", "Dedicated manager", "99.99% SLA"] },
      },
      testimonials: {
        kicker: "Testimonials",
        titleA: "Loved by",
        titleB: "10,000+",
        titleC: "founders",
      },
      cta: {
        title: "Ready to build your store?",
        subtitle: "Join thousands of founders building successful brands on Storely. Free forever to start.",
        primary: "Get Started Free",
        secondary: "Talk to sales",
      },
      footer: {
        tagline: "The fastest way to build, launch, and grow your e-commerce business.",
        product: "Product",
        company: "Company",
        legal: "Legal",
        rights: "All rights reserved.",
        made: "Made with care for founders worldwide.",
      },
    },
  },
  fr: {
    translation: {
      nav: {
        features: "Fonctionnalités",
        how: "Comment ça marche",
        pricing: "Tarifs",
        testimonials: "Témoignages",
        signIn: "Se connecter",
        getStarted: "Commencer",
      },
      hero: {
        badge: "Nouveau — Génération de boutique par IA",
        titleA: "Créez votre boutique en ligne",
        titleB: "en quelques minutes",
        subtitle:
          "Créez, personnalisez et lancez votre activité e-commerce sans code. Tout ce qu'il faut pour vendre en ligne — sur une seule plateforme.",
        getStarted: "Commencer",
        viewDemo: "Voir la démo",
      },
      features: {
        kicker: "Fonctionnalités",
        titleA: "Tout ce qu'il vous faut pour",
        titleB: "vendre en ligne",
        subtitle:
          "Des outils puissants conçus pour faire grandir votre entreprise — de la première vente à la millionième.",
        items: {
          builder: { title: "Éditeur glisser-déposer", desc: "Concevez visuellement de belles boutiques — sans code." },
          themes: { title: "Thèmes personnalisés", desc: "Des thèmes au pixel près adaptables à votre marque." },
          products: { title: "Gestion des produits", desc: "Inventaire, variantes et collections dans un tableau de bord clair." },
          payments: { title: "Paiements sécurisés", desc: "Paiement conforme PCI avec méthodes mondiales intégrées." },
          analytics: { title: "Tableau de bord analytique", desc: "Aperçus en temps réel des ventes, du trafic et des clients." },
        },
      },
      how: {
        kicker: "Comment ça marche",
        titleA: "De l'idée à la boutique en ligne en",
        titleB: "3 étapes",
        steps: {
          create: { title: "Créer un compte", desc: "Inscription gratuite en 30 secondes. Sans carte bancaire." },
          build: { title: "Construire votre boutique", desc: "Choisissez un thème, ajoutez vos produits, personnalisez tout." },
          launch: { title: "Lancer et vendre", desc: "Mettez en ligne en un clic et recevez des commandes du monde entier." },
        },
      },
      pricing: {
        kicker: "Tarifs",
        titleA: "Tarification",
        titleB: "transparente",
        titleC: "et simple",
        subtitle: "Démarrez gratuitement, évoluez à votre rythme. Aucun frais caché.",
        popular: "Le plus populaire",
        forever: "/à vie",
        month: "/mois",
        free: { name: "Gratuit", desc: "Idéal pour tester votre idée.", cta: "Commencer gratuitement", f: ["1 boutique", "Jusqu'à 10 produits", "Thèmes de base", "Support communautaire"] },
        pro: { name: "Pro", desc: "Pour les entreprises en croissance.", cta: "Essai Pro", f: ["Produits illimités", "Tous les thèmes premium", "Domaine personnalisé", "Analytique avancée", "Support prioritaire"] },
        business: { name: "Business", desc: "Outils avancés pour les vendeurs sérieux.", cta: "Contacter les ventes", f: ["Tout du Pro", "Multi-boutique", "Accès API", "Gestionnaire dédié", "SLA 99,99 %"] },
      },
      testimonials: {
        kicker: "Témoignages",
        titleA: "Adoré par",
        titleB: "10 000+",
        titleC: "fondateurs",
      },
      cta: {
        title: "Prêt à créer votre boutique ?",
        subtitle: "Rejoignez des milliers de fondateurs qui construisent des marques à succès sur Storely.",
        primary: "Commencer gratuitement",
        secondary: "Parler aux ventes",
      },
      footer: {
        tagline: "Le moyen le plus rapide de créer, lancer et développer votre e-commerce.",
        product: "Produit",
        company: "Entreprise",
        legal: "Mentions légales",
        rights: "Tous droits réservés.",
        made: "Conçu avec soin pour les fondateurs du monde entier.",
      },
    },
  },
  ar: {
    translation: {
      nav: {
        features: "المميزات",
        how: "كيف يعمل",
        pricing: "الأسعار",
        testimonials: "آراء العملاء",
        signIn: "تسجيل الدخول",
        getStarted: "ابدأ الآن",
      },
      hero: {
        badge: "جديد — إنشاء متجر بالذكاء الاصطناعي",
        titleA: "أنشئ متجرك الإلكتروني",
        titleB: "في دقائق",
        subtitle:
          "أنشئ وخصّص وأطلق متجرك الإلكتروني بدون برمجة. كل ما تحتاجه للبيع عبر الإنترنت في منصة واحدة بسيطة وجميلة.",
        getStarted: "ابدأ الآن",
        viewDemo: "شاهد العرض",
      },
      features: {
        kicker: "المميزات",
        titleA: "كل ما تحتاجه",
        titleB: "للبيع عبر الإنترنت",
        subtitle:
          "أدوات قوية مصممة لتنمية أعمالك — من أول عملية بيع إلى المليون.",
        items: {
          builder: { title: "محرر السحب والإفلات", desc: "صمّم متاجر جميلة بصريًا — بدون أي برمجة." },
          themes: { title: "قوالب مخصصة", desc: "قوالب دقيقة يمكنك تخصيصها لتناسب هوية علامتك التجارية." },
          products: { title: "إدارة المنتجات", desc: "المخزون والمتغيرات والمجموعات في لوحة تحكم واحدة." },
          payments: { title: "مدفوعات آمنة", desc: "دفع متوافق مع PCI مع طرق دفع عالمية مدمجة." },
          analytics: { title: "لوحة التحليلات", desc: "إحصائيات لحظية للمبيعات والزيارات وسلوك العملاء." },
        },
      },
      how: {
        kicker: "كيف يعمل",
        titleA: "من الفكرة إلى متجر مباشر في",
        titleB: "3 خطوات",
        steps: {
          create: { title: "أنشئ حسابًا", desc: "اشترك مجانًا في 30 ثانية. بدون بطاقة ائتمان." },
          build: { title: "ابنِ متجرك", desc: "اختر قالبًا، أضف منتجاتك، وخصّص كل شيء." },
          launch: { title: "أطلق وبِع", desc: "انطلق بنقرة واحدة واستقبل الطلبات من جميع أنحاء العالم." },
        },
      },
      pricing: {
        kicker: "الأسعار",
        titleA: "أسعار",
        titleB: "شفافة",
        titleC: "وبسيطة",
        subtitle: "ابدأ مجانًا، رقّ خطتك عندما تكبر. بدون رسوم خفية أبدًا.",
        popular: "الأكثر شعبية",
        forever: "/للأبد",
        month: "/شهريًا",
        free: { name: "مجاني", desc: "مثالي لتجربة فكرتك.", cta: "ابدأ مجانًا", f: ["متجر واحد", "حتى 10 منتجات", "قوالب أساسية", "دعم المجتمع"] },
        pro: { name: "احترافي", desc: "للأعمال المتنامية الجاهزة للتوسع.", cta: "ابدأ تجربة Pro", f: ["منتجات غير محدودة", "كل القوالب المميزة", "نطاق مخصص", "تحليلات متقدمة", "دعم ذو أولوية"] },
        business: { name: "أعمال", desc: "أدوات متقدمة للبائعين الجادين.", cta: "تواصل مع المبيعات", f: ["كل ما في Pro", "متاجر متعددة", "وصول API", "مدير مخصص", "SLA 99.99٪"] },
      },
      testimonials: {
        kicker: "آراء العملاء",
        titleA: "محبوب من",
        titleB: "+10,000",
        titleC: "مؤسس",
      },
      cta: {
        title: "هل أنت مستعد لبناء متجرك؟",
        subtitle: "انضم إلى آلاف المؤسسين الذين يبنون علامات ناجحة على Storely. مجاني للأبد للبدء.",
        primary: "ابدأ مجانًا",
        secondary: "تحدث مع المبيعات",
      },
      footer: {
        tagline: "أسرع طريقة لبناء وإطلاق وتنمية أعمالك في التجارة الإلكترونية.",
        product: "المنتج",
        company: "الشركة",
        legal: "قانوني",
        rights: "جميع الحقوق محفوظة.",
        made: "صُنع بعناية للمؤسسين حول العالم.",
      },
    },
  },
};

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: "en",
      supportedLngs: ["en", "fr", "ar"],
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
        lookupLocalStorage: "lang",
      },
    });
}

export function applyDirection(lng: string) {
  if (typeof document === "undefined") return;
  const dir = lng === "ar" ? "rtl" : "ltr";
  document.documentElement.setAttribute("dir", dir);
  document.documentElement.setAttribute("lang", lng);
}

i18n.on("languageChanged", applyDirection);

export default i18n;
