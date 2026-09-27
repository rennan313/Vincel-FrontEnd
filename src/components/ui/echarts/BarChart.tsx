import { useEffect, useRef } from 'react'
import type { ComposeOption } from 'echarts/core'
import type { BarSeriesOption } from 'echarts/charts'
import type { GridComponentOption, TooltipComponentOption } from 'echarts/components'
import { cn } from '@/lib/cn'
import { useThemeStore } from '@/store/themeStore'
import { chartTooltipHtml, DEFAULT_COLOR_VARS, readCssVar, useEChartsInstance } from './shared'

type EChartsOption = ComposeOption<BarSeriesOption | GridComponentOption | TooltipComponentOption>

interface BarChartProps {
  data: Record<string, string | number>[]
  index: string
  categories: string[]
  /** Nomes de custom properties de cor (ex.: '--chart-1'), uma por categoria
   * em `categories`, na mesma ordem — nunca reatribuídas por dado, ver o
   * comentário da paleta em index.css. */
  colors?: string[]
  /** Formata o valor no tooltip — padrão: número pt-BR puro. */
  valueFormatter?: (value: number) => string
  /** Formata os rótulos do eixo Y — padrão: mesmo que valueFormatter. Usado
   * quando o tooltip precisa do valor completo (ex. "R$ 30.000,00") mas o
   * eixo fica melhor compacto (ex. "30.000"), como em MonthlyBarChart. */
  axisFormatter?: (value: number) => string
  /** Largura máxima de cada barra — barras de um dashboard condensado
   * (várias no mesmo card) costumam querer algo mais estreito que a barra
   * "de destaque" de uma aba cheia. */
  barMaxWidth?: number
  /** Permite ticks fracionários no eixo Y — padrão `false`, já que nenhum
   * dos nossos dados (contagem de projetos, valores em reais) faz sentido
   * fracionado (equivalente ao antigo `allowDecimals={false}` do recharts,
   * que a MonthlyBarChart do Dashboard sempre setava). */
  allowDecimals?: boolean
  className?: string
}

/** Gráfico de barras baseado no Apache ECharts (import modular: só barra +
 * grid + tooltip + renderer canvas, ver ./shared.ts). Cores/eixos são
 * recalculados a cada render a partir dos nossos design tokens
 * (`--th-*`/`--chart-*`), inclusive quando o tema muda — diferente de um
 * SVG/Tailwind puro, o canvas do ECharts não segue `var(--x)` sozinho. */
export function BarChart({
  data,
  index,
  categories,
  colors = DEFAULT_COLOR_VARS,
  valueFormatter,
  axisFormatter,
  barMaxWidth = 56,
  allowDecimals = false,
  className,
}: BarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useEChartsInstance(containerRef)
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    const textMuted = readCssVar('--th-text-muted')
    const border = readCssVar('--th-border')
    const format = valueFormatter ?? ((value: number) => value.toLocaleString('pt-BR'))
    const formatAxis = axisFormatter ?? format

    const option: EChartsOption = {
      grid: { left: 8, right: 8, top: 16, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        borderWidth: 0,
        backgroundColor: 'transparent',
        padding: 0,
        extraCssText: 'box-shadow: none;',
        formatter: (params) =>
          chartTooltipHtml(
            (Array.isArray(params) ? params : [params]).map((p) => ({
              color: String(p.color),
              label: String(p.seriesName),
              value: format(Number(p.value)),
            })),
          ),
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
        minInterval: allowDecimals ? undefined : 1,
        splitLine: { lineStyle: { color: border } },
        axisLabel: { color: textMuted, fontSize: 12, formatter: (value: number) => formatAxis(value) },
      },
      series: categories.map((category, i) => ({
        name: category,
        type: 'bar',
        data: data.map((row) => Number(row[category])),
        color: readCssVar(colors[i % colors.length] ?? '--chart-1'),
        barMaxWidth,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
      })),
    }

    chart.setOption(option, { notMerge: true })
  }, [chartRef, data, index, categories, colors, valueFormatter, axisFormatter, barMaxWidth, allowDecimals, theme])

  // overflow-hidden+outline-none: o Chrome trata uma região com overflow/
  // scroll (mesmo 1px de arredondamento entre o canvas do ECharts e este
  // container) como focável por clique nativamente, pra permitir rolagem
  // por teclado — mostra o anel de foco padrão em volta do gráfico inteiro.
  // Nada aqui é navegável por teclado de verdade, então suprime os dois.
  return <div ref={containerRef} className={cn(className, 'overflow-hidden outline-none')} />
}
