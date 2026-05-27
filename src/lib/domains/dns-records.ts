// DNS configuration for custom domains. Edge IP matches Lovable hosting layer.
export const LOVABLE_EDGE_IP = "185.158.133.1";
export const LOVABLE_CNAME_TARGET = "cname.fennecly.app";

export type DnsRecord = {
  type: "A" | "CNAME" | "TXT";
  name: string;
  value: string;
  ttl: number;
  description: string;
};

export type DomainType = "root" | "www" | "subdomain";

export function classifyDomain(raw: string): { domain: string; type: DomainType; subdomain?: string; root: string } | null {
  const cleaned = raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(cleaned)) return null;
  const parts = cleaned.split(".");
  if (parts.length === 2) return { domain: cleaned, type: "root", root: cleaned };
  if (parts.length === 3 && parts[0] === "www") {
    return { domain: cleaned, type: "www", root: parts.slice(1).join(".") };
  }
  return { domain: cleaned, type: "subdomain", subdomain: parts[0], root: parts.slice(-2).join(".") };
}

export function buildDnsRecords(domain: string, type: DomainType, token: string): DnsRecord[] {
  const records: DnsRecord[] = [];
  if (type === "root") {
    records.push({
      type: "A",
      name: "@",
      value: LOVABLE_EDGE_IP,
      ttl: 3600,
      description: "Points your root domain to Fennecly's edge network.",
    });
  } else if (type === "www") {
    records.push({
      type: "CNAME",
      name: "www",
      value: LOVABLE_CNAME_TARGET,
      ttl: 3600,
      description: "Routes www traffic to your Fennecly storefront.",
    });
  } else {
    const sub = domain.split(".")[0];
    records.push({
      type: "CNAME",
      name: sub,
      value: LOVABLE_CNAME_TARGET,
      ttl: 3600,
      description: `Routes ${sub} traffic to your Fennecly storefront.`,
    });
  }
  records.push({
    type: "TXT",
    name: "_fennecly",
    value: `fennecly-verify=${token}`,
    ttl: 3600,
    description: "Proves you own this domain.",
  });
  return records;
}

export const PROVIDER_GUIDES: Record<string, { name: string; url: string; color: string }> = {
  cloudflare: { name: "Cloudflare", url: "https://dash.cloudflare.com", color: "#F38020" },
  godaddy: { name: "GoDaddy", url: "https://dcc.godaddy.com/control/portfolio", color: "#1BDBDB" },
  namecheap: { name: "Namecheap", url: "https://ap.www.namecheap.com/domains/list", color: "#DE3910" },
  hostinger: { name: "Hostinger", url: "https://hpanel.hostinger.com/domains", color: "#673DE6" },
  google: { name: "Google Domains", url: "https://domains.google.com", color: "#4285F4" },
  ovh: { name: "OVH", url: "https://www.ovh.com/manager", color: "#123F6D" },
  other: { name: "Your provider", url: "", color: "#6366F1" },
};
