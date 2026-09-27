import { useEffect, useRef, type RefObject } from 'react'
import * as echarts from 'echarts/core'
import { BarChart as EChartsBarSeries, PieChart as EChartsPieSeries } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// Só registra os módulos que os gráficos do app realmente usam (barra,
// pizza/donut, grid, tooltip, renderer canvas) — o pacote `echarts`
// completo inclui muitos tipos de gráfico/componentes (mapa, 3D, ...) que
// nunca usamos aqui. `use` é idempotente, então cada arquivo de gráfico
// pode importar este módulo sem se preocupar em registrar duas vezes.
echarts.use([EChartsBarSeries, EChartsPieSeries, GridComponent, TooltipComponent, CanvasRenderer])

export { echarts }

/** Lê um design token de cor (`--th-text`, `--chart-1`, ...) já resolvido
 * pro tema atual — ECharts desenha em canvas, então precisa da cor literal
 * (não entende `var(--x)` como o CSS/Tailwind do resto do app entende). */
export function readCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/** Resolve qualquer valor de cor CSS válido (`var(--x)`, `#hex`, nome, ...)
 * pro rgb() literal que o browser calcularia — mesma necessidade de
 * readCssVar, só que pra constantes que já guardam a expressão `var(--x)`
 * inteira (ex.: STATUS_COLOR/TYPE_COLORS em DashboardCharts.tsx, também
 * usadas como `style={{backgroundColor}}` de verdade na legenda ao lado). */
export function resolveCssColor(value: string): string {
  const probe = document.createElement('div')
  probe.style.color = value
  document.body.appendChild(probe)
  const resolved = getComputedStyle(probe).color
  probe.remove()
  return resolved
}

/** Cria, redimensiona e descarta a instância do ECharts — mesmo ciclo de
 * vida pra qualquer gráfico (barra, pizza, ...), independente da `option`
 * que cada um monta. Devolve o ref da instância; quem chama aplica
 * `chart.setOption(...)` no próprio efeito de dados/tema. */
export function useEChartsInstance(containerRef: RefObject<HTMLDivElement | null>) {
  const chartRef = useRef<echarts.ECharts | null>(null)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init/dispose só no mount/unmount; dados/tema são aplicados via setOption por quem usa o ref.
  }, [])

  return chartRef
}

interface TooltipRow {
  color: string
  label: string
  value: string
}

/** Monta o HTML do tooltip com a mesma linguagem visual do ChartTooltip
 * (recharts) que este substitui: valor em negrito primeiro, nome da série
 * em seguida, sempre em texto neutro (nunca a cor da série no texto). O
 * tooltip do ECharts é um <div> real sobreposto à página (não faz parte do
 * canvas), então cores literais aqui são só por consistência com o resto
 * do gráfico — o browser resolveria var(--x) normalmente se precisássemos. */
export function chartTooltipHtml(rows: TooltipRow[]): string {
  const textMuted = readCssVar('--th-text-muted')
  const border = readCssVar('--th-border')
  const bgCard = readCssVar('--th-bg-card')
  const text = readCssVar('--th-text')

  const body = rows
    .map(
      (row) => `
        <div style="display:flex;align-items:center;gap:8px;font-size:13px;">
          <span style="width:8px;height:8px;border-radius:9999px;flex-shrink:0;background:${row.color}"></span>
          <span style="font-weight:600;color:${text}">${row.value}</span>
          <span style="color:${textMuted}">${row.label}</span>
        </div>`,
    )
    .join('')
  return `<div style="border:1px solid ${border};background:${bgCard};border-radius:8px;padding:8px 12px;box-shadow:0 10px 15px -3px rgb(0 0 0 / 0.3);">${body}</div>`
}

/** Paleta categórica fixa do app (ver o comentário em index.css) — ordem de
 * slot nunca reatribuída por dado. */
export const DEFAULT_COLOR_VARS = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5', '--chart-6']
