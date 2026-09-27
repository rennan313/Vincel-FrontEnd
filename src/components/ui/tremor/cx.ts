// Vendorizado de https://github.com/tremorlabs/tremor (src/utils/cx.ts
// [v0.0.0], Apache-2.0) — inalterado.

import clsx, { type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cx(...args: ClassValue[]) {
  return twMerge(clsx(...args))
}
