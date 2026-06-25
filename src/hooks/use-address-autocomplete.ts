import { useEffect, useRef, useState } from "react";

type NominatimResult = {
  place_id: number;
  display_name: string;
  address: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country_code?: string;
  };
  lat: string;
  lon: string;
};

type ParsedAddress = {
  street: string;
  city: string;
  wilaya: string;
  postalCode: string;
  full: string;
};

const DEBOUNCE_MS = 350;
const MIN_CHARS = 3;
const USER_AGENT = "Fennecly/1.0 (address-autocomplete)";

function parseAddress(result: NominatimResult): ParsedAddress {
  const a = result.address;
  const road = [a.road, a.house_number].filter(Boolean).join(" ") || "";
  const city = a.city || a.town || a.village || "";
  const wilaya = a.state || "";
  const postalCode = a.postcode || "";
  const full = result.display_name;
  return { street: road, city, wilaya, postalCode, full };
}

export function useAddressAutocomplete() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ParsedAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const trimmed = query.trim();
    if (trimmed.length < MIN_CHARS) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    timerRef.current = setTimeout(() => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      const params = new URLSearchParams({
        q: trimmed,
        format: "json",
        countrycodes: "dz",
        addressdetails: "1",
        limit: "5",
      });

      fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { "User-Agent": USER_AGENT },
        signal: controller.signal,
      })
        .then((r) => r.json())
        .then((data: NominatimResult[]) => {
          const parsed = data.map(parseAddress);
          setSuggestions(parsed);
          setOpen(parsed.length > 0);
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            setSuggestions([]);
            setOpen(false);
          }
        })
        .finally(() => setLoading(false));
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  const select = (item: ParsedAddress) => {
    setQuery(item.street || item.full);
    setOpen(false);
    return item;
  };

  const close = () => setOpen(false);
  const reveal = () => {
    if (suggestions.length > 0) setOpen(true);
  };

  return { query, setQuery, suggestions, loading, open, select, close, reveal };
}
