import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  ArrowRight,
  ArrowLeftRight,
  Navigation,
  Truck,
  Home,
  Building2,
  Lightbulb,
  AlertTriangle,
  ExternalLink,
  Locate,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ALGERIAN_WILAYAS } from "@/lib/algeriaWilayas";
import { ALGERIA_WILAYA_SHAPES, ALGERIA_MAP_WIDTH, ALGERIA_MAP_HEIGHT } from "@/lib/algeriaMapShapes";
import { useCurrentStore } from "@/hooks/use-current-store";

type DeliveryPrice = {
  company: string;
  homePrice: number | null;
  deskPrice: number | null;
  currency: string;
  error?: string;
};

// Approximate wilaya center coordinates [lat, lng]
const WILAYA_COORDS: Record<string, [number, number]> = {
  "Adrar": [27.87, -0.29],
  "Chlef": [36.17, 1.33],
  "Laghouat": [33.80, 2.88],
  "Oum El Bouaghi": [35.87, 7.11],
  "Batna": [35.56, 6.17],
  "Béjaïa": [36.75, 5.08],
  "Biskra": [34.85, 5.73],
  "Béchar": [31.62, -2.22],
  "Blida": [36.47, 2.83],
  "Bouira": [36.37, 3.90],
  "Tamanrasset": [22.79, 5.52],
  "Tébessa": [35.40, 8.12],
  "Tlemcen": [34.88, -1.31],
  "Tiaret": [35.37, 1.32],
  "Tizi Ouzou": [36.71, 4.05],
  "Alger": [36.75, 3.06],
  "Djelfa": [34.67, 3.25],
  "Jijel": [36.82, 5.77],
  "Sétif": [36.19, 5.41],
  "Saïda": [34.83, 0.15],
  "Skikda": [36.88, 6.91],
  "Sidi Bel Abbès": [35.19, -0.63],
  "Annaba": [36.90, 7.77],
  "Guelma": [36.46, 7.43],
  "Constantine": [36.37, 6.61],
  "Médéa": [36.27, 2.75],
  "Mostaganem": [35.93, 0.09],
  "M'Sila": [35.71, 4.54],
  "Mascara": [35.40, 0.14],
  "Ouargla": [31.95, 5.33],
  "Oran": [35.70, -0.64],
  "El Bayadh": [33.68, 1.02],
  "Illizi": [26.50, 8.47],
  "Bordj Bou Arréridj": [36.07, 4.76],
  "Boumerdès": [36.75, 3.48],
  "El Tarf": [36.77, 8.31],
  "Tindouf": [27.67, -8.13],
  "Tissemsilt": [35.61, 1.81],
  "El Oued": [33.35, 6.85],
  "Khenchela": [35.43, 7.14],
  "Souk Ahras": [36.29, 7.95],
  "Tipaza": [36.59, 2.45],
  "Mila": [36.45, 6.26],
  "Aïn Defla": [36.26, 1.97],
  "Naâma": [33.27, -0.31],
  "Aïn Témouchent": [35.30, -1.14],
  "Ghardaïa": [32.49, 3.67],
  "Relizane": [35.74, 0.56],
  "Timimoun": [29.26, 0.23],
  "Bordj Badji Mokhtar": [21.33, -0.95],
  "Ouled Djellal": [34.42, 5.07],
  "Béni Abbès": [30.13, -2.17],
  "In Salah": [27.19, 2.48],
  "In Guezzam": [19.57, 3.46],
  "Touggourt": [33.10, 6.06],
  "Djanet": [24.55, 9.48],
  "El M'Ghair": [33.95, 5.93],
  "El Meniaa": [30.58, 2.88],
};

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function getEstimatedDays(distance: number): string {
  if (distance < 200) return "1-2 أيام";
  if (distance <= 500) return "2-3 أيام";
  return "3-5 أيام";
}

