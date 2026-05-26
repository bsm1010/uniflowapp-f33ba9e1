import { supabaseAdmin } from "@/integrations/supabase/client.server";

const COMPANIES = [
  { name: "Maystro Delivery", api_key: "", is_active: true },
  { name: "Sherpa", api_key: "", is_active: true },
  { name: "Eco Courier", api_key: "", is_active: true },
];

export async function GET() {
  try {
    for (const company of COMPANIES) {
      const { error } = await supabaseAdmin
        .from("delivery_companies")
        .upsert(company, { onConflict: "name", ignoreDuplicates: true });
      if (error) {
        return new Response(JSON.stringify({ ok: false, error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    return new Response(
      JSON.stringify({ ok: true, message: "Delivery companies seeded successfully." }),
      { status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
