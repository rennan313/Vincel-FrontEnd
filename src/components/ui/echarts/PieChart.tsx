import { useEffect, useRef } from 'react'
import type { ComposeOption } from 'echarts/core'
import type { PieSeriesOption } from 'echarts/charts'
import type { TooltipComponentOption } from 'echarts/components'
import { cn } from '@/lib/cn'
import { chartTooltipHtml, readCssVar, useEChartsInstance } from './shared'

type EChartsOption = ComposeOption<PieSeriesOption | TooltipComponentOption>

export interface PieSlice {
  key: string
  label: string
  value: number
  color: string
}

interface PieChartProps {
  slices: PieSlice[]
  valueFormatter?: (value: number) => string
  className?: string
}

/** Donut baseado no Apache ECharts (ver ./shared.ts pro registro de módulos
 * e o dispose/resize compartilhado com BarChart). Sem legenda própria — as
 * telas que usam isso (StatusDonut/TypeDonut em DashboardCharts.tsx) já têm
 * sua própria lista lateral, deliberadamente fora do gráfico. Sem label nas
 * fatias, só o corte (borda na cor do card) pra separar visualmente. */
export function PieChart({ slices, valueFormatter, className }: PieChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useEChartsInstance(containerRef)

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    const bgCard = readCssVar('--th-bg-card')
    const format = valueFormatter ?? ((value: number) => value.toLocaleString('pt-BR'))

    const option: EChartsOption = {
      tooltip: {
        trigger: 'item',
        borderWidth: 0,
        backgroundColor: 'transparent',
        padding: 0,
        extraCssText: 'box-shadow: none;',
        formatter: (params) => {
          const p = Array.isArray(params) ? params[0] : params
          if (!p) return ''
          return chartTooltipHtml([{ color: String(p.color), label: String(p.name), value: format(Number(p.value)) }])
        },
      },
      series: [
        {
          type: 'pie',
          radius: ['60%', '89%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          label: { show: false },
          labelLine: { show: false },
          emphasis: { scale: false },
          itemStyle: { borderColor: bgCard, borderWidth: 2 },
          data: slices.map((slice) => ({ name: slice.label, value: slice.value, itemStyle: { color: slice.color } })),
        },
      ],
    }

    chart.setOption(option, { notMerge: true })
  }, [chartRef, slices, valueFormatter])

  // overflow-hidden+outline-none: o Chrome trata uma região com overflow/
  // scroll (mesmo 1px de arredondamento entre o canvas do ECharts e este
  // container) como focável por clique nativamente, pra permitir rolagem
  // por teclado — mostra o anel de foco padrão em volta do gráfico inteiro.
  // Nada aqui é navegável por teclado de verdade, então suprime os dois.
  return <div ref={containerRef} className={cn(className, 'overflow-hidden outline-none')} />
}
