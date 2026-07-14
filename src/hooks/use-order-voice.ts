import { useEffect, useRef, useCallback } from "react";

type OrderAnnouncement = {
  orderNumber: string | number;
  customerName: string;
  wilaya: string;
  total: number;
  paymentMethod?: string;
  productNames?: string[];
};

function getSettings() {
  try {
    return {
      enabled: localStorage.getItem("fennecly_voice_enabled") === "true",
      lang: localStorage.getItem("fennecly_voice_lang") ?? "ar",
      mode: localStorage.getItem("fennecly_voice_mode") ?? "short",
      volume: parseFloat(localStorage.getItem("fennecly_voice_volume") ?? "1"),
      rate: parseFloat(localStorage.getItem("fennecly_voice_rate") ?? "0.9"),
    };
  } catch {
    return { enabled: false, lang: "ar", mode: "short", volume: 1, rate: 0.9 };
  }
}

function buildAnnouncementText(
  order: OrderAnnouncement,
  lang: string,
  mode: string,
): string {
  const amount = `${order.total.toLocaleString()} دينار`;

  if (lang === "ar") {
    if (mode === "short") {
      return `طلب جديد من ${order.customerName} في ${order.wilaya} — ${amount}`;
    }
    return [
      `طلب جديد رقم ${order.orderNumber}`,
      `العميل: ${order.customerName}`,
      `الولاية: ${order.wilaya}`,
      order.productNames?.length
        ? `المنتج: ${order.productNames.slice(0, 2).join(" و ")}`
        : "",
      `المبلغ: ${amount}`,
      order.paymentMethod === "cod"
        ? "الدفع عند الاستلام"
        : "تم الدفع إلكترونياً",
    ]
      .filter(Boolean)
      .join(". ");
  }

  if (lang === "fr") {
    if (mode === "short") {
      return `Nouvelle commande de ${order.customerName} à ${order.wilaya} — ${amount}`;
    }
    return `Nouvelle commande numéro ${order.orderNumber}. Client: ${order.customerName}. Wilaya: ${order.wilaya}. Montant: ${amount}.`;
  }

  if (mode === "short") {
    return `New order from ${order.customerName} in ${order.wilaya} — ${amount}`;
  }
  return `New order number ${order.orderNumber} from ${order.customerName} in ${order.wilaya}. Amount: ${amount}.`;
}

export function useOrderVoice() {
  const synth =
    typeof window !== "undefined" ? window.speechSynthesis : null;
  const queueRef = useRef<SpeechSynthesisUtterance[]>([]);
  const isSpeakingRef = useRef(false);

  const playNext = useCallback(() => {
    if (!synth || queueRef.current.length === 0) {
      isSpeakingRef.current = false;
      return;
    }
    isSpeakingRef.current = true;
    const utterance = queueRef.current.shift()!;
    utterance.onend = () => playNext();
    utterance.onerror = () => playNext();
    synth.speak(utterance);
  }, [synth]);

  const announceOrder = useCallback(
    (order: OrderAnnouncement) => {
      const settings = getSettings();
      if (!settings.enabled || !synth) return;

      if (queueRef.current.length > 3) {
        synth.cancel();
        queueRef.current = [];
        isSpeakingRef.current = false;
      }

      const text = buildAnnouncementText(
        order,
        settings.lang,
        settings.mode,
      );
      const utterance = new SpeechSynthesisUtterance(text);

      utterance.lang =
        settings.lang === "ar"
          ? "ar-DZ"
          : settings.lang === "fr"
            ? "fr-FR"
            : "en-US";
      utterance.volume = settings.volume;
      utterance.rate = settings.rate;
      utterance.pitch = 1;

      const voices = synth.getVoices();
      const langPrefix =
        settings.lang === "ar" ? "ar" : settings.lang === "fr" ? "fr" : "en";
      const preferredVoice = voices.find((v) =>
        v.lang.startsWith(langPrefix),
      );
      if (preferredVoice) utterance.voice = preferredVoice;

      queueRef.current.push(utterance);
      if (!isSpeakingRef.current) playNext();
    },
    [synth, playNext],
  );

  const testVoice = useCallback(() => {
    announceOrder({
      orderNumber: "4821",
      customerName: "كريم بن علي",
      wilaya: "وهران",
      total: 3200,
      paymentMethod: "cod",
      productNames: ["جاكيت كحلي مقاس L"],
    });
  }, [announceOrder]);

  const isEnabled = useCallback(() => {
    try {
      return localStorage.getItem("fennecly_voice_enabled") === "true";
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!synth) return;
    if (synth.getVoices().length === 0) {
      const handler = () => {};
      synth.addEventListener("voiceschanged", handler, { once: true });
    }
    return () => {
      synth.cancel();
    };
  }, [synth]);

  return { announceOrder, testVoice, isEnabled };
}
