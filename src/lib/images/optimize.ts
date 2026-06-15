const SUPABASE_STORAGE_RE =
  /^(https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/([^/]+)\/(.+))$/i;

export function optimizeImageUrl(
  url: string | null | undefined,
  opts: { width?: number; height?: number; quality?: number } = {},
): string | null {
  if (!url) return null;
  const m = url.match(SUPABASE_STORAGE_RE);
  if (!m) return url;
  const params: string[] = [];
  if (opts.width) params.push(`width=${opts.width}`);
  if (opts.height) params.push(`height=${opts.height}`);
  if (opts.quality) params.push(`quality=${opts.quality}`);
  if (params.length === 0) return url;
  const qs = params.join("&");
  const base = url.replace(/\/storage\/v1\/object\/public\//, "/storage/v1/render/image/public/");
  return `${base}?${qs}`;
}
