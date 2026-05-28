import { motion } from "framer-motion";
import {
  Package, ShoppingBag, Truck, Palette, BarChart3, Bot,
  Mail, Percent, Search, FileText, Globe, Database,
} from "lucide-react";

const tools = [
  { name: "Product Manager", desc: "Add, edit, and organize your catalog", icon: Package, color: "from-emerald-500 to-teal-500" },
  { name: "Order Tracking", desc: "Track every order from checkout to delivery", icon: ShoppingBag, color: "from-blue-500 to-cyan-500" },
  { name: "Delivery & Shipping", desc: "Integrate with Yalidine, ZR Express & more", icon: Truck, color: "from-amber-500 to-orange-500" },
  { name: "Theme Customizer", desc: "Customize your storefront with presets & blocks", icon: Palette, color: "from-violet-500 to-fuchsia-500" },
  { name: "Analytics & Insights", desc: "Visual dashboards for sales and traffic", icon: BarChart3, color: "from-rose-500 to-pink-500" },
  { name: "AI Chatbot", desc: "Automate customer support with AI", icon: Bot, color: "from-indigo-500 to-purple-500" },
  { name: "Email Marketing", desc: "Send campaigns and recover abandoned carts", icon: Mail, color: "from-red-500 to-rose-500" },
  { name: "Discount Codes", desc: "Create coupons and promo campaigns", icon: Percent, color: "from-green-500 to-emerald-500" },
  { name: "SEO Optimizer", desc: "Improve your store ranking on search engines", icon: Search, color: "from-sky-500 to-blue-500" },
  { name: "AI Descriptions", desc: "Generate product descriptions with AI", icon: FileText, color: "from-orange-500 to-red-500" },
  { name: "Multi-language", desc: "Reach customers in Arabic, French & English", icon: Globe, color: "from-teal-500 to-green-500" },
  { name: "Custom Database", desc: "Build your own data tables & automations", icon: Database, color: "from-zinc-600 to-slate-700" },
];

export function AllTools() {
  return (
    <section className="relative overflow-hidden py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            All the tools you need,{" "}
            <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
              in one place
            </span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Manage your entire e-commerce business from a single, intuitive dashboard — products, orders, shipping, marketing, and more.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {tools.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="group relative rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 sm:p-5 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300"
              >
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-sm mb-3 transition-transform group-hover:scale-110",
                  tool.color,
                )}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-sm font-semibold mb-1">{tool.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{tool.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
