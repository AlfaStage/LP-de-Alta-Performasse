
"use client";

import { Toaster as ShadCNToaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";

export function ClientOnlyToaster() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return <ShadCNToaster />;
}
