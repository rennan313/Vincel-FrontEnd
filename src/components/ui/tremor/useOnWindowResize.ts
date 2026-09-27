// Vendorizado de https://github.com/tremorlabs/tremor
// (src/hooks/useOnWindowResize.ts [v0.0.2], Apache-2.0) — inalterado.

import * as React from "react"

export const useOnWindowResize = (handler: () => void) => {
  React.useEffect(() => {
    const handleResize = () => {
      handler()
    }
    handleResize()
    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)
  }, [handler])
}
