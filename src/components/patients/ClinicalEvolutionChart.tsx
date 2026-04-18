import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ClinicalData } from '@/hooks/usePatientData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowDown, ArrowUp, Minus, TrendingUp } from 'lucide-react';

interface ClinicalEvolutionChartProps {
  clinicalData: ClinicalData[];
}

type TimeFilter = '1m' | '3m' | '6m' | '1y' | 'all';

type Trend = 'up' | 'down' | 'stable';

type ClinicalPoint = ClinicalData & {
  date: string;
  fullDate: string;
};

type MetricSeries = {
  color: string;
  key: keyof ClinicalPoint;
  label: string;
};

type ReferenceLine = {
  color: string;
  label: string;
  value: number;
};

type ChartTabConfig = {
  chartTitle: string;
  description: string;
  referenceLines?: ReferenceLine[];
  series: MetricSeries[];
  valueFormatter?: (value: number) => string;
};

const TIME_FILTERS: Array<{ label: string; value: TimeFilter }> = [
  { value: '1m', label: '1 mes' },
  { value: '3m', label: '3 meses' },
  { value: '6m', label: '6 meses' },
  { value: '1y', label: '1 ano' },
  { value: 'all', label: 'Tudo' },
];

const CHART_TABS: Record<'weight' | 'bmi' | 'bp' | 'hr', ChartTabConfig> = {
  weight: {
    chartTitle: 'Evolucao do Peso (kg)',
    description: 'Historico de peso ao longo do periodo selecionado.',
    series: [{ key: 'weight_kg', label: 'Peso (kg)', color: '#2563eb' }],
    valueFormatter: (value) => `${value.toFixed(1)} kg`,
  },
  bmi: {
    chartTitle: 'Evolucao do IMC',
    description: 'Faixas de referencia para peso corporal.',
    referenceLines: [
      { value: 18.5, label: 'Baixo peso', color: '#10b981' },
      { value: 25, label: 'Normal', color: '#10b981' },
      { value: 30, label: 'Sobrepeso', color: '#f59e0b' },
    ],
    series: [{ key: 'bmi', label: 'IMC', color: '#8b5cf6' }],
    valueFormatter: (value) => value.toFixed(1),
  },
  bp: {
    chartTitle: 'Evolucao da Pressao Arterial (mmHg)',
    description: 'Comparativo entre pressao sistolica e diastolica.',
    series: [
      { key: 'blood_pressure_systolic', label: 'Sistolica', color: '#ef4444' },
      { key: 'blood_pressure_diastolic', label: 'Diastolica', color: '#2563eb' },
    ],
    valueFormatter: (value) => `${Math.round(value)} mmHg`,
  },
  hr: {
    chartTitle: 'Evolucao da Frequencia Cardiaca (bpm)',
    description: 'Faixa de referencia usual para adultos em repouso.',
    referenceLines: [
      { value: 60, label: 'Min normal', color: '#10b981' },
      { value: 100, label: 'Max normal', color: '#10b981' },
    ],
    series: [{ key: 'heart_rate', label: 'FC (bpm)', color: '#ec4899' }],
    valueFormatter: (value) => `${Math.round(value)} bpm`,
  },
};

