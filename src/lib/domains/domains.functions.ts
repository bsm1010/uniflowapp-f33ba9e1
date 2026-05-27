import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildDnsRecords, classifyDomain, LOVABLE_EDGE_IP, LOVABLE_CNAME_TARGET } from "./dns-records";

const addSchema = z.object({ domain: z.string().min(3).max(253) });
const idSchema = z.object({ id: z.string().uuid() });

function genToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function dohQuery(name: string, type: "A" | "CNAME" | "TXT" | "NS"): Promise<string[]> {
  try {
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`, {
      headers: { accept: "application/dns-json" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { Answer?: { data: string }[] };
    return (data.Answer ?? []).map((a) => a.data.replace(/^"|"$/g, ""));
  } catch {
    return [];
  }
}

async function detectProvider(rootDomain: string): Promise<string> {
  const ns = (await dohQuery(rootDomain, "NS")).join(" ").toLowerCase();
  if (ns.includes("cloudflare")) return "cloudflare";
  if (ns.includes("godaddy") || ns.includes("domaincontrol")) return "godaddy";
  if (ns.includes("namecheap") || ns.includes("registrar-servers")) return "namecheap";
  if (ns.includes("hostinger") || ns.includes("dns-parking")) return "hostinger";
  if (ns.includes("google")) return "google";
  if (ns.includes("ovh")) return "ovh";
  return "other";
}

export const addCustomDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => addSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const cls = classifyDomain(data.domain);
    if (!cls) throw new Error("Invalid domain format");

    const { data: profile } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
    if (!profile) throw new Error("Profile not found");

    // store_slug — use store_settings if available, else userId
    const { data: settings } = await supabase.from("store_settings").select("slug").eq("user_id", userId).maybeSingle();
    const slug = (settings as { slug?: string } | null)?.slug ?? userId;

    const token = genToken();
    const records = buildDnsRecords(cls.domain, cls.type, token);
    const provider = await detectProvider(cls.root);

    const { data: row, error } = await supabase
      .from("custom_domains")
      .insert({
        user_id: userId,
        store_slug: slug,
        domain: cls.domain,
        domain_type: cls.type,
        dns_records: records,
        verification_token: token,
        detected_provider: provider,
        status: "pending",
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return row;
  });

export const verifyCustomDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("custom_domains")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!row) throw new Error("Domain not found");

    const d = row as {
      id: string; domain: string; domain_type: string; verification_token: string;
    };

    // Check TXT
    const txtName = `_fennecly.${d.domain.split(".").slice(-2).join(".")}`;
    const txt = await dohQuery(txtName, "TXT");
    const txtOk = txt.some((t) => t.includes(`fennecly-verify=${d.verification_token}`));

    // Check A or CNAME
    let dnsOk = false;
    if (d.domain_type === "root") {
      const a = await dohQuery(d.domain, "A");
      dnsOk = a.includes(LOVABLE_EDGE_IP);
    } else {
      const cname = await dohQuery(d.domain, "CNAME");
      dnsOk = cname.some((c) => c.replace(/\.$/, "") === LOVABLE_CNAME_TARGET);
    }

    const verified = txtOk && dnsOk;
    const update = verified
      ? { status: "verified", ssl_active: true, verified_at: new Date().toISOString(), error_message: null, last_checked_at: new Date().toISOString() }
      : {
          status: "verifying",
          last_checked_at: new Date().toISOString(),
          error_message: !dnsOk
            ? `DNS ${d.domain_type === "root" ? "A" : "CNAME"} record not found or incorrect.`
            : "TXT verification record not found yet.",
        };

    await supabase.from("custom_domains").update(update).eq("id", d.id);
    return { verified, txtOk, dnsOk, ...update };
  });

export const listCustomDomains = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("custom_domains")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    return data ?? [];
  });

export const removeCustomDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("custom_domains")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    return { ok: true };
  });
