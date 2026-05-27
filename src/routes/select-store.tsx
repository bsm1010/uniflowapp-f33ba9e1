import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Route = createFileRoute("/select-store")({
  component: SelectStorePage,
});

function SelectStorePage() {
  const navigate = useNavigate();

  // TEMPORARY fake stores
  // later replace with Supabase data
  const stores = [
    {
      id: "1",
      name: "BESSSSAM's Store",
      orders: 155,
    },
    {
      id: "2",
      name: "Second Store",
      orders: 0,
    },
  ];

  const handleSelectStore = (storeId: string) => {
    localStorage.setItem("selectedStore", storeId);

    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-600 text-white text-xl font-bold mb-4">
            F
          </div>

          <h1 className="text-4xl font-bold tracking-tight">
            Select Your Store
          </h1>

          <p className="text-muted-foreground mt-3">
            Choose which store you want to manage
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stores.map((store) => (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              key={store.id}
              onClick={() => handleSelectStore(store.id)}
              className="rounded-3xl border bg-card p-6 text-left transition-all hover:border-purple-500 hover:shadow-xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-lg font-bold mb-5">
                {store.name.charAt(0)}
              </div>

              <h2 className="text-xl font-semibold">
                {store.name}
              </h2>

              <p className="text-sm text-muted-foreground mt-2">
                {store.orders} orders
              </p>
            </motion.button>
          ))}

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-3xl border-2 border-dashed p-6 flex flex-col items-center justify-center text-muted-foreground hover:border-purple-500 hover:text-purple-500 transition-all"
          >
            <div className="text-5xl mb-2">+</div>

            <span className="font-medium">
              Create New Store
            </span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