export function ClinicalEvolutionChart({ clinicalData }: ClinicalEvolutionChartProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('6m');

  const filteredData = useMemo<ClinicalPoint[]>(() => {
    if (!clinicalData.length) return [];

    const now = new Date();
    const filterDate = (() => {
      switch (timeFilter) {
        case '1m':
          return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case '3m':
          return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        case '6m':
          return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        case '1y':
          return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        default:
          return new Date(0);
      }
    })();

    return [...clinicalData]
      .filter((entry) => new Date(entry.measurement_date) >= filterDate)
      .sort(
        (left, right) =>
          new Date(left.measurement_date).getTime() - new Date(right.measurement_date).getTime(),
      )
      .map((entry) => ({
        ...entry,
        date: format(new Date(entry.measurement_date), 'dd/MM', { locale: ptBR }),
        fullDate: format(new Date(entry.measurement_date), 'dd/MM/yyyy', { locale: ptBR }),
      }));
  }, [clinicalData, timeFilter]);

  const latestMeasurements = useMemo(() => {
    if (!clinicalData.length) return null;

    const latest = clinicalData[0];
    const previous = clinicalData[1];

    return {
      weight: {
        current: latest.weight_kg,
        comparison: getComparison(latest.weight_kg, previous?.weight_kg),
      },
      bmi: {
        current: latest.bmi,
        comparison: getComparison(latest.bmi, previous?.bmi),
      },
      bloodPressure: {
        current:
          latest.blood_pressure_systolic && latest.blood_pressure_diastolic
            ? `${latest.blood_pressure_systolic}/${latest.blood_pressure_diastolic}`
            : null,
      },
      heartRate: {
        current: latest.heart_rate,
        comparison: getComparison(latest.heart_rate, previous?.heart_rate),
      },
    };
  }, [clinicalData]);

  if (!clinicalData.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <TrendingUp className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>Nenhum dado clinico registrado ainda</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Evolucao Clinica</h3>
        <div className="flex flex-wrap gap-2">
          {TIME_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              variant={timeFilter === filter.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {latestMeasurements && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ultima Medicao</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <SummaryMetric
                label="Peso"
                trend={latestMeasurements.weight.comparison?.trend}
                value={
                  latestMeasurements.weight.current
                    ? `${latestMeasurements.weight.current} kg`
                    : 'N/A'
                }
              />
              <SummaryMetric
                label="IMC"
                trend={latestMeasurements.bmi.comparison?.trend}
                value={latestMeasurements.bmi.current || 'N/A'}
              />
              <SummaryMetric
                label="Pressao Arterial"
                value={latestMeasurements.bloodPressure.current || 'N/A'}
              />
              <SummaryMetric
                label="FC"
                trend={latestMeasurements.heartRate.comparison?.trend}
                value={
                  latestMeasurements.heartRate.current
                    ? `${latestMeasurements.heartRate.current} bpm`
                    : 'N/A'
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="weight" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="weight">Peso</TabsTrigger>
          <TabsTrigger value="bmi">IMC</TabsTrigger>
          <TabsTrigger value="bp">Pressao</TabsTrigger>
          <TabsTrigger value="hr">FC</TabsTrigger>
        </TabsList>

        {(Object.entries(CHART_TABS) as Array<[keyof typeof CHART_TABS, ChartTabConfig]>).map(
          ([tabKey, config]) => (
            <TabsContent key={tabKey} value={tabKey}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{config.chartTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                  <LegendRow
                    referenceLines={config.referenceLines}
                    series={config.series}
                  />
                  <ClinicalLineChart
                    data={filteredData}
                    referenceLines={config.referenceLines}
                    series={config.series}
                    valueFormatter={config.valueFormatter}
                  />
                  <MeasurementTable
                    data={filteredData}
                    series={config.series}
                    valueFormatter={config.valueFormatter}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          ),
        )}
      </Tabs>
    </div>
  );
}

function SummaryMetric({
  label,
  trend,
  value,
}: {
  label: string;
  trend?: Trend;
  value: number | string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <p className="text-lg font-semibold">{value}</p>
        {trend ? <ComparisonIcon trend={trend} /> : null}
      </div>
    </div>
  );
}

function ComparisonIcon({ trend }: { trend: Trend }) {
  if (trend === 'up') return <ArrowUp className="h-3 w-3 text-red-500" />;
  if (trend === 'down') return <ArrowDown className="h-3 w-3 text-green-500" />;
  return <Minus className="h-3 w-3 text-gray-500" />;
}

function ClinicalLineChart({
  data,
  referenceLines = [],
  series,
  valueFormatter,
}: {
  data: ClinicalPoint[];
  referenceLines?: ReferenceLine[];
  series: MetricSeries[];
  valueFormatter?: (value: number) => string;
}) {
  const visibleData = data.filter((entry) =>
    series.some((item) => typeof entry[item.key] === 'number'),
  );

  if (!visibleData.length) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
        Nenhum valor disponivel neste periodo para essa metrica.
      </div>
    );
  }

  const width = 760;
  const height = 320;
  const padding = { top: 20, right: 24, bottom: 42, left: 48 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const values = [
    ...visibleData.flatMap((entry) =>
      series
        .map((item) => entry[item.key])
        .filter((value): value is number => typeof value === 'number'),
    ),
    ...referenceLines.map((line) => line.value),
  ];

  const { maxValue, minValue } = getValueDomain(values);
  const xStep = visibleData.length > 1 ? chartWidth / (visibleData.length - 1) : 0;
  const gridValues = buildGridValues(minValue, maxValue);

  const getX = (index: number) =>
    visibleData.length > 1 ? padding.left + index * xStep : padding.left + chartWidth / 2;
  const getY = (value: number) =>
    padding.top + chartHeight - ((value - minValue) / (maxValue - minValue || 1)) * chartHeight;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <svg
        aria-label="Grafico de evolucao clinica"
        className="h-auto w-full"
        viewBox={`0 0 ${width} ${height}`}
      >
        <rect fill="transparent" height={height} width={width} x="0" y="0" />

        {gridValues.map((value) => {
          const y = getY(value);
          return (
            <g key={`grid-${value}`}>
              <line
                stroke="currentColor"
                strokeDasharray="4 4"
                strokeOpacity="0.12"
                x1={padding.left}
                x2={padding.left + chartWidth}
                y1={y}
                y2={y}
              />
              <text
                className="fill-muted-foreground text-[11px]"
                textAnchor="end"
                x={padding.left - 8}
                y={y + 4}
              >
                {formatAxisValue(value)}
              </text>
            </g>
          );
        })}

        {referenceLines.map((line) => {
          const y = getY(line.value);
          return (
            <g key={`reference-${line.label}-${line.value}`}>
              <line
                stroke={line.color}
                strokeDasharray="6 6"
                strokeOpacity="0.65"
                x1={padding.left}
                x2={padding.left + chartWidth}
                y1={y}
                y2={y}
              />
              <text
                fill={line.color}
                fontSize="11"
                textAnchor="end"
                x={padding.left + chartWidth - 4}
                y={y - 6}
              >
                {line.label}
              </text>
            </g>
          );
        })}

        {series.map((item) => {
          const points = visibleData
            .map((entry, index) => {
              const value = entry[item.key];
              if (typeof value !== 'number') return null;
              return {
                date: entry.date,
                fullDate: entry.fullDate,
                value,
                x: getX(index),
                y: getY(value),
              };
            })
            .filter((point): point is NonNullable<typeof point> => point !== null);

          if (!points.length) return null;

          return (
            <g key={item.label}>
              <polyline
                fill="none"
                points={points.map((point) => `${point.x},${point.y}`).join(' ')}
                stroke={item.color}
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="3"
              />
              {points.map((point) => (
                <g key={`${item.label}-${point.fullDate}`}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    fill={item.color}
                    r="4"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <title>
                    {item.label}: {valueFormatter ? valueFormatter(point.value) : point.value} em{' '}
                    {point.fullDate}
                  </title>
                </g>
              ))}
            </g>
          );
        })}

        {visibleData.map((entry, index) => (
          <text
            key={`label-${entry.fullDate}`}
            className="fill-muted-foreground text-[11px]"
            textAnchor="middle"
            x={getX(index)}
            y={height - 12}
          >
            {entry.date}
          </text>
        ))}
      </svg>
    </div>
  );
}

function LegendRow({
  referenceLines = [],
  series,
}: {
  referenceLines?: ReferenceLine[];
  series: MetricSeries[];
}) {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      {series.map((item) => (
        <div key={item.label} className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span>{item.label}</span>
        </div>
      ))}
      {referenceLines.map((item) => (
        <div key={item.label} className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1">
          <span
            className="h-0.5 w-4"
            style={{ backgroundColor: item.color }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function MeasurementTable({
  data,
  series,
  valueFormatter,
}: {
  data: ClinicalPoint[];
  series: MetricSeries[];
  valueFormatter?: (value: number) => string;
}) {
  const recentData = [...data]
    .reverse()
    .filter((entry) => series.some((item) => typeof entry[item.key] === 'number'))
    .slice(0, 5);

  if (!recentData.length) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[520px] text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Data</th>
            {series.map((item) => (
              <th key={item.label} className="px-3 py-2 font-medium">
                {item.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {recentData.map((entry) => (
            <tr key={entry.id} className="border-t border-border">
              <td className="px-3 py-2">{entry.fullDate}</td>
              {series.map((item) => {
                const value = entry[item.key];
                const content =
                  typeof value === 'number'
                    ? valueFormatter
                      ? valueFormatter(value)
                      : value.toLocaleString('pt-BR')
                    : '-';

                return (
                  <td key={`${entry.id}-${item.label}`} className="px-3 py-2">
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getComparison(current?: number | null, previous?: number | null) {
  if (typeof current !== 'number' || typeof previous !== 'number') return null;

  const diff = current - previous;

  return {
    diff,
    percentage: previous === 0 ? null : ((diff / previous) * 100).toFixed(1),
    trend: diff > 0 ? ('up' as const) : diff < 0 ? ('down' as const) : ('stable' as const),
  };
}

function getValueDomain(values: number[]) {
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  if (minValue === maxValue) {
    const padding = Math.max(1, Math.abs(minValue) * 0.1);
    return {
      maxValue: maxValue + padding,
      minValue: Math.max(0, minValue - padding),
    };
  }

  const span = maxValue - minValue;
  const padding = span * 0.12;

  return {
    maxValue: maxValue + padding,
    minValue: Math.max(0, minValue - padding),
  };
}

function buildGridValues(minValue: number, maxValue: number) {
  const steps = 4;
  const stepValue = (maxValue - minValue) / steps;

  return Array.from({ length: steps + 1 }, (_, index) => minValue + stepValue * index);
}

function formatAxisValue(value: number) {
  if (Math.abs(value) >= 100) {
    return Math.round(value).toString();
  }

  if (Math.abs(value) >= 10) {
    return value.toFixed(1);
  }

  return value.toFixed(2);
}
