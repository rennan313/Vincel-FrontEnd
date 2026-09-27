// Vendorizado de https://github.com/tremorlabs/tremor
// (src/utils/getYAxisDomain.ts [v0.0.0], Apache-2.0) — inalterado.

export const getYAxisDomain = (
  autoMinValue: boolean,
  minValue: number | undefined,
  maxValue: number | undefined,
) => {
  const minDomain = autoMinValue ? "auto" : (minValue ?? 0)
  const maxDomain = maxValue ?? "auto"
  return [minDomain, maxDomain]
}
