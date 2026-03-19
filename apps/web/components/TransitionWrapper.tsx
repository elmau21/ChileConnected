"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function TransitionWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <main key={pathname} className="fade-up" style={{ marginTop: 24, flex: 1 }}>
      {children}
    </main>
  );
}
