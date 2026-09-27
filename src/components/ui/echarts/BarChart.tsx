import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import { BarChart as EChartsBarSeries } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { ComposeOption } from 'echarts/core'
import type { BarSeriesOption } from 'echarts/charts'
import type { GridComponentOption, TooltipComponentOption } from 'echarts/components'
import { useThemeStore } from '@/store/themeStore'

// Só registra os módulos que realmente usamos (barra + grid + tooltip,
// renderer canvas) — o pacote `echarts` completo inclui muitos tipos de
// gráfico/componentes (mapa, pizza, 3D, ...) que não usamos aqui.
echarts.use([EChartsBarSeries, GridComponent, TooltipComponent, CanvasRenderer])

type EChartsOption = ComposeOption<BarSeriesOption | GridComponentOption | TooltipComponentOption>

/** Lê um design token de cor (`--th-text`, `--chart-1`, ...) já resolvido
 * pro tema atual — ECharts desenha em canvas, então precisa da cor literal
 * (não entende `var(--x)` como o CSS/Tailwind do resto do app entende). */
function readCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

interface BarChartProps {
  data: Record<string, string | number>[]
  index: string
  categories: string[]
  /** Nomes de custom properties de cor (ex.: '--chart-1'), uma por categoria
   * em `categories`, na mesma ordem — nunca reatribuídas por dado, ver o
   * comentário da paleta em index.css. */
  colors?: string[]
  valueFormatter?: (value: number) => string
  className?: string
}

const DEFAULT_COLOR_VARS = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5', '--chart-6']

/** Gráfico de barras baseado no Apache ECharts (import modular: só barra +
 * grid + tooltip + renderer canvas). Cores/eixos são recalculados a cada
 * render a partir dos nossos design tokens (`--th-*`/`--chart-*`), inclusive
 * quando o tema muda — diferente de um SVG/Tailwind puro, o canvas do
 * ECharts não segue `var(--x)` sozinho. */
export function BarChart({ data, index, categories, colors = DEFAULT_COLOR_VARS, valueFormatter, className }: BarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const chart = echarts.init(el)
    chartRef.current = chart

    const resizeObserver = new ResizeObserver(() => chart.resize())
    resizeObserver.observe(el)

    return () => {
      resizeObserver.disconnect()
      chart.dispose()
      chartRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init/dispose só no mount/unmount; dados/tema são aplicados no efeito abaixo via setOption.
  }, [])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    const textMuted = readCssVar('--th-text-muted')
    const border = readCssVar('--th-border')
    const bgCard = readCssVar('--th-bg-card')
    const text = readCssVar('--th-text')
    const format = valueFormatter ?? ((value: number) => value.toLocaleString('pt-BR'))

    const option: EChartsOption = {
      grid: { left: 8, right: 8, top: 16, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        borderWidth: 0,
        backgroundColor: 'transparent',
        padding: 0,
        extraCssText: 'box-shadow: none;',
        formatter: (params) => {
          const rows = (Array.isArray(params) ? params : [params])
            .map(
              (p) => `
                <div style="display:flex;align-items:center;gap:8px;font-size:13px;">
                  <span style="width:8px;height:8px;border-radius:9999px;flex-shrink:0;background:${String(p.color)}"></span>
                  <span style="font-weight:600;color:${text}">${format(Number(p.value))}</span>
                  <span style="color:${textMuted}">${String(p.seriesName)}</span>
                </div>`,
            )
            .join('')
          return `<div style="border:1px solid ${border};background:${bgCard};border-radius:8px;padding:8px 12px;box-shadow:0 10px 15px -3px rgb(0 0 0 / 0.3);">${rows}</div>`
        },
      },
      xAxis: {
        type: 'category',
        data: data.map((row) => String(row[index])),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: border } },
        axisLabel: { color: textMuted, fontSize: 12 },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: border } },
        axisLabel: { color: textMuted, fontSize: 12, formatter: (value: number) => format(value) },
      },
      series: categories.map((category, i) => ({
        name: category,
        type: 'bar',
        data: data.map((row) => Number(row[category])),
        color: readCssVar(colors[i % colors.length] ?? '--chart-1'),
        barMaxWidth: 56,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
      })),
    }

    chart.setOption(option, { notMerge: true })
  }, [data, index, categories, colors, valueFormatter, theme])

  return <div ref={containerRef} className={className} />
}
