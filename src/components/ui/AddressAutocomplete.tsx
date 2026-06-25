import { useEffect, useRef } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { useAddressAutocomplete } from "@/hooks/use-address-autocomplete";

type ParsedAddress = {
  street: string;
  city: string;
  wilaya: string;
  postalCode: string;
  full: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: ParsedAddress) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
  disabled?: boolean;
  dir?: "ltr" | "rtl";
};

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <span key={i} className="font-bold underline">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  style,
  className,
  disabled,
  dir = "ltr",
}: Props) {
  const { query, setQuery, suggestions, loading, open, select, close, reveal } =
    useAddressAutocomplete();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value, setQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [close]);

  const handleSelect = (item: ParsedAddress) => {
    const selected = select(item);
    onChange(selected.street || selected.full);
    onSelect(selected);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className ?? ""}`} dir={dir}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          onFocus={reveal}
          placeholder={placeholder}
          disabled={disabled}
          style={style}
          className="pr-8"
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin opacity-50" />
          ) : (
            <MapPin className="h-4 w-4 opacity-40" />
          )}
        </div>
      </div>

      {open && suggestions.length > 0 && (
        <div
          className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg overflow-hidden max-h-60 overflow-y-auto"
          dir="ltr"
        >
          {suggestions.map((item, i) => (
            <button
              key={`${item.full}-${i}`}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent transition-colors border-b last:border-b-0"
            >
              <div className="truncate text-foreground">
                {highlightMatch(item.street || item.full, query)}
              </div>
              {(item.city || item.wilaya) && (
                <div className="text-xs text-muted-foreground mt-0.5 truncate">
                  {[item.city, item.wilaya].filter(Boolean).join(", ")}
                  {item.postalCode ? ` • ${item.postalCode}` : ""}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
