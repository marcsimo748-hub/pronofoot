"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/** Notifications toast (sonner) — thème sombre PRONOFOOT */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        style: {
          background: "hsl(240 10% 6%)",
          border: "1px solid hsl(240 8% 14%)",
          color: "hsl(0 0% 98%)",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
