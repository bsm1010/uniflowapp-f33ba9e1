import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const COMPANIES = [
  { name: "Maystro Delivery", is_active: true },
  { name: "Sherpa", is_active: true },
  { name: "Eco Courier", is_active: true },
  { name: "Anderson", is_active: true },
  { name: "Guepex", is_active: true },
  { name: "DHD", is_active: true },
  { name: "Chronorex", is_active: true },
];

export const Route = createFileRoute("/api/seed-delivery-companies")({
  server: {
    handlers: {
      GET: async () => {
        try {
          for (const company of COMPANIES) {
            const { data: existing } = await supabaseAdmin
              .from("delivery_companies")
              .select("id")
              .eq("name", company.name)
              .maybeSingle();
            if (existing) continue;
            const { error } = await supabaseAdmin
              .from("delivery_companies")
              .insert(company);
            if (error) {
              return new Response(JSON.stringify({ ok: false, error: error.message }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
              });
            }
          }
          return new Response(
            JSON.stringify({ ok: true, message: "Delivery companies seeded successfully." }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Unknown error";
          return new Response(JSON.stringify({ ok: false, error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
