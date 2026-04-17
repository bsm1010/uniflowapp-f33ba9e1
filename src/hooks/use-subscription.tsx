import { createContext, useContext, type ReactNode } from "react";

interface SubscriptionContextValue {
  status: string;
  isExpired: boolean;
  daysRemaining: number;
  /** True if the user previously had a paid subscription (now expired) */
  hadPaidSubscription?: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(
  undefined,
);

export function SubscriptionProvider({
  value,
  children,
}: {
  value: SubscriptionContextValue;
  children: ReactNode;
}) {
  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    return {
      status: "trial",
      isExpired: false,
      daysRemaining: 0,
      hadPaidSubscription: false,
    };
  }
  return ctx;
}