function MapComponent({
  originWilaya,
  destinationWilaya,
  onWilayaClick,
}: {
  originWilaya: string | null;
  destinationWilaya: string | null;
  onWilayaClick: (name: string) => void;
}) {
  const getWilayaStyle = useCallback(
    (name: string) => {
      if (name === originWilaya)
        return {
          fillColor: "#7C3AED",
          fillOpacity: 0.7,
          color: "#5B21B6",
          weight: 2,
        };
      if (name === destinationWilaya)
        return {
          fillColor: "#F59E0B",
          fillOpacity: 0.7,
          color: "#D97706",
          weight: 2,
        };
      return {
        fillColor: "#EDE9FE",
        fillOpacity: 0.5,
        color: "#C4B5FD",
        weight: 1,
      };
    },
    [originWilaya, destinationWilaya],
  );

  return (
    <div className="h-full rounded-xl overflow-hidden border border-border/60 bg-slate-50 dark:bg-slate-900">
      <svg
        viewBox={`0 0 ${ALGERIA_MAP_WIDTH} ${ALGERIA_MAP_HEIGHT}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {ALGERIA_WILAYA_SHAPES.map((wilaya) => {
          const style = getWilayaStyle(wilaya.name);
          return (
            <g key={wilaya.code}>
              <path
                d={wilaya.d}
                fill={style.fillColor}
                fillOpacity={style.fillOpacity}
                stroke={style.color}
                strokeWidth={style.weight}
                className="cursor-pointer transition-all hover:fill-opacity-80"
                onClick={() => onWilayaClick(wilaya.name)}
              >
                <title>{wilaya.name}</title>
              </path>
              <text
                x={wilaya.cx}
                y={wilaya.cy}
                textAnchor="middle"
                fontSize="14"
                fill="#374151"
                className="pointer-events-none select-none font-medium"
              >
                {wilaya.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function DeliveryMapPage() {
  const { t } = useTranslation();
  const { currentStore } = useCurrentStore();
  const [originWilaya, setOriginWilaya] = useState<string | null>(null);
  const [destinationWilaya, setDestinationWilaya] = useState<string | null>(
    null,
  );
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [prices, setPrices] = useState<DeliveryPrice[]>([]);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [connectedCompanies, setConnectedCompanies] = useState<any[]>([]);

  // Detect location
  const detectLocation = useCallback(() => {
    setLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ar`,
            { headers: { "User-Agent": "Fennecly/1.0 (fennecly.online)" } },
          );
          const data = await res.json();
          const wilayaName = data.address?.state
            ?.replace("ولاية ", "")
            ?.replace("Wilaya de ", "")
            ?.trim();
          const matched = ALGERIAN_WILAYAS.find(
            (w) =>
              w.toLowerCase().includes(wilayaName?.toLowerCase() ?? "") ||
              wilayaName?.toLowerCase().includes(w.toLowerCase()),
          );
          setOriginWilaya(matched ?? wilayaName);
        } catch {
          setLocationError(
            "Could not detect location. Please select your wilaya manually.",
          );
        }
        setLocationLoading(false);
      },
      () => {
        setLocationError(
          "Location access denied. Select your wilaya manually.",
        );
        setLocationLoading(false);
      },
      { timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  // Load connected delivery companies
  useEffect(() => {
    if (!currentStore?.id) return;
    supabase
      .from("store_delivery_companies" as any)
      .select("company_id, enabled, delivery_companies(name)")
      .eq("store_id", currentStore.id)
      .eq("enabled", true)
      .then(({ data }) => {
        setConnectedCompanies(data ?? []);
      });
  }, [currentStore?.id]);

  const handleWilayaClick = useCallback(
    async (wilayaName: string) => {
      if (!originWilaya || wilayaName === originWilaya) return;
      setDestinationWilaya(wilayaName);
      setPricesLoading(true);
      setPrices([]);

      if (!connectedCompanies.length || !currentStore?.id) {
        setPricesLoading(false);
        return;
      }

      const results: DeliveryPrice[] = [];
      for (const company of connectedCompanies) {
        const companyName =
          (company as any).delivery_companies?.name ?? "Unknown";
        results.push({
          company: companyName,
          homePrice: null,
          deskPrice: null,
          currency: "DA",
          error: "Pricing not available via API",
        });
      }
      setPrices(results);
      setPricesLoading(false);
    },
    [originWilaya, connectedCompanies, currentStore?.id],
  );

  const distance = useMemo(() => {
    if (!originWilaya || !destinationWilaya) return null;
    const o = WILAYA_COORDS[originWilaya];
    const d = WILAYA_COORDS[destinationWilaya];
    if (!o || !d) return null;
    return haversineDistance(o[0], o[1], d[0], d[1]);
  }, [originWilaya, destinationWilaya]);

  const bestHome = useMemo(
    () =>
      prices
        .filter((p) => p.homePrice != null)
        .sort((a, b) => (a.homePrice ?? Infinity) - (b.homePrice ?? Infinity))[0],
    [prices],
  );

  const bestDesk = useMemo(
    () =>
      prices
        .filter((p) => p.deskPrice != null)
        .sort((a, b) => (a.deskPrice ?? Infinity) - (b.deskPrice ?? Infinity))[0],
    [prices],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={MapPin}
        title={t("apps.deliveryMap.title", "Delivery Price Map")}
        description={t(
          "apps.deliveryMap.subtitle",
          "Click any wilaya to see delivery prices",
        )}
        gradient="from-emerald-500/20 to-teal-500/20"
        actions={
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://www.google.com/maps"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-1.5" />
              Open in Google Maps
            </a>
          </Button>
        }
      />

      {/* Origin selector */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Navigation className="h-4 w-4 text-violet-600" />
              {t("apps.deliveryMap.origin", "From")}:
            </div>
            <div className="flex-1 max-w-xs">
              <SearchableSelect
                options={[...ALGERIAN_WILAYAS]}
                value={originWilaya ?? ""}
                onChange={(v: string) => setOriginWilaya(v)}
                placeholder={t(
                  "apps.deliveryMap.selectOrigin",
                  "اختر ولايتك...",
                )}
              />
            </div>
            {locationLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {locationError && (
              <p className="text-xs text-amber-600">{locationError}</p>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={detectLocation}
              disabled={locationLoading}
            >
              <Locate className="h-4 w-4 mr-1.5" />
              {t("apps.deliveryMap.detect", "Auto-detect")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Map — left 60% */}
        <div className="lg:col-span-3 h-[400px] lg:h-[600px]">
          <MapComponent
            originWilaya={originWilaya}
            destinationWilaya={destinationWilaya}
            onWilayaClick={handleWilayaClick}
          />
        </div>

        {/* Price panel — right 40% */}
        <div className="lg:col-span-2 space-y-4">
          {/* Route display */}
          {originWilaya && destinationWilaya && (
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/60">
              <Badge variant="outline" className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 px-3 py-1.5 text-sm font-semibold">
                {originWilaya}
              </Badge>
              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-3 py-1.5 text-sm font-semibold">
                {destinationWilaya}
              </Badge>
            </div>
          )}

          {/* Distance info */}
          {distance !== null && (
            <div className="text-center text-sm text-muted-foreground py-2">
              {t("apps.deliveryMap.estimatedDistance", "Estimated distance")}:{" "}
              <span className="font-semibold text-foreground">~{distance} km</span>{" "}
              • {t("apps.deliveryMap.estimatedTime", "Estimated delivery time")}:{" "}
              <span className="font-semibold text-foreground">
                {getEstimatedDays(distance)}
              </span>
            </div>
          )}

          {/* Empty state */}
          {!destinationWilaya && (
            <Card className="border-border/60">
              <CardContent className="p-12 text-center">
                <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-4">
                  <MapPin className="h-7 w-7 text-emerald-600" />
                </div>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {t(
                    "apps.deliveryMap.clickWilaya",
                    "Click any wilaya on the map to see delivery prices",
                  )}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Loading */}
          {pricesLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          )}

          {/* No companies */}
          {!pricesLoading &&
            destinationWilaya &&
            !prices.length &&
            !connectedCompanies.length && (
              <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2">
                    {t(
                      "apps.deliveryMap.noCompanies",
                      "No delivery company connected",
                    )}
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/dashboard/shipments">
                      <Truck className="h-4 w-4 mr-1.5" />
                      {t(
                        "apps.deliveryMap.connectCompany",
                        "Connect a delivery company",
                      )}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}

          {/* Price cards */}
          {prices.map((price) => (
            <Card key={price.company} className="border-border/60">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                    <Truck className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h4 className="font-semibold">{price.company}</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Home className="h-4 w-4" />
                      {t("apps.deliveryMap.homeDelivery", "Home delivery")}
                    </div>
                    <span className="font-semibold">
                      {price.homePrice != null
                        ? `${price.homePrice} ${price.currency}`
                        : price.error ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      {t("apps.deliveryMap.stopDesk", "Stop desk")}
                    </div>
                    <span className="font-semibold">
                      {price.deskPrice != null
                        ? `${price.deskPrice} ${price.currency}`
                        : price.error ?? "—"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Best prices summary */}
          {!pricesLoading && (bestHome || bestDesk) && (
            <Card className="border-violet-200 bg-violet-50 dark:bg-violet-950/20 dark:border-violet-800">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-5 w-5 text-violet-600" />
                  <h4 className="font-semibold text-sm">
                    {t("apps.deliveryMap.bestPrices", "Best prices")}
                  </h4>
                </div>
                <div className="space-y-1 text-sm">
                  {bestHome && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {t("apps.deliveryMap.homeDelivery", "Home delivery")}:
                      </span>
                      <span className="font-semibold">
                        {bestHome.company} — {bestHome.homePrice}{" "}
                        {bestHome.currency} ✅
                      </span>
                    </div>
                  )}
                  {bestDesk && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {t("apps.deliveryMap.stopDesk", "Stop desk")}:
                      </span>
                      <span className="font-semibold">
                        {bestDesk.company} — {bestDesk.deskPrice}{" "}
                        {bestDesk.currency} ✅
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/dashboard/apps/delivery-map")({
  component: DeliveryMapPage,
});
