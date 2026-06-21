import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCallLog } from "@/hooks/use-call-log";
import { buildWhatsAppCallUrl } from "@/lib/whatsapp";
import { CallOutcomeModal } from "./CallOutcomeModal";
import { cn } from "@/lib/utils";

interface WhatsAppCallButtonProps {
  customerPhone: string;
  customerName: string;
  orderId: string;
  orderNumber: string;
  size?: "sm" | "md";
}

export function WhatsAppCallButton({
  customerPhone,
  customerName,
  orderId,
  orderNumber,
  size = "sm",
}: WhatsAppCallButtonProps) {
  const { logCall, getLastCall } = useCallLog();
  const [lastCall, setLastCall] = useState<{
    outcome: string;
    called_at: string;
    channel: string;
  } | null>(null);
  const [callLogId, setCallLogId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    getLastCall(orderId)
      .then(setLastCall)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const handleClick = async () => {
    try {
      const id = await logCall({
        orderId,
        customerPhone,
        customerName,
        channel: "whatsapp",
      });
      setCallLogId(id);
      window.open(buildWhatsAppCallUrl(customerPhone), "_blank");
      if (id) setTimeout(() => setModalOpen(true), 1500);
    } catch {
      // silently fail — still open WhatsApp
      window.open(buildWhatsAppCallUrl(customerPhone), "_blank");
    }
  };

  const handleOutcomeLogged = () => {
    getLastCall(orderId)
      .then(setLastCall)
      .catch(() => {});
  };

  const dotColor = (() => {
    if (!lastCall || lastCall.outcome === "pending") return null;
    switch (lastCall.outcome) {
      case "answered":
        return "bg-emerald-500";
      case "no_answer":
        return "bg-rose-500";
      case "callback":
        return "bg-amber-500";
      default:
        return null;
    }
  })();

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const btnSize = size === "sm" ? "h-7 w-7" : "h-9 w-9";

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                btnSize,
                "rounded-lg hover:bg-[#25D366]/10 relative shrink-0",
              )}
              onClick={handleClick}
            >
              <MessageCircle className={cn(iconSize)} style={{ color: "#25D366" }} />
              {dotColor && (
                <span
                  className={cn(
                    "absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-background",
                    dotColor,
                  )}
                />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent sideOffset={4}>Call via WhatsApp</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {callLogId && (
        <CallOutcomeModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          callLogId={callLogId}
          customerName={customerName}
          onOutcomeLogged={handleOutcomeLogged}
        />
      )}
    </>
  );
}
