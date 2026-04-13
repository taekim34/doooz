"use client";
import { Toaster as SonnerToaster, toast } from "sonner";

export function Toaster() {
  return <SonnerToaster position="top-center" richColors closeButton />;
}

export { toast };
