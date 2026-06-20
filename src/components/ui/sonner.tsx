import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl group-[.toaster]:border group-[.toaster]:pl-5 group-[.toaster]:relative group-[.toaster]:overflow-hidden",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toast]:border-l-0",
          error: "group-[.toast]:border-l-0",
          info: "group-[.toast]:border-l-0",
          warning: "group-[.toast]:border-l-0",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
