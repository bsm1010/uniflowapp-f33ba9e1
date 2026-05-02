/**
 * Dynamically loads Google Fonts needed for storefront themes.
 * Called once when a storefront mounts — avoids blocking the landing page
 * with 16 font families that aren't needed there.
 */

const STOREFRONT_FONTS_URL =
  "https://fonts.googleapis.com/css2?" +
  [
    "family=Playfair+Display:wght@400;600;800",
    "family=DM+Serif+Display",
    "family=JetBrains+Mono:wght@400;600",
    "family=Manrope:wght@400;600;800",
    "family=Sora:wght@400;600;800",
    "family=Outfit:wght@400;600;800",
    "family=Bricolage+Grotesque:wght@400;600;800",
    "family=Fraunces:wght@400;600;800",
    "family=Cormorant+Garamond:wght@400;600;700",
    "family=IBM+Plex+Sans:wght@400;500;700",
    "family=Bebas+Neue",
    "family=Archivo+Black",
    "family=Syne:wght@500;700;800",
    "family=Plus+Jakarta+Sans:wght@400;600;800",
  ].join("&") +
  "&display=swap";

let loaded = false;

export function loadStorefrontFonts() {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = STOREFRONT_FONTS_URL;
  document.head.appendChild(link);
}
